const monitoringAgent = require('./monitoringAgent');

class ValidationAgent {
  async validate(executionId, workflowId, node, output) {
    const nodeName = node.data.label || node.id;
    
    await monitoringAgent.logEvent(executionId, {
      workflowId,
      nodeId: node.id,
      agent: 'validation',
      level: 'info',
      message: `Validating output for node "${nodeName}"...`,
    });

    if (!output) {
      const msg = `Validation failed: Node "${nodeName}" returned empty or undefined output.`;
      await monitoringAgent.logEvent(executionId, {
        workflowId,
        nodeId: node.id,
        agent: 'validation',
        level: 'error',
        message: msg,
      });
      return { valid: false, errors: ['Output is empty'] };
    }

    const errors = [];
    
    // Custom validation logic per node type
    if (node.type === 'schemaExtractor') {
      const schemaStr = node.data.config?.schemaJson;
      if (schemaStr) {
        try {
          const schema = JSON.parse(schemaStr);
          Object.keys(schema).forEach(key => {
            if (output[key] === undefined || output[key] === null || output[key] === '') {
              errors.push(`Missing required field: "${key}"`);
            }
          });
        } catch (e) {
          errors.push('Failed to validate: Invalid schema definition in config');
        }
      }
    }

    // Default general check for actions: make sure it succeeded
    if (node.type.toLowerCase().includes('action')) {
      if (output.success === false) {
        errors.push(output.error || 'Action reported failure');
      }
    }

    if (errors.length > 0) {
      const msg = `Validation failed for "${nodeName}": ${errors.join(', ')}`;
      await monitoringAgent.logEvent(executionId, {
        workflowId,
        nodeId: node.id,
        agent: 'validation',
        level: 'error',
        message: msg,
        metadata: { errors },
      });
      return { valid: false, errors };
    }

    await monitoringAgent.logEvent(executionId, {
      workflowId,
      nodeId: node.id,
      agent: 'validation',
      level: 'success',
      message: `Node "${nodeName}" outputs validated successfully.`,
    });

    return { valid: true };
  }
}

module.exports = new ValidationAgent();
