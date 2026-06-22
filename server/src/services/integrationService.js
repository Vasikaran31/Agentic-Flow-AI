const { getIntegrationModel } = require('../models/Integration');
const { encrypt } = require('../integrations/baseIntegration');
const env = require('../config/env');

class IntegrationService {
  async getStatus(userId) {
    const Integration = getIntegrationModel();
    const connections = await Integration.find({ owner: userId });

    const statusMap = {
      gmail: { connected: false, scopes: [], lastSync: null },
      slack: { connected: false, scopes: [], lastSync: null },
      discord: { connected: false, scopes: [], lastSync: null },
      'google-sheets': { connected: false, scopes: [], lastSync: null },
    };

    connections.forEach(conn => {
      const provider = conn.provider;
      if (statusMap[provider]) {
        statusMap[provider] = {
          connected: conn.status === 'connected',
          scopes: conn.scopes || [],
          lastSync: conn.updatedAt,
        };
      }
    });

    return statusMap;
  }

  async saveManualCredentials(userId, provider, credentials) {
    const Integration = getIntegrationModel();
    
    // Encrypt tokens
    const encryptedAccessToken = credentials.accessToken ? encrypt(credentials.accessToken) : null;
    const encryptedRefreshToken = credentials.refreshToken ? encrypt(credentials.refreshToken) : null;

    const query = { owner: userId, provider };
    const update = {
      status: 'connected',
      scopes: credentials.scopes || ['manual_access'],
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      metadata: credentials.metadata || {},
    };

    // Use findOne and update or create
    let conn = await Integration.findOne(query);
    if (conn) {
      conn = await Integration.findByIdAndUpdate(conn._id, { $set: update }, { new: true });
    } else {
      conn = await Integration.create({
        ...query,
        ...update,
      });
    }

    return conn;
  }

  async disconnectProvider(userId, provider) {
    const Integration = getIntegrationModel();
    // Delete connection to fully clear credentials
    const conn = await Integration.findOneAndDelete({ owner: userId, provider });
    return conn;
  }

  getOAuthStartUrl(provider, userId) {
    // Generate a mock OAuth URL that redirects back to our callback route
    // This allows fully functional simulated OAuth flows for local testing!
    const callbackUrl = `${env.CLIENT_URL.replace(/\/$/, '')}/api/integrations/oauth/${provider}/callback?state=${userId}`;
    
    // For local test, we redirect directly to the backend callback handler
    // In production this would point to Google/Slack authorization endpoint
    const backendCallbackUrl = `http://localhost:${env.PORT}/api/integrations/oauth/${provider}/callback?code=mock_oauth_code_123&state=${userId}`;
    return backendCallbackUrl;
  }

  async handleOAuthCallback(provider, code, userId) {
    const Integration = getIntegrationModel();

    // Mock exchange tokens
    const mockAccessToken = `mock-${provider}-access-token-${Date.now()}`;
    const mockRefreshToken = `mock-${provider}-refresh-token-xyz`;

    const encryptedAccessToken = encrypt(mockAccessToken);
    const encryptedRefreshToken = encrypt(mockRefreshToken);

    const query = { owner: userId, provider };
    const update = {
      status: 'connected',
      scopes: provider === 'gmail' 
        ? ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly']
        : provider === 'google-sheets'
        ? ['https://www.googleapis.com/auth/spreadsheets']
        : ['bot', 'incoming-webhook'],
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      metadata: { lastOAuthExchange: new Date() },
    };

    let conn = await Integration.findOne(query);
    if (conn) {
      await Integration.findByIdAndUpdate(conn._id, { $set: update });
    } else {
      await Integration.create({
        ...query,
        ...update,
      });
    }

    return true;
  }
}

module.exports = new IntegrationService();
