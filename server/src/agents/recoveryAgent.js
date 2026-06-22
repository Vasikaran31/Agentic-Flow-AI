const monitoringAgent = require('./monitoringAgent');

class RecoveryAgent {
  async handleError(executionId, workflowId, node, errorObj) {
    const nodeName = node?.data?.label || node?.id || 'Unknown Step';
    const errorMsg = errorObj.message || errorObj.error || String(errorObj);
    
    await monitoringAgent.logEvent(executionId, {
      workflowId,
      nodeId: node?.id,
      agent: 'recovery',
      level: 'warning',
      message: `Analyzing error on step "${nodeName}": "${errorMsg}"`,
    });

    // Classify error
    let classification = 'TRANSIENT';
    let action = 'retry_with_backoff';

    const cleanMsg = errorMsg.toLowerCase();

    if (cleanMsg.includes('missing') || cleanMsg.includes('required') || cleanMsg.includes('invalid schema')) {
      classification = 'MISSING_FIELDS';
      action = 'escalate';
    } else if (cleanMsg.includes('oauth') || cleanMsg.includes('token') || cleanMsg.includes('auth') || cleanMsg.includes('expired')) {
      classification = 'AUTH_EXPIRED';
      action = 'escalate';
    } else if (cleanMsg.includes('rate') || cleanMsg.includes('429') || cleanMsg.includes('too many requests')) {
      classification = 'RATE_LIMIT';
      action = 'retry_with_backoff';
    } else if (cleanMsg.includes('not found') || cleanMsg.includes('404')) {
      classification = 'API_FAILURE';
      action = 'escalate';
    }

    // Logging classification result
    if (action === 'escalate') {
      await monitoringAgent.logEvent(executionId, {
        workflowId,
        nodeId: node?.id,
        agent: 'recovery',
        level: 'error',
        message: `Recovery classified error as [${classification}] – escalating failure. Auto-retry cancelled.`,
      });
    } else {
      await monitoringAgent.logEvent(executionId, {
        workflowId,
        nodeId: node?.id,
        agent: 'recovery',
        level: 'info',
        message: `Recovery classified error as [${classification}] – scheduling exponential backoff retry.`,
      });
    }

    return {
      classification,
      action,
      nextRetryDelaySeconds: action === 'retry_with_backoff' ? 10 : 0
    };
  }
}

module.exports = new RecoveryAgent();
