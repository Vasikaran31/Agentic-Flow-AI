import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard,
  GitBranch,
  Activity,
  Radio,
  Settings,
  Bell,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Compass,
  CheckCircle,
  AlertCircle,
  Shield,
  Loader
} from "lucide-react";
import api from "@/services/api";

export default function AppShell({ children, title = "Console" }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState([]);
  const [fetchingNotifications, setFetchingNotifications] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const fetchNotifications = async () => {
    setFetchingNotifications(true);
    try {
      const res = await api.get("/notifications");
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setFetchingNotifications(false);
    }
  };

  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen]);

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Workflow Generator", href: "/workflows/builder", icon: Compass },
    { name: "Executions Feed", href: "/executions", icon: Activity },
    { name: "OAuth Integrations", href: "/integrations", icon: Radio },
    { name: "Settings Hub", href: "/settings", icon: Settings },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform lg:translate-x-0 transition-transform duration-300 ease-out flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Agentflow_AI
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = router.pathname === item.href || (item.href !== "/dashboard" && router.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground group-hover:text-foreground"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile / Logout */}
        <div className="p-4 border-t border-border bg-muted/40">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-500/20">
              {user?.name?.charAt(0).toUpperCase() || "O"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{user?.name || "Operator"}</p>
              <div className="flex items-center mt-1 text-xs text-muted-foreground capitalize">
                <Shield className="w-3. h-3 mr-1 text-indigo-500" />
                {user?.role || "operator"}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 hover:border-red-200 dark:hover:border-red-950/50 transition-all duration-200 text-sm font-medium text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-card-foreground capitalize">{title}</h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* Dark/Light Mode Toggler */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-border hover:bg-muted transition-all duration-200 text-muted-foreground hover:text-foreground"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Notification Center Trigger */}
            <button
              onClick={() => setNotificationsOpen(true)}
              className="p-2.5 rounded-xl border border-border hover:bg-muted transition-all duration-200 text-muted-foreground hover:text-foreground relative"
              aria-label="Notifications Drawer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Notifications Side Drawer */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setNotificationsOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-96 bg-card border-l border-border shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          notificationsOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-lg">System Alerts</h2>
          </div>
          <button
            onClick={() => setNotificationsOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {fetchingNotifications ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-xs mt-2">Pulling system updates...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
              <p className="text-sm font-semibold">Workspace Stable</p>
              <p className="text-xs mt-1 text-slate-400">All integrations and orchestration queues are reporting green.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  n.read ? "bg-card border-border opacity-70" : "bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-950"
                }`}
              >
                <div className="flex items-start space-x-3">
                  {n.type === "failure" || n.type === "escalation" ? (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  ) : n.type === "success" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Bell className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate leading-tight ${n.read ? "text-foreground" : "text-indigo-600 dark:text-indigo-400"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-border bg-muted/40">
            <button
              onClick={markAllAsRead}
              className="w-full py-2.5 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              Acknowledge All Alerts
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
