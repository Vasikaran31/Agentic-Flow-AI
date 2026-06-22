const monitoringAgent = require('./monitoringAgent');

class PlannerAgent {
  async plan(executionId, workflow) {
    const { nodes, edges } = workflow;
    const workflowId = workflow._id;

    await monitoringAgent.logEvent(executionId, {
      workflowId,
      agent: 'planner',
      level: 'info',
      message: `Analyzing graph structure for workflow "${workflow.name}"...`,
    });

    if (!nodes || nodes.length === 0) {
      await monitoringAgent.logEvent(executionId, {
        workflowId,
        agent: 'planner',
        level: 'error',
        message: 'Planning failed: Graph contains no nodes.',
      });
      return { executionOrder: [], confidence: 0, error: 'Empty graph' };
    }

    // Identify starting triggers
    const triggerNodes = nodes.filter(n => n.type.toLowerCase().includes('trigger'));
    
    if (triggerNodes.length === 0) {
      await monitoringAgent.logEvent(executionId, {
        workflowId,
        agent: 'planner',
        level: 'warning',
        message: 'No trigger node detected in workflow. Defaulting to first node.',
      });
    }

    // Build adjacency list for topological sorting / BFS traversal
    const adj = {};
    const inDegree = {};
    
    nodes.forEach(n => {
      adj[n.id] = [];
      inDegree[n.id] = 0;
    });

    edges.forEach(e => {
      if (adj[e.source]) {
        adj[e.source].push(e.target);
        inDegree[e.target] = (inDegree[e.target] || 0) + 1;
      }
    });

    // Queue for BFS traversal
    const queue = [];
    
    // Enqueue trigger nodes first
    triggerNodes.forEach(t => {
      queue.push(t.id);
    });

    // If queue is empty, enqueue nodes with inDegree = 0
    if (queue.length === 0) {
      Object.keys(inDegree).forEach(id => {
        if (inDegree[id] === 0) {
          queue.push(id);
        }
      });
    }

    // Fallback if graph has cycles
    if (queue.length === 0 && nodes.length > 0) {
      queue.push(nodes[0].id);
    }

    const executionOrder = [];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      
      visited.add(current);
      executionOrder.push(current);

      const neighbors = adj[current] || [];
      neighbors.forEach(neighbor => {
        inDegree[neighbor]--;
        // Enqueue if we've satisfied dependencies or to ensure all nodes run
        if (inDegree[neighbor] <= 0 || !visited.has(neighbor)) {
          queue.push(neighbor);
        }
      });
    }

    // Ensure disconnected nodes are appended so they don't get forgotten
    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        executionOrder.push(n.id);
        visited.add(n.id);
      }
    });

    const confidence = triggerNodes.length === 1 ? 0.98 : 0.85;

    await monitoringAgent.logEvent(executionId, {
      workflowId,
      agent: 'planner',
      level: 'success',
      message: `Execution sequence compiled successfully. Mapped ${executionOrder.length} nodes with ${Math.round(confidence * 100)}% confidence.`,
      metadata: { executionOrder, confidence },
    });

    return { executionOrder, confidence };
  }
}

module.exports = new PlannerAgent();
