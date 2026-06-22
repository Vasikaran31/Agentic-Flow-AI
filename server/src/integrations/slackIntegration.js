const { BaseIntegration } = require('./baseIntegration');

class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  async testConnection(credentials) {
    if (!credentials || !credentials.accessToken) {
      throw new Error('INTEGRATION_NOT_CONNECTED');
    }
    if (credentials.accessToken === 'expired-token') {
      throw new Error('AUTH_EXPIRED');
    }
    return true;
  }

  async execute(node, credentials, context) {
    await this.testConnection(credentials);

    const type = node.type;
    const config = node.data.config || {};

    if (type === 'slackAction') {
      const channel = this.interpolate(config.channel || '#general', context);
      const message = this.interpolate(config.message || 'Workflow executed.', context);

      console.log(`[SLACK] Posting message to channel ${channel}: "${message}"`);

      return {
        success: true,
        channel,
        ts: Date.now().toString(),
        message,
        postedAt: new Date().toISOString()
      };
    }

    throw new Error(`Unsupported Slack node type: ${type}`);
  }
}

module.exports = new SlackIntegration();
