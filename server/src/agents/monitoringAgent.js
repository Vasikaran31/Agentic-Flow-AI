const { getExecutionLogModel } = require('../models/ExecutionLog');
const { getIO } = require('../config/socket');

class MonitoringAgent {
  async logEvent(executionId, { workflowId, nodeId, agent, level, eventType, message, metadata = {} }) {
    const ExecutionLog = getExecutionLogModel();

    // Persist to DB
    const logDoc = await ExecutionLog.create({
      execution: executionId,
      workflow: workflowId,
      nodeId,
      agent,
      level: level || 'info',
      eventType: eventType || 'agent_step',
      message,
      metadata,
    });

    // Broadcast in real-time
    const io = getIO();
    io.to(`execution:${executionId}`).emit('execution_log', {
      _id: logDoc._id,
      execution: executionId,
      workflow: workflowId,
      nodeId,
      agent,
      level: logDoc.level,
      eventType: logDoc.eventType,
      message,
      metadata,
      createdAt: logDoc.createdAt,
    });

    // Also trigger user-level activities for the dashboard activity stream
    // Check if we can locate the owner from user mapping
    const { getExecutionModel } = require('../models/Execution');
    const Execution = getExecutionModel();
    const exec = await Execution.findById(executionId);
    if (exec && exec.triggeredBy) {
      // Formulate simple time label
      io.to(`user:${exec.triggeredBy}`).emit('activity_feed', {
        id: logDoc._id.toString(),
        agent,
        message,
        time: 'Just now',
      });
    }

    console.log(`[${agent.toUpperCase()}] ${level.toUpperCase()}: ${message}`);
    return logDoc;
  }
}

module.exports = new MonitoringAgent();
