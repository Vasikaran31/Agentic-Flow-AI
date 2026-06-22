const axios = require('axios');
const { GoogleGenAI } = require('@google/generative-ai');
const env = require('../config/env');

class AIService {
  async generateWorkflowFromPrompt(prompt) {
    if (!prompt) {
      throw new Error('Prompt is required for workflow generation.');
    }

    if (env.OPENROUTER_API_KEY) {
      try {
        console.log('🤖 Utilizing OpenRouter API for visual graph synthesis...');
        return await this.generateViaOpenRouter(prompt);
      } catch (err) {
        console.warn(`OpenRouter generation failed: ${err.message}. Trying Gemini...`);
      }
    }

    if (env.GEMINI_API_KEY) {
      try {
        console.log('🤖 Utilizing Google Gemini SDK for visual graph synthesis...');
        return await this.generateViaGemini(prompt);
      } catch (err) {
        console.warn(`Gemini generation failed: ${err.message}. Falling back to deterministic templates...`);
      }
    }

    console.log('🤖 Utilizing deterministic rule-based builder fallback...');
    return this.generateDeterministicFallback(prompt);
  }

  // ── OpenRouter Implementation ──────────────────────────────────────────
  async generateViaOpenRouter(prompt) {
    const systemPrompt = this.getSystemPrompt();
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a workflow graph for this prompt: "${prompt}"` }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.choices[0].message.content;
    return this.cleanAndParseJSON(text);
  }

  // ── Gemini SDK Implementation ─────────────────────────────────────────
  async generateViaGemini(prompt) {
    const { GoogleGenAI } = require('@google/generative-ai');
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const systemPrompt = this.getSystemPrompt();

    // Use gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\nUser Prompt: "${prompt}"\n\nGenerate JSON:`,
    });

    const text = response.text;
    return this.cleanAndParseJSON(text);
  }

  // Helper to strip markdown formatting and parse JSON
  cleanAndParseJSON(text) {
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```json/i, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleanText);
  }

  // ── System Prompt defining graph output layout ────────────────────────
  getSystemPrompt() {
    return `You are a visual workflow compiler. You convert natural language descriptions of operational automation tasks into visual node graphs runnable on a visual editor.
You must return a raw JSON object with the following fields:
- name: (string) A concise, catchy title for the automation.
- description: (string) A detailed summary of what the flow does.
- status: "draft"
- trigger: { type: "manual" | "webhook" | "schedule" | "gmail", config: {} }
- nodes: Array of React Flow node definitions. Each node has:
    - id: (string, unique like "manualTrigger-1" or "slackAction-2")
    - type: must be one of:
        - "manualTrigger", "webhookTrigger", "scheduleTrigger", "gmailTrigger"
        - "gmailAction", "slackAction", "discordAction", "sheetsAction"
        - "llmReasoner", "schemaExtractor", "intentClassifier"
        - "conditionalBranch", "delayStep"
    - position: { x: number, y: number } (Place logically. Space nodes out horizontally: Triggers on left (x: 100), AI in center (x: 400), Actions on right (x: 700))
    - data: {
        label: (string) Display name of the step (e.g. "Draft Gmail Response")
        config: (object) Configuration values relevant to the node:
            - gmailAction: { to: string, subject: string, body: string }
            - slackAction: { channel: string, message: string }
            - discordAction: { webhookUrl: string, username: string, message: string }
            - sheetsAction: { spreadsheetId: string, range: string, values: string }
            - llmReasoner: { systemPrompt: string, promptTemplate: string, temperature: number }
            - schemaExtractor: { schemaJson: string }
            - intentClassifier: { intents: string }
            - conditionalBranch: { condition: string }
            - delayStep: { duration: number }
      }
- edges: Array of React Flow edges. Each edge connects nodes:
    - id: (string, e.g. "e-node1-node2")
    - source: (string, ID of parent node)
    - target: (string, ID of child node)

Respond ONLY with valid JSON. Do not include markdown code wrappers unless required.`;
  }

  // ── Deterministic Fallback Template Generator ────────────────────────
  generateDeterministicFallback(prompt) {
    const query = prompt.toLowerCase();

    // Default template fields
    let name = 'Custom AI Assistant Dispatcher';
    let description = 'Automatically parses input alerts and coordinates responses.';
    let triggerType = 'manualTrigger';
    let triggerLabel = 'Manual Trigger';
    let nodes = [];
    let edges = [];

    // Analyze query to match templates
    if (query.includes('email') || query.includes('gmail') || query.includes('mail')) {
      name = 'Gmail Auto-Response Assistant';
      description = 'Monitors email arrivals, reasons about subject matters, and drafts a reply.';
      triggerType = 'gmailTrigger';
      triggerLabel = 'Gmail Mail Event';
      
      nodes = [
        {
          id: 'trigger-1',
          type: 'gmailTrigger',
          position: { x: 100, y: 150 },
          data: { label: triggerLabel, config: { query: 'subject:support' } }
        },
        {
          id: 'llm-1',
          type: 'llmReasoner',
          position: { x: 350, y: 150 },
          data: {
            label: 'AI Response Synthesis',
            config: {
              systemPrompt: 'You are a technical support agent responding to user inquiries.',
              promptTemplate: 'Please address this client issue: {{gmailTrigger-1.body}}',
              temperature: 0.7
            }
          }
        },
        {
          id: 'action-1',
          type: 'gmailAction',
          position: { x: 600, y: 150 },
          data: {
            label: 'Send Gmail Response',
            config: {
              to: '{{gmailTrigger-1.from}}',
              subject: 'Re: {{gmailTrigger-1.subject}}',
              body: 'Hello,\n\nHere is an automated update regarding your issue:\n\n{{llmReasoner-1.output}}'
            }
          }
        }
      ];

      edges = [
        { id: 'e-trigger-llm', source: 'trigger-1', target: 'llm-1' },
        { id: 'e-llm-action', source: 'llm-1', target: 'action-1' }
      ];
    } else if (query.includes('slack') || query.includes('discord') || query.includes('notify') || query.includes('alert')) {
      name = 'Real-Time Alert Broadcaster';
      description = 'Receives webhooks, runs AI analysis, and pushes formatted logs to notification channels.';
      triggerType = 'webhookTrigger';
      triggerLabel = 'Webhook Trigger';

      nodes = [
        {
          id: 'trigger-1',
          type: 'webhookTrigger',
          position: { x: 100, y: 150 },
          data: { label: triggerLabel, config: { method: 'POST', securityToken: 'secret-key-xyz' } }
        },
        {
          id: 'extractor-1',
          type: 'schemaExtractor',
          position: { x: 350, y: 150 },
          data: {
            label: 'Alert Field Extractor',
            config: {
              schemaJson: '{\n  "title": "string",\n  "severity": "string",\n  "description": "string"\n}'
            }
          }
        },
        {
          id: 'action-1',
          type: 'slackAction',
          position: { x: 600, y: 100 },
          data: {
            label: 'Slack Notification',
            config: {
              channel: '#ops-alerts',
              message: '🚨 *New Alert Received*:\n*Title:* {{schemaExtractor-1.title}}\n*Severity:* {{schemaExtractor-1.severity}}\n*Details:* {{schemaExtractor-1.description}}'
            }
          }
        },
        {
          id: 'action-2',
          type: 'discordAction',
          position: { x: 600, y: 250 },
          data: {
            label: 'Discord Backup Post',
            config: {
              webhookUrl: 'https://discord.com/api/webhooks/mock-channel',
              username: 'Incident Bot',
              message: 'Alert backup status: {{schemaExtractor-1.title}} [{{schemaExtractor-1.severity}}]'
            }
          }
        }
      ];

      edges = [
        { id: 'e-trigger-ext', source: 'trigger-1', target: 'extractor-1' },
        { id: 'e-ext-slack', source: 'extractor-1', target: 'action-1' },
        { id: 'e-ext-discord', source: 'extractor-1', target: 'action-2' }
      ];
    } else if (query.includes('sheets') || query.includes('sheet') || query.includes('append') || query.includes('spread')) {
      name = 'Operational Leads Data logger';
      description = 'Parses inbound request leads, translates criteria, and logs details to Google Sheets.';
      triggerType = 'webhookTrigger';
      triggerLabel = 'Webhook Trigger';

      nodes = [
        {
          id: 'trigger-1',
          type: 'webhookTrigger',
          position: { x: 100, y: 150 },
          data: { label: triggerLabel, config: { method: 'POST' } }
        },
        {
          id: 'classifier-1',
          type: 'intentClassifier',
          position: { x: 350, y: 150 },
          data: {
            label: 'Lead Intent Classifier',
            config: { intents: 'Sales, Support, Partnerships, General' }
          }
        },
        {
          id: 'action-1',
          type: 'sheetsAction',
          position: { x: 600, y: 150 },
          data: {
            label: 'Append Rows',
            config: {
              spreadsheetId: 'spreadsheet-id-placeholder',
              range: 'Leads',
              values: '{{webhookTrigger-1.email}}, {{webhookTrigger-1.name}}, {{intentClassifier-1.intent}}, {{webhookTrigger-1.company}}'
            }
          }
        }
      ];

      edges = [
        { id: 'e-trigger-class', source: 'trigger-1', target: 'classifier-1' },
        { id: 'e-class-sheets', source: 'classifier-1', target: 'action-1' }
      ];
    } else {
      // General LLM reasoning template
      nodes = [
        {
          id: 'trigger-1',
          type: 'manualTrigger',
          position: { x: 100, y: 150 },
          data: { label: 'Manual Trigger', config: {} }
        },
        {
          id: 'llm-1',
          type: 'llmReasoner',
          position: { x: 350, y: 150 },
          data: {
            label: 'AI Analysis',
            config: {
              systemPrompt: 'You are a general operations reasoner assistant.',
              promptTemplate: 'Please execute logic on: {{manualTrigger-1.input}}',
              temperature: 0.5
            }
          }
        },
        {
          id: 'action-1',
          type: 'slackAction',
          position: { x: 600, y: 150 },
          data: {
            label: 'Post Results',
            config: {
              channel: '#general',
              message: 'Analysis result: {{llmReasoner-1.output}}'
            }
          }
        }
      ];

      edges = [
        { id: 'e-trigger-llm', source: 'trigger-1', target: 'llm-1' },
        { id: 'e-llm-action', source: 'llm-1', target: 'action-1' }
      ];
    }

    return {
      name,
      description,
      status: 'draft',
      trigger: { type: triggerType.replace('Trigger', ''), config: {} },
      nodes,
      edges,
      version: 1,
      tags: ['AI-generated']
    };
  }
}

module.exports = new AIService();
