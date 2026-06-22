const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const integrationController = require('../controllers/integrationController');

const router = express.Router();

// OAuth callback is loaded without Bearer header since it handles the redirect from provider dashboard.
// Authenticity is secured via the state parameter tracking.
router.get('/oauth/:provider/callback', integrationController.oauthCallback);

// Apply auth middleware to all remaining endpoints
router.use(authMiddleware);

// GET status list
router.get('/status', integrationController.getStatus);

// POST manual save credentials
router.post('/', integrationController.saveManualCredentials);

// POST disconnect integration provider
router.post('/disconnect', integrationController.disconnectProvider);

// GET start OAuth sequence
router.get('/oauth/:provider/start', integrationController.startOAuth);

module.exports = router;
