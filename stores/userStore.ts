"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";

export interface Subject {
  id: string;
  name: string;
  nodeCount: number;
  masteryPercent: number;
  lastStudied: string;
  coverUrl?: string | null;
}

export interface UserStats {
  masteryPercent: number;
  activeErrorPatterns: number;
  streak: number;
}

interface UserStore {
  user: { id: string; name: string; email: string } | null;
  stats: UserStats;
  subjects: Subject[];
  // Auth actions — return error string on failure, null on success
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchSession: () => Promise<void>;
  refreshSubjects: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,

  stats: {
    masteryPercent: 0,
    activeErrorPatterns: 0,
    streak: 0,
  },
  subjects: [],

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    const u = data.user;
    set({ user: { id: u.id, name: u.user_metadata?.name ?? email.split("@")[0], email: u.email! } });
    return null;
  },

  signUp: async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return error.message;
    const u = data.user;
    if (u) set({ user: { id: u.id, name, email: u.email! } });
    return null;
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  fetchSession: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      set({
        user: {
          id: user.id,
          name: user.user_metadata?.name ?? user.email!.split("@")[0],
          email: user.email!,
        },
      });
      // Refresh real stats and subjects after session is confirmed
      fetch("/api/users/me/stats")
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.masteryPercent === "number") {
            set({ stats: data as UserStats });
          }
        })
        .catch(() => {});
      fetch("/api/subjects")
        .then((r) => r.json())
        .then((subjects) => {
          if (Array.isArray(subjects)) set({ subjects });
        })
        .catch(() => {});
    }
  },

  refreshSubjects: async () => {
    const res = await fetch("/api/subjects");
    if (!res.ok) return;
    const subjects: Subject[] = await res.json();
    set({ subjects });
  },

  refreshStats: async () => {
    const res = await fetch("/api/users/me/stats");
    if (!res.ok) return;
    const data: UserStats = await res.json();
    set({ stats: data });
  },
}));
