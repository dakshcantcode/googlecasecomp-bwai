/**
 * Mock subject graph data — used during Phase 3/4 until real backend is wired.
 */

import type { ConceptNode, ConceptStrand } from "@/stores/webStore";

export interface SubjectGraph {
  nodes: ConceptNode[];
  strands: ConceptStrand[];
}

const MOCK_CALCULUS: SubjectGraph = {
  nodes: [
    { id: "limits", label: "Limits", state: "mastered", masteryPercent: 92, lastReviewed: "2d ago", errorCount: 1, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "derivatives", label: "Derivatives", state: "mastered", masteryPercent: 88, lastReviewed: "1d ago", errorCount: 2, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "chain-rule", label: "Chain Rule", state: "progress", masteryPercent: 64, lastReviewed: "3h ago", errorCount: 5, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "integration", label: "Integration", state: "progress", masteryPercent: 51, lastReviewed: "1d ago", errorCount: 8, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "ftc", label: "FTC", state: "locked", masteryPercent: 0, lastReviewed: "never", errorCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "series", label: "Series", state: "locked", masteryPercent: 0, lastReviewed: "never", errorCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "continuity", label: "Continuity", state: "mastered", masteryPercent: 95, lastReviewed: "5d ago", errorCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "product-rule", label: "Product Rule", state: "decay", masteryPercent: 58, lastReviewed: "8d ago", errorCount: 3, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "implicit-diff", label: "Implicit Diff.", state: "progress", masteryPercent: 42, lastReviewed: "2d ago", errorCount: 6, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "l-hopital", label: "L'Hôpital", state: "locked", masteryPercent: 0, lastReviewed: "never", errorCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "related-rates", label: "Related Rates", state: "locked", masteryPercent: 0, lastReviewed: "never", errorCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "optimization", label: "Optimization", state: "locked", masteryPercent: 0, lastReviewed: "never", errorCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
  ],
  strands: [
    { from: "limits", to: "continuity" },
    { from: "limits", to: "derivatives" },
    { from: "derivatives", to: "chain-rule" },
    { from: "derivatives", to: "product-rule" },
    { from: "derivatives", to: "implicit-diff" },
    { from: "chain-rule", to: "related-rates" },
    { from: "limits", to: "l-hopital" },
    { from: "derivatives", to: "integration" },
    { from: "integration", to: "ftc" },
    { from: "ftc", to: "series" },
    { from: "derivatives", to: "optimization" },
    { from: "integration", to: "optimization" },
  ],
};

const MOCK_ORGANIC_CHEM: SubjectGraph = {
  nodes: [
    { id: "bonding", label: "Bonding", state: "mastered", masteryPercent: 90, lastReviewed: "1d ago", errorCount: 1, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "hybridization", label: "Hybridization", state: "mastered", masteryPercent: 82, lastReviewed: "2d ago", errorCount: 2, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "stereochemistry", label: "Stereochem.", state: "progress", masteryPercent: 55, lastReviewed: "4h ago", errorCount: 7, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "alkanes", label: "Alkanes", state: "mastered", masteryPercent: 88, lastReviewed: "3d ago", errorCount: 1, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "alkenes", label: "Alkenes", state: "progress", masteryPercent: 60, lastReviewed: "1d ago", errorCount: 4, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "alkynes", label: "Alkynes", state: "progress", masteryPercent: 45, lastReviewed: "2d ago", errorCount: 5, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "nucleophile", label: "Nucleophile", state: "progress", masteryPercent: 40, lastReviewed: "1d ago", errorCount: 6, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "sn1", label: "SN1", state: "locked", masteryPercent: 0, lastReviewed: "never", errorCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "sn2", label: "SN2", state: "locked", masteryPercent: 0, lastReviewed: "never", errorCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "aromatic", label: "Aromatic", state: "locked", masteryPercent: 0, lastReviewed: "never", errorCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
  ],
  strands: [
    { from: "bonding", to: "hybridization" },
    { from: "hybridization", to: "alkanes" },
    { from: "alkanes", to: "alkenes" },
    { from: "alkenes", to: "alkynes" },
    { from: "bonding", to: "stereochemistry" },
    { from: "bonding", to: "nucleophile" },
    { from: "nucleophile", to: "sn1" },
    { from: "nucleophile", to: "sn2" },
    { from: "alkenes", to: "aromatic" },
    { from: "stereochemistry", to: "sn1" },
    { from: "stereochemistry", to: "sn2" },
  ],
};

const MOCK_MECHANICS: SubjectGraph = {
  nodes: [
    { id: "kinematics", label: "Kinematics", state: "mastered", masteryPercent: 95, lastReviewed: "1d ago", errorCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "newtons-laws", label: "Newton's Laws", state: "mastered", masteryPercent: 90, lastReviewed: "2d ago", errorCount: 1, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "forces", label: "Forces", state: "mastered", masteryPercent: 88, lastReviewed: "1d ago", errorCount: 2, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "energy", label: "Energy", state: "mastered", masteryPercent: 82, lastReviewed: "3d ago", errorCount: 2, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "momentum", label: "Momentum", state: "progress", masteryPercent: 70, lastReviewed: "1d ago", errorCount: 3, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "rotation", label: "Rotation", state: "progress", masteryPercent: 55, lastReviewed: "2d ago", errorCount: 5, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "torque", label: "Torque", state: "locked", masteryPercent: 0, lastReviewed: "never", errorCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "oscillations", label: "Oscillations", state: "locked", masteryPercent: 0, lastReviewed: "never", errorCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
  ],
  strands: [
    { from: "kinematics", to: "newtons-laws" },
    { from: "newtons-laws", to: "forces" },
    { from: "forces", to: "energy" },
    { from: "energy", to: "momentum" },
    { from: "newtons-laws", to: "rotation" },
    { from: "rotation", to: "torque" },
    { from: "energy", to: "oscillations" },
    { from: "forces", to: "momentum" },
  ],
};

export const MOCK_SUBJECTS: Record<string, SubjectGraph> = {
  calculus: MOCK_CALCULUS,
  "organic-chem": MOCK_ORGANIC_CHEM,
  mechanics: MOCK_MECHANICS,
};
