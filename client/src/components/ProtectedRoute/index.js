import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        {/* Sleek, premium loader */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-slate-800 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
          Securing session context...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
