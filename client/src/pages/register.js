import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { GitBranch, User, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const { register, isAuthenticated, error, clearError, loading } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    clearError();
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name || !email || !password) {
      setFormError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    const res = await register(name, email, password);
    if (res.success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 font-sans transition-colors duration-300">
      {/* Brand Badge */}
      <div className="flex items-center space-x-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
          <GitBranch className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
          Agentflow_AI
        </span>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-slate-900/5 dark:shadow-none">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Onboard Operator</h2>
          <p className="text-sm text-muted-foreground mt-1">Register a security profile to manage automation agents</p>
        </div>

        {(error || formError) && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-950/40 text-red-600 dark:text-red-400 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{formError || error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Operator Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marcus Aurelius"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Operator Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@agentflow.io"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Security Key Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 active:scale-95 transition-all duration-200 shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Onboarding Profile...</span>
              </>
            ) : (
              <>
                <span>Initialize Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/40 text-center text-sm">
          <span className="text-muted-foreground">Already registered?</span>{" "}
          <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Login Operator
          </Link>
        </div>
      </div>
    </div>
  );
}
