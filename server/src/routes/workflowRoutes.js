const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const workflowController = require('../controllers/workflowController');

const router = express.Router();

// Apply auth middleware to all workflow routes
router.use(authMiddleware);

// GET dashboard metrics
router.get('/dashboard', workflowController.getDashboardMetrics);

// POST generate workflow from prompt
router.post('/generate', workflowController.generateWorkflow);

// GET list workflows, POST create manual workflow
router.route('/')
  .get(workflowController.listWorkflows)
  .post(workflowController.createWorkflow);

// GET, PUT, DELETE workflow by id
router.route('/:id')
  .get(workflowController.getWorkflowById)
  .put(workflowController.updateWorkflow)
  .delete(workflowController.deleteWorkflow);

// POST duplicate workflow
router.post('/:id/duplicate', workflowController.duplicateWorkflow);

// POST execute workflow
router.post('/:id/execute', workflowController.executeWorkflow);

module.exports = router;
