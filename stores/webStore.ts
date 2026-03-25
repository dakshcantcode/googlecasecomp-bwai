"use client";

import { create } from "zustand";

export type NodeState = "mastered" | "progress" | "locked" | "decay";

export interface ConceptNode {
  id: string;
  label: string;
  state: NodeState;
  masteryPercent: number;
  lastReviewed: string;
  errorCount: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface ConceptStrand {
  from: string;
  to: string;
}

export interface SilkTrail {
  fromId: string;
  toId: string;
  timestamp: number;
}

interface WebStore {
  nodes: ConceptNode[];
  strands: ConceptStrand[];
  spiderPosition: string | null;
  silkTrail: SilkTrail[];
  setNodes: (nodes: ConceptNode[]) => void;
  setSpiderPosition: (nodeId: string | null) => void;
  addSilkTrail: (from: string, to: string) => void;
}

export const useWebStore = create<WebStore>((set) => ({
  nodes: [],
  strands: [],
  spiderPosition: null,
  silkTrail: [],
  setNodes: (nodes) => set({ nodes }),
  setSpiderPosition: (spiderPosition) => set({ spiderPosition }),
  addSilkTrail: (fromId, toId) =>
    set((s) => ({
      silkTrail: [...s.silkTrail, { fromId, toId, timestamp: Date.now() }],
    })),
}));
