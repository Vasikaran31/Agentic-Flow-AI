import { useState, useEffect } from "react";
import { X, Settings, Database, Cpu, HelpCircle, Save } from "lucide-react";

export default function NodeConfigPanel({ selectedNode, onUpdateNode, onClose }) {
  const [label, setLabel] = useState("");
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data?.label || "");
      setConfig(selectedNode.data?.config || {});
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const handleConfigChange = (key, val) => {
    const nextConfig = { ...config, [key]: val };
    setConfig(nextConfig);
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      label,
      config: nextConfig,
    });
  };

  const handleLabelChange = (val) => {
    setLabel(val);
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      label: val,
    });
  };

  // Render fields based on node type
  const renderConfigFields = () => {
    const type = selectedNode.type;

    switch (type) {
      case "webhookTrigger":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Webhook HTTP Method
              </label>
              <select
                value={config.method || "POST"}
                onChange={(e) => handleConfigChange("method", e.target.value)}
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="POST">POST (Recommended)</option>
                <option value="GET">GET</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Security Token / Key
              </label>
              <input
                type="text"
                value={config.securityToken || ""}
                onChange={(e) => handleConfigChange("securityToken", e.target.value)}
                placeholder="Secure bearer token or query key"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      case "scheduleTrigger":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Cron Syntax Expression
              </label>
              <input
                type="text"
                value={config.cronPattern || "*/5 * * * *"}
                onChange={(e) => handleConfigChange("cronPattern", e.target.value)}
                placeholder="*/5 * * * * (Every 5 mins)"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Standard Linux cron format: minute, hour, day, month, weekday.
              </p>
            </div>
          </div>
        );

      case "gmailTrigger":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Query Filter
              </label>
              <input
                type="text"
                value={config.query || "subject:invoice"}
                onChange={(e) => handleConfigChange("query", e.target.value)}
                placeholder="e.g. from:accounting subject:payment"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      case "gmailAction":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                To (Email Address)
              </label>
              <input
                type="email"
                value={config.to || ""}
                onChange={(e) => handleConfigChange("to", e.target.value)}
                placeholder="client@company.com"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Subject line
              </label>
              <input
                type="text"
                value={config.subject || ""}
                onChange={(e) => handleConfigChange("subject", e.target.value)}
                placeholder="Dynamic updates from Agentflow"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Email Body Message
              </label>
              <textarea
                value={config.body || ""}
                onChange={(e) => handleConfigChange("body", e.target.value)}
                placeholder="Write message contents here..."
                rows={4}
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      case "slackAction":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Slack Channel / Room ID
              </label>
              <input
                type="text"
                value={config.channel || "#general"}
                onChange={(e) => handleConfigChange("channel", e.target.value)}
                placeholder="#ops-monitoring"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Notification Message
              </label>
              <textarea
                value={config.message || ""}
                onChange={(e) => handleConfigChange("message", e.target.value)}
                placeholder="Format posts with Slack markdown..."
                rows={4}
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      case "discordAction":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Discord Webhook URL
              </label>
              <input
                type="text"
                value={config.webhookUrl || ""}
                onChange={(e) => handleConfigChange("webhookUrl", e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Bot Username Override
              </label>
              <input
                type="text"
                value={config.username || "Agentflow Dispatcher"}
                onChange={(e) => handleConfigChange("username", e.target.value)}
                placeholder="Agentflow Dispatcher"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Message Content
              </label>
              <textarea
                value={config.message || ""}
                onChange={(e) => handleConfigChange("message", e.target.value)}
                placeholder="Write rich Discord messages..."
                rows={4}
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      case "sheetsAction":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Spreadsheet Key / ID
              </label>
              <input
                type="text"
                value={config.spreadsheetId || ""}
                onChange={(e) => handleConfigChange("spreadsheetId", e.target.value)}
                placeholder="ID from Google Sheets browser URL"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Sheet / Tab Name
              </label>
              <input
                type="text"
                value={config.range || "Sheet1"}
                onChange={(e) => handleConfigChange("range", e.target.value)}
                placeholder="Sheet1!A1:D"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Values to Append (Comma list)
              </label>
              <input
                type="text"
                value={config.values || ""}
                onChange={(e) => handleConfigChange("values", e.target.value)}
                placeholder="e.g. {{gmail.date}}, {{gmail.from}}, {{llm.response}}"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      case "llmReasoner":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                System Persona Prompt
              </label>
              <textarea
                value={config.systemPrompt || "You are a customer service operations coordinator."}
                onChange={(e) => handleConfigChange("systemPrompt", e.target.value)}
                placeholder="Provide details on target output constraints..."
                rows={3}
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                User Reasoning Instructions
              </label>
              <textarea
                value={config.promptTemplate || "Draft a response to: {{gmail.body}}"}
                onChange={(e) => handleConfigChange("promptTemplate", e.target.value)}
                placeholder="Reference fields from previous nodes like {{node_id.output}}..."
                rows={4}
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Temperature setting
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={config.temperature !== undefined ? config.temperature : 0.7}
                onChange={(e) => handleConfigChange("temperature", parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      case "schemaExtractor":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Target JSON Schema Structure
              </label>
              <textarea
                value={config.schemaJson || '{\n  "invoiceNum": "string",\n  "amountDue": "number"\n}'}
                onChange={(e) => handleConfigChange("schemaJson", e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      case "intentClassifier":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                List Intents (Comma list)
              </label>
              <input
                type="text"
                value={config.intents || "Refund, Support, Sales, General"}
                onChange={(e) => handleConfigChange("intents", e.target.value)}
                placeholder="e.g. Sales, Technical_Issues, Billing"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      case "conditionalBranch":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Branch Criteria / Filter Path
              </label>
              <input
                type="text"
                value={config.condition || "{{llm.output}} contains 'refund'"}
                onChange={(e) => handleConfigChange("condition", e.target.value)}
                placeholder="e.g. {{gmail.subject}} includes 'Urgent'"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      case "delayStep":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Delay Duration (Seconds)
              </label>
              <input
                type="number"
                value={config.duration || 60}
                onChange={(e) => handleConfigChange("duration", parseInt(e.target.value))}
                placeholder="60"
                className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
            No customization requirements for manual Trigger.
          </div>
        );
    }
  };

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full overflow-hidden shrink-0">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">Configure Node</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
            Display Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="pt-4 border-t border-border">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center">
            {selectedNode.type?.includes("Trigger") ? (
              <Database className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            ) : (
              <Cpu className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            )}
            <span>Custom Variables</span>
          </h4>
          {renderConfigFields()}
        </div>
      </div>
    </div>
  );
}
