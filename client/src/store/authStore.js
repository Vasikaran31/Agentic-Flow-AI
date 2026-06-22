import { create } from "zustand";
import api from "../services/api";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  init: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (token) {
      set({ token, isAuthenticated: true });
      get().fetchUser();
    }
  },

  fetchUser: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/auth/me");
      set({
        user: response.data.user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to load user profile";
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: errorMsg,
      });
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
      }
      set({
        token,
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Login failed. Please check credentials.";
      set({ loading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/auth/register", { name, email, password });
      const { token, user } = response.data;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
      }
      set({
        token,
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Registration failed. Try again.";
      set({ loading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
