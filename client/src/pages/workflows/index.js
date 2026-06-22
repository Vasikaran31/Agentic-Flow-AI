import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { Plus, GitBranch, Search, Loader, RefreshCw, Trash, Play } from "lucide-react";
import api from "@/services/api";

export default function WorkflowsIndex() {
  const [workflows, setWorkflows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWorkflows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/workflows");
      if (res.data && res.data.success) {
        setWorkflows(res.data.workflows);
      }
    } catch (err) {
      setError("Failed to fetch user workflows. Loading offline fallback grid.");
      setWorkflows([
        {
          _id: "demo-1",
          name: "Email Auto-Responder Agent",
          description: "Reads incoming Gmail headers and automatically synthesizes replies using LLM reasoning.",
          status: "active",
          version: 2,
          executionCount: 24,
          updatedAt: new Date().toISOString(),
        },
        {
          _id: "demo-2",
          name: "Slack Channel Notification Dispatcher",
          description: "Monitors Webhooks and formats visual Slack posts with attached sheets audit logs.",
          status: "active",
          version: 1,
          executionCount: 18,
          updatedAt: new Date().toISOString(),
        },
        {
          _id: "demo-3",
          name: "Discord Alert Escalation System",
          description: "Decides whether to notify the team or write backup records based on error classification.",
          status: "draft",
          version: 1,
          executionCount: 6,
          updatedAt: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this workflow?")) return;
    try {
      await api.delete(`/workflows/${id}`);
      setWorkflows(workflows.filter(w => w._id !== id));
    } catch (err) {
      alert("Failed to delete workflow");
    }
  };

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <AppShell title="Automation Workflows">
        <div className="space-y-6">
          {/* Header Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workflows by name or keywords..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center space-x-2.5 shrink-0">
              <button
                onClick={fetchWorkflows}
                className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
                title="Refresh Workflows"
              >
                <RefreshCw className="w-4.5 h-4.5" />
              </button>
              <Link
                href="/workflows/builder"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-200 shadow-md shadow-indigo-600/10 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Compile Workflow</span>
              </Link>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-950 text-amber-700 dark:text-amber-400 text-xs">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm mt-3 font-medium animate-pulse">Pulling workflows registry...</p>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="p-16 border border-border border-dashed rounded-3xl text-center bg-card">
              <GitBranch className="w-12 h-12 text-indigo-600/30 mx-auto mb-3" />
              <p className="text-sm font-semibold">No workflows found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try updating your query or compile a new automation prompt to initialize.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkflows.map((wf) => (
                <div
                  key={wf._id}
                  className="p-6 rounded-3xl border border-border bg-card flex flex-col justify-between hover:border-indigo-500/25 hover:shadow-lg hover:shadow-slate-900/[0.01] dark:hover:shadow-none transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        wf.status === 'active'
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}>
                        {wf.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">v{wf.version}</span>
                    </div>

                    <Link
                      href={`/workflows/${wf._id}`}
                      className="font-bold text-base hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate"
                    >
                      {wf.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                      {wf.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {wf.executionCount} executions
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDelete(wf._id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Delete Workflow"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/workflows/${wf._id}`}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-xs font-semibold transition-colors"
                      >
                        Edit Layout
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
