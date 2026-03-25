# Co-Synapse — Project Overview

## What Is Co-Synapse?

Co-Synapse is an AI-powered exam preparation platform built around a single insight: **most students fail exams not because they don't know the material, but because they've confused recognition with retrieval.**

Highlighting notes, re-reading textbooks, and watching videos are all recognition tasks — they feel productive because the information is right there. Exams are retrieval tasks — the information is gone and your brain has to reconstruct it under pressure. Co-Synapse trains that gap.

The name reflects the idea of a cognitive co-regulator — a system that works alongside the student's own thinking to strengthen the synaptic connections that make real recall possible.

---

## The Problem We're Solving

**1. Passive study doesn't build retrieval strength.**
Students spend most of their study time in passive modes (reading, re-watching, summarising). These build familiarity, not recall. When the exam arrives, familiarity collapses under pressure.

**2. Most students don't know where their understanding actually breaks.**
A student might know the chain rule formula but fail to apply it in a novel context. Standard practice problems don't reveal this — they test the same surface pattern repeatedly. The student never encounters the exact conceptual break point.

**3. Silly mistakes under exam pressure are a real, trainable problem.**
Students routinely get questions right in practice and wrong in exams. The reason is not knowledge — it's cognitive load, time pressure, and distraction. These can be replicated in practice and trained away.

**4. Error classification is missing from most tools.**
Flashcard apps record right/wrong. They don't ask: *why* was it wrong? Was it a careless arithmetic slip? A procedural misapplication? A genuine conceptual gap? The remediation for each is completely different.

**5. Forgetting is predictable but ignored.**
Memory follows a forgetting curve. The optimal moment to review a concept — just before you'd forget it — is calculable. Most students review either too early (waste) or too late (re-learning from scratch). Neither builds durable memory.

---

## What We Aim to Achieve

### Primary Goal
Build a study tool that genuinely improves exam performance — not one that makes students feel like they're studying while actually just consuming content.

### Specific Outcomes
- Students can identify *exactly* which concepts they've mastered and which have gaps
- Students can distinguish between types of errors and receive targeted remediation for each
- Students can maintain performance under pressure — not just in a quiet room
- Retrieval is timed for biological optimality (spaced repetition), not user preference
- The system adapts in real time to cognitive state — confused, distracted, overwhelmed — and modifies difficulty and format accordingly

### Who It's For
Primarily university students preparing for high-stakes exams — STEM, medicine, law, professional qualifications. Anyone whose exams require genuine understanding rather than surface recognition.

---

## How We're Doing It

### 1. The Knowledge Web

When a student uploads their notes or PDF, the system uses the Claude API to extract concepts and the relationships between them. This becomes a **concept web** — a force-directed graph where each node is a concept and each edge is a dependency.

The web makes structure visible. Students can see:
- Which concepts are foundational (high degree, near center)
- Which are advanced (peripheral, locked until prerequisites mastered)
- Which are decaying (last reviewed too long ago)
- Exactly where their current mastery frontier sits

The web is interactive — pan, zoom, click a node to study it. A spider avatar tracks the student's current position and leaves a silk trail along the path of completed concepts.

### 2. Six Question Formats Per Concept

For each concept, the system generates questions in six formats:

| Format | What It Tests |
|--------|--------------|
| Free-text | Open retrieval — forces full reconstruction |
| Multiple choice | Discrimination — can you tell the right answer from plausible wrong ones |
| Numeric | Precision — exact value, right unit |
| Multi-step | Procedure — can you chain the reasoning without prompts |
| Symbolic (LaTeX) | Formal expression — do you know the notation, not just the words |
| Teachback | Deep understanding — explain it to someone who doesn't know it |

Exams ask across all these modes. Study tools that only use one format produce students who only know one mode.

### 3. The Flash Round — Training Silly Mistakes

Every few questions, the platform triggers a **flash round**: the same question appears with a 30-second countdown and an active distractor (noise numbers on screen, a red dot to catch, a Stroop word challenge). The student must answer the question *and* manage the distraction simultaneously.

This replicates the cognitive load of an exam hall. Students who get questions right in calm practice but wrong under pressure are trainable — they just need to practice under pressure.

If a student fails the flash round, the same question is immediately re-presented without the timer. The experience is: fail under pressure → succeed without pressure → learn the gap between them.

### 4. Error Taxonomy

Every wrong answer is classified into one of four types:

| Type | Meaning | Remediation |
|------|---------|-------------|
| Careless | Knew it, rushed it | Flash rounds, slow-down prompts |
| Procedural | Wrong method applied | Worked examples, step-by-step format |
| Conceptual | Fundamental misunderstanding | Simplified explanation, teachback |
| Fatigue | Correct earlier, wrong now | Session break, reduce session length |

When the same error type appears repeatedly for the same concept, a pattern alert fires and a targeted drill is queued. This turns error patterns from noise into signal.

### 5. Format Switching

If a student fails the same concept twice, the format automatically switches — from free-text to a worked example, then to a simplified plain-language explanation, then to audio, simulation, or video. The premise: if one representation isn't clicking, try another. The system tries each format before concluding that the student needs more foundational work.

### 6. Spaced Repetition — The Forget Engine

Reviews are timed using spaced repetition (SM-2 / FSRS algorithm). The system calculates the exact moment a memory is about to decay and surfaces the concept just before that point. Reviewing too early is wasted effort. Reviewing too late means re-learning. The optimal window is uncomfortable — the memory is effortful to retrieve — and that effortful retrieval is precisely what deepens encoding.

The review queue shows each concept's storage strength (how consolidated the memory is) and retrieval strength (how easily it surfaces under pressure) separately. A concept with high storage but low retrieval is a classic exam failure waiting to happen.

### 7. Mental-State Adaptation

The system monitors response time patterns, rolling accuracy, idle time, and skip rate. From this, it infers the student's current cognitive state:

| State | Signals | Intervention |
|-------|---------|-------------|
| Normal | Steady pace, decent accuracy | No change |
| Confused | Low accuracy, slow responses | Switch to simplified format, add hints |
| Distracted | Long idle periods, fast wrong answers | Focus mode, reduce visual complexity |
| Overwhelmed | Rapidly declining accuracy + speed | Shorten session, encouraging message, reduce dots |

This runs passively in the background. The student never has to self-report — the system infers and adapts.

---

## Technical Approach

**Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Shadcn UI, Framer Motion. The 3D spider web on the landing page uses a hand-rolled Canvas 2D engine with perspective projection — no Three.js dependency.

**State:** Zustand stores for user, web graph, and session state. All data currently mocked; designed to swap to real API by changing one flag in `lib/api.ts`.

**Backend (planned):** FastAPI (Python), Claude API for concept extraction, question generation, grading, and teachback evaluation. PostgreSQL for persistence, Redis for async document processing queue.

**Design language:** "The Daily Synapse" — a newspaper aesthetic. Gold (`#D4A843`) as the primary accent, Playfair Display for headings, newsprint backgrounds. The visual metaphor is intentional: newspapers present dense, interconnected information with clear hierarchy. So does a knowledge web.

---

## What This Is Not

- It is not a flashcard app. Flashcards test recognition in a low-pressure environment. That's not what exams test.
- It is not a content platform. It does not generate lectures or summaries. It only generates retrieval practice.
- It is not an AI tutor that explains things. It is a system that makes your brain retrieve things — because retrieval, not explanation, is what builds exam-ready memory.

---

## Current State

The full frontend is complete and running. All study mechanics — the web, the session loop, flash rounds, error classification, format switching, teachback, spaced review queue, onboarding, and settings — are implemented and functional with mock data. The backend AI pipeline (document ingestion, question generation, semantic grading, streaming teachback, spaced repetition scheduling) is the remaining work before the platform is production-ready.

See `progress.md` for a detailed breakdown of what exists and exactly what backend endpoints need to be built.
