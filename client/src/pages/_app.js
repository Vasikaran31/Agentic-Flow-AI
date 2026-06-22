import "@/styles/globals.css";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function App({ Component, pageProps }) {
  const init = useAuthStore((state) => state.init);

  useEffect(() => {
    // Initialize auth state from localStorage
    init();

    // Default theme check / initialization
    const theme = localStorage.getItem("theme") || "light";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [init]);

  return <Component {...pageProps} />;
}
