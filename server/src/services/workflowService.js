const { getWorkflowModel } = require('../models/Workflow');

class WorkflowService {
  async getDashboardMetrics(userId) {
    const Workflow = getWorkflowModel();
    const { getExecutionModel } = require('../models/Execution');
    const Execution = getExecutionModel();
    const { getExecutionLogModel } = require('../models/ExecutionLog');
    const ExecutionLog = getExecutionLogModel();

    // Query active workflows and execution history
    const totalWorkflows = await Workflow.countDocuments({ owner: userId });
    const activeWorkflows = await Workflow.countDocuments({ owner: userId, status: 'active' });
    const pausedWorkflows = await Workflow.countDocuments({ owner: userId, status: 'paused' });
    
    // Executions metrics - query based on triggeredBy
    const totalExecutions = await Execution.countDocuments({ triggeredBy: userId });
    const completedExecutions = await Execution.countDocuments({ triggeredBy: userId, status: 'COMPLETED' });

    let successRate = 100;
    if (totalExecutions > 0) {
      successRate = Math.round((completedExecutions / totalExecutions) * 100);
    }

    const stats = {
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      successRate,
    };

    // Get recent workflows
    let recentWorkflows = await Workflow.find({ owner: userId });
    recentWorkflows = recentWorkflows
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);

    // Get recent activity logs
    let logs = [];
    try {
      const userWorkflows = await Workflow.find({ owner: userId });
      const userWfIds = userWorkflows.map(w => w._id.toString());
      
      const allLogs = await ExecutionLog.find({});
      logs = allLogs.filter(l => l.workflow && userWfIds.includes(l.workflow.toString()));
    } catch (e) {
      console.error('Error fetching logs for dashboard metrics:', e);
    }

    logs = logs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const activityFeed = logs.map(l => {
      const timeDiff = new Date() - new Date(l.createdAt);
      let timeLabel = 'Just now';
      const mins = Math.floor(timeDiff / 60000);
      if (mins > 0) {
        timeLabel = mins === 1 ? '1 min ago' : `${mins} mins ago`;
      }
      return {
        id: l._id.toString(),
        agent: l.agent,
        message: l.message,
        time: timeLabel,
      };
    });

    return {
      stats,
      recentWorkflows,
      activityFeed,
    };
  }

  async listWorkflows(userId, query = {}) {
    const Workflow = getWorkflowModel();
    // Search filter
    const searchFilter = { owner: userId };
    if (query.status) {
      searchFilter.status = query.status;
    }
    
    let workflows = await Workflow.find(searchFilter);
    
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      workflows = workflows.filter(w => searchRegex.test(w.name) || searchRegex.test(w.description));
    }
    
    return workflows;
  }

  async createWorkflow(userId, data) {
    const Workflow = getWorkflowModel();
    const newWorkflow = await Workflow.create({
      ...data,
      owner: userId,
    });
    return newWorkflow;
  }

  async getWorkflowById(userId, id) {
    const Workflow = getWorkflowModel();
    const workflow = await Workflow.findById(id);
    if (!workflow || workflow.owner.toString() !== userId.toString()) {
      return null;
    }
    return workflow;
  }

  async updateWorkflow(userId, id, data) {
    const Workflow = getWorkflowModel();
    // Ensure owner check
    const workflow = await Workflow.findById(id);
    if (!workflow || workflow.owner.toString() !== userId.toString()) {
      return null;
    }

    // Increment version if nodes/edges change
    const sets = { ...data };
    if (data.nodes || data.edges) {
      sets.version = (workflow.version || 1) + 1;
    }

    const updated = await Workflow.findByIdAndUpdate(id, { $set: sets }, { new: true });
    return updated;
  }

  async duplicateWorkflow(userId, id) {
    const Workflow = getWorkflowModel();
    const workflow = await Workflow.findById(id);
    if (!workflow || workflow.owner.toString() !== userId.toString()) {
      return null;
    }

    const duplicated = await Workflow.create({
      name: `${workflow.name} (Copy)`,
      description: workflow.description,
      owner: userId,
      status: 'draft',
      trigger: workflow.trigger,
      nodes: workflow.nodes,
      edges: workflow.edges,
      version: 1,
      tags: workflow.tags,
    });

    return duplicated;
  }

  async deleteWorkflow(userId, id) {
    const Workflow = getWorkflowModel();
    const workflow = await Workflow.findById(id);
    if (!workflow || workflow.owner.toString() !== userId.toString()) {
      return null;
    }

    await Workflow.findByIdAndDelete(id);
    return workflow;
  }
}

module.exports = new WorkflowService();
