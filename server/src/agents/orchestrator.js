const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');
const { getExecutionModel } = require('../models/Execution');
const { getWorkflowModel } = require('../models/Workflow');
const { getNotificationModel } = require('../models/Notification');

let langGraphStatus = 'not-installed';
try {
  require('@langchain/langgraph');
  langGraphStatus = 'available';
} catch (e) {
  langGraphStatus = 'not-installed';
}

class Orchestrator {
  constructor() {
    this.activeRuns = new Map(); // Keep in-memory references to active runs for quick cancellation or pause
  }

  async run(executionId, globalInput = {}) {
    const Execution = getExecutionModel();
    const Workflow = getWorkflowModel();
    const Notification = getNotificationModel();

    let execution = await Execution.findById(executionId);
    if (!execution) {
      console.error(`Orchestrator error: Execution "${executionId}" not found.`);
      return;
    }

    const workflow = await Workflow.findById(execution.workflow);
    const workflowId = workflow._id;
    const userId = execution.triggeredBy;

    // Set run status to running
    execution = await Execution.findByIdAndUpdate(executionId, {
      $set: {
        status: 'RUNNING',
        startedAt: new Date(),
        workflowSnapshot: workflow,
      }
    }, { new: true });

    await monitoringAgent.logEvent(executionId, {
      workflowId,
      agent: 'orchestrator',
      level: 'info',
      message: `Execution run triggered by user. Orchestration engine: LangGraph [${langGraphStatus}].`,
      metadata: { langGraph: langGraphStatus }
    });

    try {
      // 1. Planning Step
      const { executionOrder, confidence, error: planError } = await plannerAgent.plan(executionId, workflow);
      if (planError) {
        throw new Error(`Orchestrator Planning Error: ${planError}`);
      }

      // Store execution context (inputs/outputs of each node)
      const context = {
        globalInput,
      };

      // Register the active run state
      this.activeRuns.set(executionId.toString(), {
        status: 'RUNNING',
        currentNodeIdx: 0,
        executionOrder,
        context,
      });

      // 2. Loop through each node
      const activeState = this.activeRuns.get(executionId.toString());
      let aborted = false;

      while (activeState.currentNodeIdx < executionOrder.length) {
        // Fetch latest execution status from DB to inspect manual pause/cancel overrides
        const currentExec = await Execution.findById(executionId);
        if (currentExec.status === 'CANCELLED') {
          await monitoringAgent.logEvent(executionId, {
            workflowId,
            agent: 'orchestrator',
            level: 'warning',
            message: 'Execution cancel request detected. Aborting run.',
          });
          aborted = true;
          break;
        }

        if (currentExec.status === 'PAUSED') {
          await monitoringAgent.logEvent(executionId, {
            workflowId,
            agent: 'orchestrator',
            level: 'warning',
            message: 'Execution pause request detected. Suspending orchestrator thread.',
          });
          this.activeRuns.set(executionId.toString(), { ...activeState, status: 'PAUSED' });
          aborted = true;
          break;
        }

        const nodeId = executionOrder[activeState.currentNodeIdx];
        const node = workflow.nodes.find(n => n.id === nodeId);
        
        if (!node) {
          activeState.currentNodeIdx++;
          continue;
        }

        // Update DB current node
        await Execution.findByIdAndUpdate(executionId, { $set: { currentNode: nodeId } });

        // Skip branches dynamically if we evaluate conditional logic paths
        let shouldSkip = false;
        // If predecessor was a branch, verify target edge label
        if (activeState.currentNodeIdx > 0) {
          const prevNodeId = executionOrder[activeState.currentNodeIdx - 1];
          const prevNode = workflow.nodes.find(n => n.id === prevNodeId);
          if (prevNode && prevNode.type === 'conditionalBranch') {
            const decision = context[prevNodeId]?.decision; // 'Yes' or 'No'
            // Check edge matching
            const matchingEdge = workflow.edges.find(e => e.source === prevNodeId && e.target === nodeId);
            if (matchingEdge) {
              const edgeLabel = matchingEdge.label || matchingEdge.sourceHandle || '';
              if (edgeLabel && edgeLabel.toLowerCase() !== decision.toLowerCase()) {
                console.log(`[ORCHESTRATOR] Skipping node "${nodeId}" because path [${edgeLabel}] does not match branch evaluation [${decision}].`);
                shouldSkip = true;
              }
            }
          }
        }

        if (shouldSkip) {
          await monitoringAgent.logEvent(executionId, {
            workflowId,
            nodeId,
            agent: 'orchestrator',
            level: 'info',
            message: `Skipping node "${node.data?.label || nodeId}" based on branch decision tree.`,
          });
          activeState.currentNodeIdx++;
          continue;
        }

        // Execute step with retry/recovery support
        let nodeSuccess = false;
        let retryCount = 0;
        const maxRetries = 2;
        let nodeOutput = null;

        while (!nodeSuccess && retryCount <= maxRetries) {
          try {
            // Execution agent execution
            nodeOutput = await executionAgent.executeNode(executionId, workflowId, userId, node, context);
            
            // Validation agent verification
            const { valid, errors } = await validationAgent.validate(executionId, workflowId, node, nodeOutput);
            if (!valid) {
              throw new Error(`Validation Error: ${errors.join(', ')}`);
            }

            nodeSuccess = true;
          } catch (stepErr) {
            retryCount++;
            await Execution.findByIdAndUpdate(executionId, { $inc: { retryCount: 1 } });

            const recovery = await recoveryAgent.handleError(executionId, workflowId, node, stepErr);
            if (recovery.action === 'escalate' || retryCount > maxRetries) {
              // Create user alert notifications
              await Notification.create({
                owner: userId,
                workflow: workflowId,
                execution: executionId,
                type: 'failure',
                title: `Orchestrator Escalation: ${workflow.name}`,
                message: `Failed at step "${node.data?.label || node.id}": ${stepErr.message}`
              });

              throw stepErr;
            }

            // Delay for backoff
            await new Promise(resolve => setTimeout(resolve, recovery.nextRetryDelaySeconds * 1000));
            await monitoringAgent.logEvent(executionId, {
              workflowId,
              nodeId,
              agent: 'orchestrator',
              level: 'warning',
              message: `Retrying step "${node.data?.label || node.id}" (Attempt ${retryCount}/${maxRetries})...`,
            });
          }
        }

        // Save output to context
        context[nodeId] = nodeOutput;
        activeState.currentNodeIdx++;
      }

      this.activeRuns.delete(executionId.toString());

      if (!aborted) {
        // Complete execution status
        const endTime = new Date();
        const duration = Math.round((endTime - new Date(execution.startedAt)) / 1000);

        await Execution.findByIdAndUpdate(executionId, {
          $set: {
            status: 'COMPLETED',
            completedAt: endTime,
            duration,
            output: context,
          }
        });

        // Increment workflow execution stats
        await Workflow.findByIdAndUpdate(workflowId, {
          $set: { lastExecutedAt: endTime },
          $inc: { executionCount: 1 }
        });

        await Notification.create({
          owner: userId,
          workflow: workflowId,
          execution: executionId,
          type: 'success',
          title: `Execution Completed: ${workflow.name}`,
          message: `Visual workflow executed successfully in ${duration}s.`
        });

        await monitoringAgent.logEvent(executionId, {
          workflowId,
          agent: 'orchestrator',
          level: 'success',
          message: `Visual workflow execution completed successfully in ${duration}s.`,
        });
      }

    } catch (runError) {
      this.activeRuns.delete(executionId.toString());
      const endTime = new Date();
      const duration = execution.startedAt ? Math.round((endTime - new Date(execution.startedAt)) / 1000) : 0;

      await Execution.findByIdAndUpdate(executionId, {
        $set: {
          status: 'FAILED',
          completedAt: endTime,
          duration,
          error: runError.message,
        }
      });

      await monitoringAgent.logEvent(executionId, {
        workflowId,
        agent: 'orchestrator',
        level: 'error',
        message: `Visual workflow execution aborted due to run failure: ${runError.message}`,
      });
    }
  }

  // Handle manual state alterations
  async pauseRun(executionId) {
    const Execution = getExecutionModel();
    const run = this.activeRuns.get(executionId.toString());
    if (run) {
      run.status = 'PAUSED';
    }
    await Execution.findByIdAndUpdate(executionId, { $set: { status: 'PAUSED' } });
  }

  async resumeRun(executionId) {
    const Execution = getExecutionModel();
    // Re-trigger execution process
    const execObj = await Execution.findById(executionId);
    if (execObj && execObj.status === 'PAUSED') {
      await Execution.findByIdAndUpdate(executionId, { $set: { status: 'PENDING' } });
      // Call background run thread
      this.run(executionId, execObj.input);
    }
  }

  async cancelRun(executionId) {
    const Execution = getExecutionModel();
    const run = this.activeRuns.get(executionId.toString());
    if (run) {
      run.status = 'CANCELLED';
    }
    await Execution.findByIdAndUpdate(executionId, { $set: { status: 'CANCELLED' } });
  }
}

module.exports = new Orchestrator();
