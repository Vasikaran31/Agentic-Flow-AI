import { useCallback, useRef, useState, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Play, Mail, MessageSquare, Bot, GitCommit, FileSpreadsheet, Settings } from "lucide-react";

// Icons mapper
const getIcon = (type) => {
  if (type?.includes("gmail")) return Mail;
  if (type?.includes("slack") || type?.includes("discord")) return MessageSquare;
  if (type?.includes("sheets")) return FileSpreadsheet;
  if (type?.includes("llm") || type?.includes("Extractor") || type?.includes("Classifier")) return Bot;
  if (type?.includes("conditional") || type?.includes("branch")) return GitCommit;
  if (type?.includes("Trigger")) return Play;
  return Settings;
};

// Colored Left border mapping
const getBorderColor = (type) => {
  if (type?.includes("Trigger")) return "border-l-emerald-500";
  if (type?.includes("Action")) return "border-l-indigo-500";
  if (type?.includes("llm") || type?.includes("extractor") || type?.includes("classifier")) return "border-l-violet-500";
  return "border-l-amber-500";
};

// ── Custom Node Design ────────────────────────────────────────────────
function CustomWorkflowNode({ id, data, type, selected }) {
  const Icon = getIcon(type);
  const border = getBorderColor(type);

  return (
    <div className={`p-4 rounded-2xl border bg-card text-foreground shadow-sm max-w-[200px] w-48 transition-all duration-200 border-l-4 ${border} ${
      selected ? "ring-2 ring-indigo-500/50 border-indigo-500" : "border-border"
    }`}>
      {/* Input Handle */}
      {!type.includes("Trigger") && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full"
        />
      )}

      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold truncate leading-tight">{data.label}</p>
          <p className="text-[8px] text-muted-foreground mt-0.5 uppercase tracking-wider">{type}</p>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full"
      />
    </div>
  );
}

const nodeTypes = {
  manualTrigger: CustomWorkflowNode,
  webhookTrigger: CustomWorkflowNode,
  scheduleTrigger: CustomWorkflowNode,
  gmailTrigger: CustomWorkflowNode,
  gmailAction: CustomWorkflowNode,
  slackAction: CustomWorkflowNode,
  discordAction: CustomWorkflowNode,
  sheetsAction: CustomWorkflowNode,
  llmReasoner: CustomWorkflowNode,
  schemaExtractor: CustomWorkflowNode,
  intentClassifier: CustomWorkflowNode,
  conditionalBranch: CustomWorkflowNode,
  delayStep: CustomWorkflowNode,
};

export default function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeSelect,
  onDropNode,
}) {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const rawData = event.dataTransfer.getData("application/reactflow");
      if (!rawData) return;

      const { type, label } = JSON.parse(rawData);

      // Projects client coordinates to canvas coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      onDropNode({ type, label, position });
    },
    [reactFlowInstance, onDropNode]
  );

  const onNodeClick = useCallback((event, node) => {
    onNodeSelect(node);
  }, [onNodeSelect]);

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const defaultEdgeOptions = useMemo(() => ({
    style: { strokeWidth: 2, stroke: "#6366f1" },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#6366f1",
    },
  }), []);

  return (
    <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Controls position="bottom-right" className="bg-card border-border fill-foreground" />
        <MiniMap
          nodeColor={() => "#6366f1"}
          maskColor="rgba(99, 102, 241, 0.05)"
          className="bg-card border-border rounded-xl shadow-lg border"
        />
        <Background gap={16} size={1} color="rgba(99, 102, 241, 0.05)" />
      </ReactFlow>
    </div>
  );
}
export { CustomWorkflowNode };
