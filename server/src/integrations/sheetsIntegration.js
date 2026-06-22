const { BaseIntegration } = require('./baseIntegration');

class SheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
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

    if (type === 'sheetsAction') {
      const spreadsheetId = this.interpolate(config.spreadsheetId || '', context);
      const range = this.interpolate(config.range || 'Sheet1', context);
      const rawValues = this.interpolate(config.values || '', context);

      const rowValues = rawValues.split(',').map(v => v.trim());
      console.log(`[SHEETS] Appending row to Sheet "${spreadsheetId}" range "${range}":`, rowValues);

      return {
        success: true,
        spreadsheetId,
        range,
        updatedRows: 1,
        values: rowValues,
        appendedAt: new Date().toISOString()
      };
    }

    throw new Error(`Unsupported Google Sheets node type: ${type}`);
  }
}

module.exports = new SheetsIntegration();
