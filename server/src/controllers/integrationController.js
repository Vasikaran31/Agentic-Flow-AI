const integrationService = require('../services/integrationService');
const env = require('../config/env');

const integrationController = {
  getStatus: async (req, res, next) => {
    try {
      const status = await integrationService.getStatus(req.user.id);
      return res.status(200).json({
        success: true,
        status,
      });
    } catch (error) {
      next(error);
    }
  },

  saveManualCredentials: async (req, res, next) => {
    try {
      const { provider, credentials } = req.body;
      if (!provider || !credentials) {
        return res.status(400).json({
          success: false,
          error: 'Provider and credentials are required.',
        });
      }

      await integrationService.saveManualCredentials(req.user.id, provider, credentials);
      return res.status(200).json({
        success: true,
        message: 'Credentials saved successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  disconnectProvider: async (req, res, next) => {
    try {
      const { provider } = req.body;
      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider name is required.',
        });
      }

      await integrationService.disconnectProvider(req.user.id, provider);
      return res.status(200).json({
        success: true,
        message: 'Provider disconnected successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  startOAuth: async (req, res, next) => {
    try {
      const { provider } = req.params;
      const startUrl = integrationService.getOAuthStartUrl(provider, req.user.id);
      return res.status(200).json({
        success: true,
        url: startUrl,
      });
    } catch (error) {
      next(error);
    }
  },

  oauthCallback: async (req, res, next) => {
    try {
      const { provider } = req.params;
      const { code, state } = req.query; // state holds the userId in our mock startUrl

      if (!state) {
        return res.redirect(`${env.CLIENT_URL}/integrations?error=missing_state`);
      }

      await integrationService.handleOAuthCallback(provider, code, state);
      
      // Redirect back to NextJS integrations panel
      return res.redirect(`${env.CLIENT_URL}/integrations?success=connected`);
    } catch (error) {
      console.error('OAuth callback exchange failure:', error);
      return res.redirect(`${env.CLIENT_URL}/integrations?error=oauth_exchange_failed`);
    }
  },
};

module.exports = integrationController;
