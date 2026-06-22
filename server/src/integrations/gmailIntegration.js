const { BaseIntegration } = require('./baseIntegration');

class GmailIntegration extends BaseIntegration {
  constructor() {
    super('gmail');
  }

  async testConnection(credentials) {
    if (!credentials || !credentials.accessToken) {
      throw new Error('INTEGRATION_NOT_CONNECTED');
    }
    // Simulate token check
    if (credentials.accessToken === 'expired-token') {
      throw new Error('AUTH_EXPIRED');
    }
    return true;
  }

  async execute(node, credentials, context) {
    await this.testConnection(credentials);

    const type = node.type;
    const config = node.data.config || {};

    if (type === 'gmailTrigger') {
      // Simulate reading/polling new mail
      const query = this.interpolate(config.query || 'subject:support', context);
      console.log(`[GMAIL] Checking for new messages matching query: "${query}"`);
      
      // Return a simulated email object
      return {
        id: 'msg_12345abcdef',
        from: 'customer@clientmail.com',
        to: 'support@agentflow.ai',
        subject: 'Urgent invoice issue',
        body: 'Please find our request. We have an invoice issue with payment #9012.',
        date: new Date().toISOString(),
      };
    }

    if (type === 'gmailAction') {
      const to = this.interpolate(config.to || 'support@agentflow.ai', context);
      const subject = this.interpolate(config.subject || 'Automated Mail Alert', context);
      const body = this.interpolate(config.body || 'Execution logs summary.', context);

      console.log(`[GMAIL] Dispatching email to: ${to} | Subject: "${subject}"`);
      
      return {
        success: true,
        messageId: 'sent_abc123xyz',
        to,
        subject,
        body,
        sentAt: new Date().toISOString()
      };
    }

    throw new Error(`Unsupported Gmail node type: ${type}`);
  }
}

module.exports = new GmailIntegration();
