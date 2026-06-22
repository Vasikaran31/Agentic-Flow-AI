const crypto = require('crypto');
const env = require('../config/env');

const ALGORITHM = 'aes-256-cbc';
// Fallback key for local development
const ENCRYPTION_KEY = (env.CREDENTIAL_ENCRYPTION_KEY || 'development_key_must_be_32_bytes_long_').slice(0, 32);

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return '';
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('Decryption failed, returning raw string', err.message);
    return text; // Return text as fallback
  }
}

class BaseIntegration {
  constructor(providerName) {
    this.providerName = providerName;
  }

  encryptCredentials(creds) {
    const encrypted = {};
    Object.keys(creds).forEach(k => {
      encrypted[k] = encrypt(creds[k]);
    });
    return encrypted;
  }

  decryptCredentials(creds) {
    const decrypted = {};
    Object.keys(creds).forEach(k => {
      // Don't decrypt non-string fields
      if (typeof creds[k] === 'string') {
        decrypted[k] = decrypt(creds[k]);
      } else {
        decrypted[k] = creds[k];
      }
    });
    return decrypted;
  }

  /**
   * Test if the provided credentials are valid.
   * @param {Object} credentials - Decrypted credentials object
   * @returns {Promise<boolean>}
   */
  async testConnection(credentials) {
    throw new Error('testConnection() not implemented');
  }

  /**
   * Execute the workflow node.
   * @param {Object} node - Workflow node definition
   * @param {Object} credentials - Decrypted credentials
   * @param {Object} context - Previous step inputs/outputs context for interpolation
   */
  async execute(node, credentials, context) {
    throw new Error('execute() not implemented');
  }

  // General utility to interpolate variables like {{nodeId.field}} in text
  interpolate(template, context) {
    if (typeof template !== 'string') return template;
    
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const trimmedPath = path.trim();
      const parts = trimmedPath.split('.');
      
      let current = context;
      for (const part of parts) {
        if (current === null || current === undefined) {
          return '';
        }
        current = current[part];
      }
      
      return current !== undefined ? String(current) : '';
    });
  }
}

module.exports = { BaseIntegration, encrypt, decrypt };
