const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const env = require('../config/env');
const orchestrator = require('../agents/orchestrator');

let workflowQueue = null;
let worker = null;
let isRedisAvailable = false;

// Attempt Redis connection
let redisConnection = null;
if (env.REDIS_URL) {
  try {
    redisConnection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 2000, // Quick timeout to fallback fast
    });

    redisConnection.on('error', (err) => {
      console.warn('⚠️  Redis connection failed. Falling back to in-memory queue.');
      isRedisAvailable = false;
    });

    redisConnection.on('connect', () => {
      console.log('✅ Connected to Redis. BullMQ background queue initialized.');
      isRedisAvailable = true;
    });
  } catch (e) {
    console.warn('⚠️  Could not initialize Redis client. Falling back to in-memory queue.');
    isRedisAvailable = false;
  }
}

// Initialize Queue and Worker if Redis is active
if (redisConnection) {
  workflowQueue = new Queue('workflow-executions', { connection: redisConnection });

  worker = new Worker('workflow-executions', async (job) => {
    const { executionId, input } = job.data;
    console.log(`[BULLMQ] Processing job ${job.id} for execution ${executionId}`);
    await orchestrator.run(executionId, input);
  }, { connection: redisConnection });

  worker.on('failed', (job, err) => {
    console.error(`[BULLMQ] Job ${job.id} failed:`, err.message);
  });
}

const queueService = {
  addExecution: async (executionId, input) => {
    if (isRedisAvailable && workflowQueue) {
      console.log(`[QUEUE] Queueing execution ${executionId} on Redis...`);
      await workflowQueue.add(`run:${executionId}`, { executionId, input }, {
        attempts: 1,
        backoff: { type: 'exponential', delay: 10000 }
      });
    } else {
      console.log(`[QUEUE] Running execution ${executionId} in-memory (async)...`);
      // Fallback: run asynchronously using process.nextTick / setImmediate
      setImmediate(async () => {
        try {
          await orchestrator.run(executionId, input);
        } catch (e) {
          console.error('[IN-MEMORY QUEUE] Run failed:', e.message);
        }
      });
    }
  }
};

module.exports = queueService;
