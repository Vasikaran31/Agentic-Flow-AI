import { LayoutDashboard, Play, CheckCircle, AlertTriangle, Clock } from "lucide-react";

export default function MetricGrid({ stats, loading }) {
  const cards = [
    {
      name: "Total Workflows",
      value: stats?.totalWorkflows ?? 0,
      icon: LayoutDashboard,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40",
      description: "Visual logic structures compiled"
    },
    {
      name: "Active Workflows",
      value: stats?.activeWorkflows ?? 0,
      icon: Play,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
      description: "Triggers listening for events"
    },
    {
      name: "Total Executions",
      value: stats?.totalExecutions ?? 0,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
      description: "Agentic pipeline run operations"
    },
    {
      name: "Execution Success Rate",
      value: `${stats?.successRate ?? 100}%`,
      icon: CheckCircle,
      color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40",
      description: "Successful recovery agent transitions"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 rounded-3xl border border-border bg-card animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-muted"></div>
              <div className="h-4 w-16 bg-muted rounded-full"></div>
            </div>
            <div className="h-8 w-24 bg-muted rounded-xl mb-2"></div>
            <div className="h-3 w-40 bg-muted rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.name}
            className="p-6 rounded-3xl border border-border bg-card hover:border-indigo-500/25 hover:shadow-lg hover:shadow-slate-900/[0.02] dark:hover:shadow-none transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Live</span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-card-foreground">{card.value}</p>
            <p className="text-sm font-semibold mt-1 text-card-foreground/90">{card.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}
