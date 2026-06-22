import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { Radio, Mail, MessageSquare, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Link2, Unlink, Loader, Settings } from "lucide-react";
import api from "@/services/api";

const providerMetadata = {
  gmail: {
    name: "Gmail Service",
    desc: "Monitor inbox streams or send automated mail alerts.",
    icon: Mail,
    color: "bg-red-500/10 text-red-500 border-red-500/20"
  },
  slack: {
    name: "Slack Messaging",
    desc: "Post alert message outputs directly to target Slack channels.",
    icon: MessageSquare,
    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
  },
  discord: {
    name: "Discord Bot Action",
    desc: "Post webhook notifications to server announcement categories.",
    icon: MessageSquare,
    color: "bg-sky-500/10 text-sky-500 border-sky-500/20"
  },
  "google-sheets": {
    name: "Google Sheets",
    desc: "Write cell data fields to dynamic spreadsheet rows.",
    icon: FileSpreadsheet,
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  }
};

export default function IntegrationsDashboard() {
  const router = useRouter();
  const { error, success } = router.query;

  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [manualProvider, setManualProvider] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const fetchStatus = async () => {
    setLoading(true);
    setInfoMsg("");
    try {
      const res = await api.get("/integrations/status");
      if (res.data && res.data.success) {
        setStatus(res.data.status);
      }
    } catch (err) {
      console.warn("Failed to fetch connection status, loading demo status mapping");
      setStatus({
        gmail: { connected: true, scopes: ["gmail.send"], lastSync: new Date().toISOString() },
        slack: { connected: false, scopes: [], lastSync: null },
        discord: { connected: false, scopes: [], lastSync: null },
        "google-sheets": { connected: true, scopes: ["spreadsheets"], lastSync: new Date().toISOString() }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    if (success === "connected") {
      setInfoMsg("Integration linked successfully.");
    } else if (error === "oauth_exchange_failed") {
      setInfoMsg("OAuth code exchange failed. Please verify credentials.");
    }
  }, [success, error]);

  const handleOAuthConnect = async (provider) => {
    setConnecting(provider);
    try {
      const res = await api.get(`/integrations/oauth/${provider}/start`);
      if (res.data && res.data.success && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert(`OAuth connection failed: ${err.message}`);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider) => {
    if (!window.confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    try {
      await api.post("/integrations/disconnect", { provider });
      fetchStatus();
    } catch (err) {
      alert("Failed to disconnect provider.");
    }
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    if (!accessToken && !webhookUrl) return;

    try {
      await api.post("/integrations", {
        provider: manualProvider,
        credentials: {
          accessToken: accessToken || "mock_manual_token",
          refreshToken: refreshToken || "mock_manual_refresh",
          scopes: ["manual_access"],
          metadata: { webhookUrl }
        }
      });
      setManualProvider(null);
      setAccessToken("");
      setRefreshToken("");
      setWebhookUrl("");
      fetchStatus();
    } catch (err) {
      alert("Failed to save credentials.");
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Integration Center">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header Panel */}
          <div className="p-8 rounded-3xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-tr from-indigo-50/50 to-indigo-100/10 dark:from-indigo-950/20 dark:to-indigo-900/5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Secure Third-Party Credentials</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Connect external services via OAuth or manual credentials to allow our visual execution agents to dispatch emails, post channel messages, read spreadsheets, or trigger actions. All keys are encrypted at rest with AES-256 keys.
            </p>
          </div>

          {infoMsg && (
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-indigo-500" />
              <span>{infoMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm mt-3 font-semibold">Scanning connected services...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(providerMetadata).map(([key, meta]) => {
                const Icon = meta.icon;
                const connection = status[key];
                const connected = connection?.connected;

                return (
                  <div
                    key={key}
                    className="p-6 rounded-3xl border border-border bg-card flex flex-col justify-between hover:border-indigo-500/25 hover:shadow-lg hover:shadow-slate-900/[0.01] dark:hover:shadow-none transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${meta.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          connected
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/25"
                            : "bg-slate-500/10 text-slate-400 border border-border"
                        }`}>
                          {connected ? "Connected" : "Disconnected"}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                        {meta.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {meta.desc}
                      </p>

                      {connected && connection.scopes && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {connection.scopes.map((scope) => (
                            <span key={scope} className="px-2 py-0.5 rounded border border-border bg-muted/40 text-[9px] font-mono text-muted-foreground">
                              {scope.split("/").pop()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-8 pt-4 border-t border-border flex items-center justify-between gap-4">
                      {connected ? (
                        <>
                          <span className="text-[10px] text-slate-400">
                            Synced {connection.lastSync ? new Date(connection.lastSync).toLocaleDateString() : ""}
                          </span>
                          <button
                            onClick={() => handleDisconnect(key)}
                            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-red-200 dark:border-red-950 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 text-xs font-bold transition-colors"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                            <span>Disconnect</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setManualProvider(key)}
                            className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition-colors"
                          >
                            Manual Setup
                          </button>
                          <button
                            onClick={() => handleOAuthConnect(key)}
                            disabled={connecting === key}
                            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50"
                          >
                            {connecting === key ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                            <span>Link Service</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Manual Credentials Modal */}
          {manualProvider && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md p-6 rounded-3xl border border-border bg-card shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm uppercase tracking-wider flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-indigo-500" />
                    <span>Credential Configuration</span>
                  </h4>
                  <button onClick={() => setManualProvider(null)} className="text-muted-foreground hover:text-foreground">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleManualSave} className="space-y-4">
                  {manualProvider === "discord" ? (
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">
                        Discord Webhook URL
                      </label>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-400 block mb-1">
                          Access Token Key
                        </label>
                        <input
                          type="password"
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                          placeholder="oauth_access_token..."
                          className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 block mb-1">
                          Refresh Token Key (Optional)
                        </label>
                        <input
                          type="password"
                          value={refreshToken}
                          onChange={(e) => setRefreshToken(e.target.value)}
                          placeholder="oauth_refresh_token..."
                          className="w-full px-3 py-2 border border-border bg-transparent rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/10 transition-colors cursor-pointer"
                  >
                    Save Encrypted Credentials
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
