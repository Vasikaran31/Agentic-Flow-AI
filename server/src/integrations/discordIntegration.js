const { BaseIntegration } = require('./baseIntegration');

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  // Discord usually uses Webhook URLs instead of OAuth for simple bot posts.
  // We check if either a webhookUrl is configured or OAuth tokens exist.
  async testConnection(credentials) {
    if (!credentials || (!credentials.webhookUrl && !credentials.accessToken)) {
      throw new Error('INTEGRATION_NOT_CONNECTED');
    }
    return true;
  }

  async execute(node, credentials, context) {
    await this.testConnection(credentials);

    const type = node.type;
    const config = node.data.config || {};

    if (type === 'discordAction') {
      const webhookUrl = this.interpolate(config.webhookUrl || credentials.webhookUrl || '', context);
      const username = this.interpolate(config.username || 'Agentflow Bot', context);
      const message = this.interpolate(config.message || 'Notification check', context);

      console.log(`[DISCORD] Posting as "${username}" to: ${webhookUrl || 'Mock Webhook'} | Msg: "${message}"`);

      // Mock request if no actual webhook URL
      if (!webhookUrl || webhookUrl.includes('mock')) {
        return {
          success: true,
          status: 'sent_mock',
          username,
          message,
          postedAt: new Date().toISOString()
        };
      }

      // Actual fetch
      const axios = require('axios');
      await axios.post(webhookUrl, {
        content: message,
        username
      });

      return {
        success: true,
        status: 'sent',
        username,
        message,
        postedAt: new Date().toISOString()
      };
    }

    throw new Error(`Unsupported Discord node type: ${type}`);
  }
}

module.exports = new DiscordIntegration();
