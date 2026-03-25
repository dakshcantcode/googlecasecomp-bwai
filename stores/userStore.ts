"use client";

import { create } from "zustand";

export interface Subject {
  id: string;
  name: string;
  nodeCount: number;
  masteryPercent: number;
  lastStudied: string;
}

export interface UserStats {
  masteryPercent: number;
  activeErrorPatterns: number;
  streak: number;
}

interface UserStore {
  user: { name: string; email: string } | null;
  stats: UserStats;
  subjects: Subject[];
  setUser: (user: { name: string; email: string } | null) => void;
}

export const useUserStore = create<UserStore>(() => ({
  user: { name: "Yash", email: "yash@example.com" },
  stats: {
    masteryPercent: 62,
    activeErrorPatterns: 3,
    streak: 7,
  },
  subjects: [
    { id: "calculus", name: "Calculus", nodeCount: 42, masteryPercent: 74, lastStudied: "2h ago" },
    { id: "organic-chem", name: "Organic Chemistry", nodeCount: 58, masteryPercent: 45, lastStudied: "yesterday" },
    { id: "mechanics", name: "Mechanics", nodeCount: 35, masteryPercent: 81, lastStudied: "3d ago" },
  ],
  setUser: (user) => ({ user }),
}));
