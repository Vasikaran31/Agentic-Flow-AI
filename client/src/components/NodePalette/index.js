import { Play, Mail, MessageSquare, Plus, FileSpreadsheet, Bot, HelpCircle, GitCommit, Settings } from "lucide-react";

const nodeCategories = [
  {
    name: "Triggers",
    color: "border-l-4 border-emerald-500",
    nodes: [
      { type: "manualTrigger", label: "Manual Trigger", icon: Play, desc: "Trigger on-demand from the console" },
      { type: "webhookTrigger", label: "Webhook Trigger", icon: Settings, desc: "Trigger via an external HTTP POST request" },
      { type: "scheduleTrigger", label: "Cron Schedule", icon: Settings, desc: "Trigger at scheduled date/time intervals" },
      { type: "gmailTrigger", label: "Gmail Mail Event", icon: Mail, desc: "Trigger on receiving new emails matching criteria" },
    ],
  },
  {
    name: "Actions",
    color: "border-l-4 border-indigo-500",
    nodes: [
      { type: "gmailAction", label: "Gmail Send", icon: Mail, desc: "Send an email through connected OAuth Gmail" },
      { type: "slackAction", label: "Slack Publish", icon: MessageSquare, desc: "Post a message to a Slack channel" },
      { type: "discordAction", label: "Discord Publish", icon: MessageSquare, desc: "Send a message using Discord webhooks" },
      { type: "sheetsAction", label: "Append Google Sheet", icon: FileSpreadsheet, desc: "Write rows to a spreadsheet table range" },
    ],
  },
  {
    name: "AI Agents",
    color: "border-l-4 border-violet-500",
    nodes: [
      { type: "llmReasoner", label: "LLM Agent Reasoner", icon: Bot, desc: "Execute reasoning/synthesis using AI prompt templates" },
      { type: "schemaExtractor", label: "Structured Schema Extractor", icon: Bot, desc: "Parse raw unstructured inputs into JSON objects" },
      { type: "intentClassifier", label: "Intent Classifier", icon: Bot, desc: "Route requests to specific paths using semantic intent" },
    ],
  },
  {
    name: "Logic & Branching",
    color: "border-l-4 border-amber-500",
    nodes: [
      { type: "conditionalBranch", label: "Conditional Branch", icon: GitCommit, desc: "Route executions down Yes/No paths based on criteria" },
      { type: "delayStep", label: "Delay Execution", icon: ClockIcon, desc: "Pause flow processing for a configured interval" },
    ],
  },
];

function ClockIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default function NodePalette() {
  const onDragStart = (event, nodeType, label) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify({ type: nodeType, label }));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col h-full overflow-hidden shrink-0">
      <div className="p-5 border-b border-border">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">Node Palette</h3>
        <p className="text-xs text-muted-foreground mt-1">Drag and drop nodes onto the visual workspace</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {nodeCategories.map((category) => (
          <div key={category.name} className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">
              {category.name}
            </h4>
            <div className="space-y-2">
              {category.nodes.map((node) => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.type}
                    className={`p-3 rounded-2xl border border-border bg-card/65 hover:border-indigo-500/30 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 cursor-grab active:cursor-grabbing transition-all duration-200 select-none group flex items-start space-x-3 ${category.color}`}
                    draggable
                    onDragStart={(event) => onDragStart(event, node.type, node.label)}
                  >
                    <div className="w-8 h-8 rounded-xl bg-muted group-hover:bg-indigo-500/10 flex items-center justify-center text-muted-foreground group-hover:text-indigo-500 transition-colors shrink-0">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {node.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed truncate">
                        {node.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
