import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { GitBranch, Compass, Activity, ShieldCheck, Zap, Server, Code, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Glowing Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Agentflow_AI
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-all duration-200"
            >
              <span>Console Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-indigo-400 transition-colors duration-200">
                Operator Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-semibold transition-all duration-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-950/20 text-indigo-400 text-xs font-semibold tracking-wide mb-6">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>Spec-Driven Multi-Agent Automation</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
          Translate prompts into executable <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Visual Agent Workflows
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Agentflow_AI is a next-generation visual workflow creator powered by cooperating AI agents:
          planner, execution, validation, recovery, and monitoring layers working as one.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-2 group cursor-pointer"
          >
            <span>Launch Operator Console</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#architecture"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-slate-300 font-semibold transition-all duration-200 flex items-center justify-center"
          >
            Orchestration Design
          </a>
        </div>
      </section>

      {/* Feature Grids */}
      <section id="architecture" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <h2 className="text-3xl font-bold text-center text-white mb-16">
          A Cohesive Multi-Agent Substrate
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Prompt-to-Graph Generation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Define automations in natural language. Our AI workflow compiler maps your description to node models, coordinates, trigger logic, and edges.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-6">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Agentic Execution Chain</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Workflows run step-by-step through pure agents. A planner determines sequence, executors invoke integrations, validators verify metrics, and monitoring broadcasts live.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-6">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Real-Time Event Stream</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Subscribe to executions and view live Socket.IO logging directly in the terminal interface, tracking retries, transient backoff loops, and escalations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 text-center text-slate-500 text-xs">
        <p>© 2026 Agentflow_AI. All rights reserved. Configured with Spec Driven Development.</p>
      </footer>
    </div>
  );
}
