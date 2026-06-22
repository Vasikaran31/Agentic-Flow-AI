import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { io } from "socket.io-client";
import {
  Activity,
  Play,
  Pause,
  XCircle,
  Clock,
  Compass,
  Database,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Loader,
  Terminal,
  RefreshCw
} from "lucide-react";
import api from "@/services/api";

const getAgentColor = (agent) => {
  switch (agent) {
    case "planner": return "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900";
    case "execution": return "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900";
    case "validation": return "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900";
    case "recovery": return "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900";
    case "monitoring": return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900";
    default: return "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800";
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case "COMPLETED": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "FAILED": return "bg-red-500/10 text-red-500 border-red-500/20";
    case "RUNNING": return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-pulse";
    case "PAUSED": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "CANCELLED": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    default: return "bg-slate-500/10 text-slate-400 border-slate-800";
  }
};

export default function ExecutionsFeed() {
  const router = useRouter();
  const { id } = router.query;

  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  
  const socketRef = useRef(null);

  // Fetch execution registry list
  const fetchExecutions = async () => {
    setLoadingList(true);
    try {
      const res = await api.get("/executions");
      if (res.data && res.data.success) {
        setExecutions(res.data.executions);
      }
    } catch (err) {
      console.warn("API list fail: Loading offline console registry");
      setExecutions([
        {
          _id: "demo-run-1",
          workflowSnapshot: { name: "Email Auto-Responder Agent" },
          status: "COMPLETED",
          duration: 3820,
          retryCount: 0,
          createdAt: new Date().toISOString(),
        },
        {
          _id: "demo-run-2",
          workflowSnapshot: { name: "Slack Channel Notification Dispatcher" },
          status: "FAILED",
          duration: 1200,
          retryCount: 1,
          createdAt: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch timeline events for selected execution
  const fetchTimeline = async (executionId) => {
    setLoadingTimeline(true);
    try {
      const res = await api.get(`/executions/${executionId}/timeline`);
      if (res.data && res.data.success) {
        setTimeline(res.data.timeline);
      }
    } catch (err) {
      console.warn("Failed to load real timeline logs, generating offline simulation");
      // Fallback demo timeline
      setTimeline([
        {
          _id: "log-1",
          agent: "orchestrator",
          level: "info",
          message: "Agentflow orchestration session initialized.",
          createdAt: new Date().toISOString(),
          metadata: { langGraph: "available" }
        },
        {
          _id: "log-2",
          agent: "planner",
          level: "info",
          message: "Formulating graph topological plan steps.",
          createdAt: new Date().toISOString()
        },
        {
          _id: "log-3",
          agent: "planner",
          level: "success",
          message: "Plan finalized with confidence 95%. Sequence mapping complete.",
          createdAt: new Date().toISOString()
        },
        {
          _id: "log-4",
          agent: "execution",
          level: "info",
          message: "Invoking manual trigger node config.",
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, []);

  // Update selected execution details when id query updates
  useEffect(() => {
    if (id) {
      const found = executions.find(e => e._id === id);
      if (found) {
        setSelectedExecution(found);
        fetchTimeline(id);
      } else {
        // Fetch details if not in list
        const fetchDetails = async () => {
          try {
            const res = await api.get(`/executions/${id}`);
            if (res.data && res.data.success) {
              setSelectedExecution(res.data.execution);
              fetchTimeline(id);
            }
          } catch (e) {
            console.error(e);
          }
        };
        fetchDetails();
      }
    } else {
      setSelectedExecution(null);
      setTimeline([]);
    }
  }, [id, executions]);

  // Connect Socket.IO for live timeline streaming
  useEffect(() => {
    if (!id) return;

    // Connect to backend server
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5005";
    const socket = io(serverUrl, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`🔌 Socket connected to execution channel: ${socket.id}`);
      socket.emit("join:execution", id);
    });

    socket.on("timeline:event", (logDoc) => {
      setTimeline(prev => {
        // Prevent duplicate logs
        if (prev.some(l => l._id === logDoc._id)) return prev;
        return [...prev, logDoc];
      });

      // Update current status in summary header if status changes
      if (logDoc.agent === 'monitoring' && logDoc.message.includes('completed')) {
        setSelectedExecution(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
      }
    });

    return () => {
      if (socket) {
        socket.emit("leave:execution", id);
        socket.disconnect();
      }
    };
  }, [id]);

  const handleControlAction = async (action) => {
    if (!selectedExecution) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/executions/${selectedExecution._id}/${action}`);
      if (res.data && res.data.success) {
        setSelectedExecution(res.data.execution);
        fetchExecutions(); // Refresh summary list
      }
    } catch (err) {
      alert(`Action "${action}" failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Execution Control Console">
        <div className="h-[calc(100vh-12rem)] flex -m-6 relative overflow-hidden bg-background">
          
          {/* Left Panel: Run History Grid */}
          <div className="w-80 border-r border-border bg-card flex flex-col h-full overflow-hidden shrink-0">
            <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">Run logs</h3>
                <p className="text-xs text-muted-foreground mt-1">Registry of all agent flow executions</p>
              </div>
              <button
                onClick={fetchExecutions}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingList ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-muted/60 animate-pulse rounded-2xl"></div>
                  ))}
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="w-8 h-8 text-indigo-600/30 mx-auto mb-2" />
                  <p className="text-xs font-semibold">No run operations tracked</p>
                </div>
              ) : (
                executions.map((exe) => (
                  <button
                    key={exe._id}
                    onClick={() => router.push(`/executions?id=${exe._id}`)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group flex flex-col ${
                      selectedExecution?._id === exe._id
                        ? "bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-500/40"
                        : "bg-card border-border hover:border-indigo-500/25"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold truncate pr-2">
                        {exe.workflowSnapshot?.name || "Workflow run"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                    <div className="flex items-center space-x-2 mt-3 w-full">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded border uppercase ${
                        exe.status === 'COMPLETED'
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : exe.status === 'FAILED'
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                      }`}>
                        {exe.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {(exe.duration / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Detail Timeline View */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-background/40">
            {selectedExecution ? (
              <>
                {/* Timeline Header Toolbar */}
                <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-bold text-sm truncate max-w-md">
                        {selectedExecution.workflowSnapshot?.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">Run ID: {selectedExecution._id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedExecution.status)}`}>
                      {selectedExecution.status}
                    </span>
                  </div>

                  {/* Execution Control Keys */}
                  <div className="flex items-center space-x-2">
                    {selectedExecution.status === "RUNNING" && (
                      <button
                        onClick={() => handleControlAction("pause")}
                        disabled={actionLoading}
                        className="flex items-center space-x-1 px-4 py-2 border border-border rounded-xl hover:bg-muted text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <Pause className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pause Loop</span>
                      </button>
                    )}

                    {selectedExecution.status === "PAUSED" && (
                      <button
                        onClick={() => handleControlAction("resume")}
                        disabled={actionLoading}
                        className="flex items-center space-x-1 px-4 py-2 border border-border rounded-xl hover:bg-muted text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Resume Loop</span>
                      </button>
                    )}

                    {["PENDING", "RUNNING", "PAUSED", "RETRYING"].includes(selectedExecution.status) && (
                      <button
                        onClick={() => handleControlAction("cancel")}
                        disabled={actionLoading}
                        className="flex items-center space-x-1 px-4 py-2 border border-border rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-600 transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Abort</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Timeline Grid layout */}
                <div className="flex-1 flex overflow-hidden">
                  
                  {/* Timeline Logs Feed */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
                      Cooperating Agent timeline
                    </h5>
                    
                    {loadingTimeline ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Loader className="w-6 h-6 animate-spin text-indigo-500" />
                        <p className="text-xs mt-2">Pulling timeline logs...</p>
                      </div>
                    ) : (
                      <div className="relative border-l border-border pl-6 space-y-6">
                        {timeline.map((log) => (
                          <div
                            key={log._id}
                            onClick={() => setSelectedLog(log)}
                            className="relative group cursor-pointer"
                          >
                            {/* Dot Badge */}
                            <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-border border-2 border-background group-hover:bg-indigo-500 group-hover:scale-110 transition-all"></div>
                            
                            <div className="p-4 rounded-2xl border border-border bg-card hover:border-indigo-500/20 hover:shadow-md hover:shadow-slate-900/[0.01] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-start space-x-3.5">
                                <span className={`px-2.5 py-1 rounded-xl text-[9px] font-bold border uppercase shrink-0 mt-0.5 ${getAgentColor(log.agent)}`}>
                                  {log.agent}
                                </span>
                                <div>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.message}</p>
                                  {log.nodeId && (
                                    <span className="text-[9px] text-slate-400 mt-1 block">Node pointer: {log.nodeId}</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[9px] text-slate-400 shrink-0 font-mono self-end md:self-center">
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Log Inspect Panel */}
                  {selectedLog && (
                    <div className="w-80 border-l border-border bg-card flex flex-col h-full overflow-hidden shrink-0">
                      <div className="p-5 border-b border-border flex items-center justify-between">
                        <h6 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center">
                          <Terminal className="w-4 h-4 text-indigo-500 mr-2" />
                          <span>Payload Inspector</span>
                        </h6>
                        <button
                          onClick={() => setSelectedLog(null)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-xs"
                        >
                          Close
                        </button>
                      </div>
                      <div className="flex-1 p-5 overflow-y-auto font-mono text-[10px] space-y-4">
                        <div>
                          <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Agent Identity</span>
                          <span className="capitalize">{selectedLog.agent}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Event Type</span>
                          <span>{selectedLog.eventType}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Message Trace</span>
                          <p className="leading-relaxed whitespace-pre-wrap">{selectedLog.message}</p>
                        </div>
                        {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                          <div>
                            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Metadata JSON</span>
                            <pre className="p-3 bg-muted rounded-xl max-w-full overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border">
                              {JSON.stringify(selectedLog.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <Terminal className="w-12 h-12 text-indigo-600/30 mb-3" />
                <p className="text-sm font-semibold">Select an Execution Run</p>
                <p className="text-xs text-muted-foreground max-w-xs text-center mt-1">
                  Choose a workflow run from the operations log sidebar to inspect the live multi-agent execution timeline.
                </p>
              </div>
            )}
          </div>

        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
