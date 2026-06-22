const workflowService = require('../services/workflowService');

const workflowController = {
  getDashboardMetrics: async (req, res, next) => {
    try {
      const data = await workflowService.getDashboardMetrics(req.user.id);
      return res.status(200).json({
        success: true,
        stats: data.stats,
        recentWorkflows: data.recentWorkflows,
        activityFeed: data.activityFeed,
      });
    } catch (error) {
      next(error);
    }
  },

  listWorkflows: async (req, res, next) => {
    try {
      const workflows = await workflowService.listWorkflows(req.user.id, req.query);
      return res.status(200).json({
        success: true,
        workflows,
      });
    } catch (error) {
      next(error);
    }
  },

  createWorkflow: async (req, res, next) => {
    try {
      const workflow = await workflowService.createWorkflow(req.user.id, req.body);
      return res.status(201).json({
        success: true,
        workflow,
      });
    } catch (error) {
      next(error);
    }
  },

  getWorkflowById: async (req, res, next) => {
    try {
      const workflow = await workflowService.getWorkflowById(req.user.id, req.params.id);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found',
        });
      }
      return res.status(200).json({
        success: true,
        workflow,
      });
    } catch (error) {
      next(error);
    }
  },

  updateWorkflow: async (req, res, next) => {
    try {
      const workflow = await workflowService.updateWorkflow(req.user.id, req.params.id, req.body);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found',
        });
      }
      return res.status(200).json({
        success: true,
        workflow,
      });
    } catch (error) {
      next(error);
    }
  },

  duplicateWorkflow: async (req, res, next) => {
    try {
      const workflow = await workflowService.duplicateWorkflow(req.user.id, req.params.id);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found',
        });
      }
      return res.status(201).json({
        success: true,
        workflow,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteWorkflow: async (req, res, next) => {
    try {
      const workflow = await workflowService.deleteWorkflow(req.user.id, req.params.id);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found',
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Workflow deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  executeWorkflow: async (req, res, next) => {
    try {
      const workflow = await workflowService.getWorkflowById(req.user.id, req.params.id);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found',
        });
      }

      // We'll require executionService which we will implement soon
      const executionService = require('../services/executionService');
      const execution = await executionService.triggerWorkflow(workflow, req.user.id, req.body.input);

      return res.status(200).json({
        success: true,
        message: 'Execution triggered successfully',
        executionId: execution._id,
        execution,
      });
    } catch (error) {
      next(error);
    }
  },

  generateWorkflow: async (req, res, next) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required',
        });
      }

      const aiService = require('../services/aiService');
      const generatedGraph = await aiService.generateWorkflowFromPrompt(prompt);

      // Save to database to persist and get an _id
      const savedWorkflow = await workflowService.createWorkflow(req.user.id, generatedGraph);

      return res.status(200).json({
        success: true,
        workflow: savedWorkflow,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = workflowController;
