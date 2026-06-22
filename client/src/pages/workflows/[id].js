import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import NodePalette from "@/components/NodePalette";
import WorkflowCanvas from "@/components/WorkflowCanvas";
import NodeConfigPanel from "@/components/NodeConfigPanel";
import { addEdge, useNodesState, useEdgesState } from "@xyflow/react";
import { Save, Play, Trash, Copy, AlertCircle, CheckCircle, Loader } from "lucide-react";
import api from "@/services/api";

export default function WorkflowEditor() {
  const router = useRouter();
  const { id } = router.query;

  const [workflow, setWorkflow] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchWorkflow = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/workflows/${id}`);
      if (res.data && res.data.success) {
        const wf = res.data.workflow;
        setWorkflow(wf);
        setNodes(wf.nodes || []);
        setEdges(wf.edges || []);
      }
    } catch (err) {
      setError("Failed to load workflow configuration.");
    } finally {
      setLoading(false);
    }
  }, [id, setNodes, setEdges]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeSelect = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const onUpdateNode = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          node.data = newData;
        }
        return node;
      })
    );
  }, [setNodes]);

  const onDropNode = useCallback(
    ({ type, label, position }) => {
      const newNode = {
        id: `${type}-${Date.now().toString().slice(-4)}`,
        type,
        position,
        data: { label, config: {} },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.put(`/workflows/${id}`, {
        nodes,
        edges,
      });
      if (res.data && res.data.success) {
        setSuccess("Workflow configurations saved successfully.");
        setWorkflow(res.data.workflow);
      }
    } catch (err) {
      setError("Failed to save workflow changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post(`/workflows/${id}/execute`);
      if (res.data && res.data.success) {
        setSuccess("Workflow execution triggered successfully. Routing to timeline...");
        setTimeout(() => {
          router.push(`/executions?id=${res.data.execution._id}`);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to trigger workflow execution.");
    } finally {
      setExecuting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this workflow? This cannot be undone.")) return;
    try {
      await api.delete(`/workflows/${id}`);
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to delete workflow.");
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await api.post(`/workflows/${id}/duplicate`);
      if (res.data && res.data.success) {
        router.push(`/workflows/${res.data.workflow._id}`);
      }
    } catch (err) {
      setError("Failed to duplicate workflow.");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell title="Loading Workflow...">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
            <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm mt-3 font-semibold">Initializing visual canvas context...</p>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell title={workflow?.name || "Workflow Editor"}>
        <div className="h-[calc(100vh-12rem)] flex flex-col -m-6 relative overflow-hidden bg-background">
          {/* Editor Header / Toolbar */}
          <div className="h-14 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-muted px-2.5 py-1 rounded-full">
                Status: {workflow?.status}
              </span>
              <span className="text-xs font-bold text-slate-400">Version {workflow?.version}</span>
            </div>

            <div className="flex items-center space-x-2.5">
              {error && (
                <div className="text-red-500 flex items-center space-x-1 text-xs font-bold bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl border border-red-100 dark:border-red-950">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="text-emerald-500 flex items-center space-x-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-950">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{success}</span>
                </div>
              )}

              <button
                onClick={handleDuplicate}
                className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
                title="Duplicate Workflow"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                onClick={handleDelete}
                className="p-2 rounded-xl border border-border hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-600 hover:border-red-100 dark:hover:border-red-950 transition-all duration-200"
                title="Delete Workflow"
              >
                <Trash className="w-4 h-4" />
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-all duration-200 disabled:opacity-50"
              >
                {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Config</span>
              </button>

              <button
                onClick={handleExecute}
                disabled={executing}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all duration-200 shadow-md shadow-indigo-600/10 disabled:opacity-50"
              >
                {executing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Trigger Run</span>
              </button>
            </div>
          </div>

          {/* Workflow Canvas Workspace Frame */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Hand Palette */}
            <NodePalette />

            {/* Central Canvas */}
            <WorkflowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeSelect={onNodeSelect}
              onDropNode={onDropNode}
            />

            {/* Right Hand Config Inspector */}
            {selectedNode && (
              <NodeConfigPanel
                selectedNode={selectedNode}
                onUpdateNode={onUpdateNode}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
