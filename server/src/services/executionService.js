const { getExecutionModel } = require('../models/Execution');
const { getWorkflowModel } = require('../models/Workflow');
const { getExecutionLogModel } = require('../models/ExecutionLog');
const queueService = require('../queues/workflowQueue');
const orchestrator = require('../agents/orchestrator');

class ExecutionService {
  async triggerWorkflow(workflow, userId, input = {}) {
    const Execution = getExecutionModel();
    
    // Create new Execution
    const execution = await Execution.create({
      workflow: workflow._id,
      status: 'PENDING',
      input,
      triggeredBy: userId,
      workflowSnapshot: workflow,
    });

    // Queue background processing
    await queueService.addExecution(execution._id, input);

    return execution;
  }

  async listExecutions(userId, query = {}) {
    const Execution = getExecutionModel();
    const Workflow = getWorkflowModel();

    // To check owner, we first get all workflows of the user
    const userWorkflows = await Workflow.find({ owner: userId });
    const wfIds = userWorkflows.map(w => w._id.toString());

    let executions = await Execution.find({});
    // Filter executions belonging to user's workflows
    executions = executions.filter(e => e.workflow && wfIds.includes(e.workflow.toString()));

    if (query.workflowId) {
      executions = executions.filter(e => e.workflow.toString() === query.workflowId.toString());
    }

    if (query.status) {
      executions = executions.filter(e => e.status === query.status);
    }

    // Sort by createdAt descending
    return executions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getExecutionById(userId, executionId) {
    const Execution = getExecutionModel();
    const Workflow = getWorkflowModel();

    const execution = await Execution.findById(executionId);
    if (!execution) return null;

    // Verify owner
    const workflow = await Workflow.findById(execution.workflow);
    if (!workflow || workflow.owner.toString() !== userId.toString()) {
      return null;
    }

    return execution;
  }

  async getTimeline(executionId) {
    const ExecutionLog = getExecutionLogModel();
    // Return all events sorted
    return await ExecutionLog.find({ execution: executionId });
  }

  async pauseExecution(userId, executionId) {
    const execution = await this.getExecutionById(userId, executionId);
    if (!execution) return false;

    await orchestrator.pauseRun(executionId);
    return true;
  }

  async resumeExecution(userId, executionId) {
    const execution = await this.getExecutionById(userId, executionId);
    if (!execution) return false;

    await orchestrator.resumeRun(executionId);
    return true;
  }

  async cancelExecution(userId, executionId) {
    const execution = await this.getExecutionById(userId, executionId);
    if (!execution) return false;

    await orchestrator.cancelRun(executionId);
    return true;
  }
}

module.exports = new ExecutionService();
