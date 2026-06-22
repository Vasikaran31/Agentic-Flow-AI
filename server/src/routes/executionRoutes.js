const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const executionController = require('../controllers/executionController');

const router = express.Router();

// Apply authentication to all execution routes
router.use(authMiddleware);

// GET list executions
router.get('/', executionController.listExecutions);

// GET single execution details
router.get('/:id', executionController.getExecutionById);

// GET timeline execution logs
router.get('/:id/timeline', executionController.getTimeline);

// POST execution status actions
router.post('/:id/pause', executionController.pauseExecution);
router.post('/:id/resume', executionController.resumeExecution);
router.post('/:id/cancel', executionController.cancelExecution);

module.exports = router;
