import { useState } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { Sparkles, ArrowRight, Loader, Cpu, CheckCircle, HelpCircle } from "lucide-react";
import api from "@/services/api";

export default function WorkflowBuilder() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState(null);
  const [error, setError] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setGeneratedWorkflow(null);

    try {
      const res = await api.post("/workflows/generate", { prompt });
      if (res.data && res.data.success) {
        setGeneratedWorkflow(res.data.workflow);
      }
    } catch (err) {
      setError(err.response?.data?.error || "AI generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (generatedWorkflow) {
      router.push(`/workflows/${generatedWorkflow._id}`);
    }
  };

  const commonPrompts = [
    "Send an email to supervisor when incoming email has subject 'invoice'",
    "Monitor webhooks and post updates to Slack channel #ops-alerts",
    "Append Google Sheet with sentiment output from AI processing daily"
  ];

  return (
    <ProtectedRoute>
      <AppShell title="AI Visual Generator">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Banner Header */}
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mx-auto mb-4">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Compile visual logic from natural text</h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-lg mx-auto leading-relaxed">
              Describe who you want to integrate with and what processing should happen. Our agent compiler resolves node layouts and config variables.
            </p>
          </div>

          {/* Form Prompter */}
          <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Automation Prompt Instructions
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. When a webhook is received, send the body payload to an AI agent to extract keys and post output to Slack..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {commonPrompts.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrompt(p)}
                      className="px-3 py-1.5 rounded-full border border-border bg-muted/40 hover:bg-muted text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-all duration-200"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-200 shadow-md shadow-indigo-600/10 text-xs cursor-pointer disabled:opacity-75"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Compiling Flow Graph...</span>
                    </>
                  ) : (
                    <>
                      <span>Synthesize Graph</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-950/40 text-red-600 dark:text-red-400 text-sm flex items-center space-x-3">
              <Cpu className="w-5 h-5 shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* Result Preview Panel */}
          {generatedWorkflow && (
            <div className="p-6 rounded-3xl border border-indigo-150 dark:border-indigo-950 bg-indigo-50/20 dark:bg-indigo-950/5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="w-5 h-5 text-indigo-500" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Graph compiled successfully
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Workflow draft: {generatedWorkflow.name}</p>
                  </div>
                </div>
                <button
                  onClick={handleEdit}
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/10"
                >
                  <span>Open Editor Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Node Sequence Summary */}
              <div className="border border-border rounded-2xl bg-card p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                  Synthesized Node Flow
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  {generatedWorkflow.nodes.map((node, index) => (
                    <div key={node.id} className="flex items-center space-x-3">
                      <div className="px-4 py-2.5 rounded-xl border border-border bg-muted/30 flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                        <span className="text-xs font-semibold">{node.data.label}</span>
                      </div>
                      {index < generatedWorkflow.nodes.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
