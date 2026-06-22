const executionService = require('../services/executionService');

const executionController = {
  listExecutions: async (req, res, next) => {
    try {
      const executions = await executionService.listExecutions(req.user.id, req.query);
      return res.status(200).json({
        success: true,
        executions,
      });
    } catch (error) {
      next(error);
    }
  },

  getExecutionById: async (req, res, next) => {
    try {
      const execution = await executionService.getExecutionById(req.user.id, req.params.id);
      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Execution record not found or access denied.',
        });
      }
      return res.status(200).json({
        success: true,
        execution,
      });
    } catch (error) {
      next(error);
    }
  },

  getTimeline: async (req, res, next) => {
    try {
      // Validate permission first
      const execution = await executionService.getExecutionById(req.user.id, req.params.id);
      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Execution record not found or access denied.',
        });
      }

      const timeline = await executionService.getTimeline(req.params.id);
      return res.status(200).json({
        success: true,
        timeline,
      });
    } catch (error) {
      next(error);
    }
  },

  pauseExecution: async (req, res, next) => {
    try {
      const success = await executionService.pauseExecution(req.user.id, req.params.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Failed to pause execution: Record not found.',
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Execution pause requested.',
      });
    } catch (error) {
      next(error);
    }
  },

  resumeExecution: async (req, res, next) => {
    try {
      const success = await executionService.resumeExecution(req.user.id, req.params.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Failed to resume execution: Record not found.',
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Execution resume requested.',
      });
    } catch (error) {
      next(error);
    }
  },

  cancelExecution: async (req, res, next) => {
    try {
      const success = await executionService.cancelExecution(req.user.id, req.params.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Failed to cancel execution: Record not found.',
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Execution cancellation requested.',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = executionController;
