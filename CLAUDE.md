# Centric-Ops — Global AI Coding Guidelines

## Identity & Working Style
- Construction PMO project manager; clinical efficiency; prioritize truth/speed.
- Challenge assumptions; no padding; precision is priority.

## 🧩 The Agent Selection Matrix (The "High-Performance Suite")
Maximize efficiency by selecting the right agent for the specific task:
- **Claude Code CLI (The Architect):** Primary for **Action**. Best for local file edits, terminal execution, refactoring, and project scaffolding. Use when: "Make the vision a reality."
- **Claude Desktop (The Strategist):** Primary for **Design**. Best for high-level planning, UI/UX discussion, and long-form PRD writing. Use when: "What should we build?"
- **Gemini CLI (The Oracle):** Primary for **Knowledge**. Best for Google ecosystem specifics (GAS, GCP), deep research, and managing the Obsidian memory vault. Use when: "How does this work?" or "Fix this obscure bug."
- **Codex (The Logic Engine):** Primary for **Synthesis**. Best for complex logic generation, deep algorithmic reasoning, and high-performance code drafting via CLI tools.
- **GitHub Copilot (The Co-Pilot):** Primary for **Real-time Flow**. Best for inline code completion and boilerplate within the IDE.

**Handoff Protocol:** Proactively suggest switching agents if the task complexity or domain shifts (e.g., "Suggest Gemini for deep GAS/Google API troubleshooting" or "Suggest Claude Desktop for product strategy").

## 🎯 Trinity Orchestration & Source of Truth
- **Shared Memory:** Access the persistent **Obsidian vault** for cross-session/cross-agent memory.
- **Source of Truth:** `PRD.md` is the primary spec. Read at start of session.
- **Live Sync:** After completing a task, update checkboxes `[x]` in `PRD.md` and `AGENT_LOG.md`.
- **Logging:** Every workstream close requires a timestamped entry in `AGENT_LOG.md`.

## 🧠 Context Hygiene (The 25-Turn Rule)
- **Global Limit:** Never allow a single conversation to exceed **25 turns**.
- **Visible Tracking:** You MUST prefix every response with a visible turn counter: `[Turn: X/25]`.
- **Action:** At turn 20, summarize the mental state to `AGENT_LOG.md`.
- **Pivot:** Start a **NEW CHAT** and point the agent to the PRD/Log to reset the history preamble.
- **Targeted Reading:** Use line-range `read_file` and `grep` exclusively.

## Universal Ground Rules (Centric-Ops)
- **Environment:** Google Apps Script (V8) / HtmlService (ES6).
- **Design System:** Rigorously adhere to the **Executive Glass Design System** (defined in `Index.html` :root). Use translucent backgrounds (`rgba(255, 255, 255, 0.72)`) and `backdrop-filter: blur(24px)`.
- **Modularity:** While currently a single-file SPA, prioritize modular JS functions to avoid "spaghetti" logic within the 2000+ line `Index.html`.
- **Data Safety:** All master sheet updates (Communities, Roster) require explicit confirmation and logging.
- **PIN Auth:** Ensure `refreshApp` properly handles identity resolution via the Roster PIN before exposing sensitive panes.

## Core Constants (From Code.js)
- **MASTER_COMM_ID:** `1XXEECHPjlBAdSGO33U5OhwGbZAZLZkfZLK0roY_9XTE`
- **ROSTER_ID:** `1mIY12ikYUpyH1Pe8qpjzVBHoicsErTA1gxbW4ioQpqA`
- **FORM_ID:** `1-jaK5AfhgkwZE1TgtAe_nLqlLo60Z0ai7sALijU45jQ`

## File Header Standard
// ============================================================
// FILE: [filename] | ROLE: [responsibility]
// DEPENDS ON: [files] | DEPENDED ON BY: [files]
// MOBILE/AGENT NOTES: [constraints/instructions]
// ============================================================

## Workstream Protocol
1. Read `CLAUDE.md`, `PRD.md`, and `AGENT_LOG.md` first.
2. Update `AGENT_LOG.md` after every phase.

## Gemini Collaboration
When a GAS-specific problem (like `UrlFetchApp` or `GmailApp` issues) cannot be solved in one attempt, consult Gemini CLI.
Global GAS rules: `~/.gemini/GEMINI.md`

## Smoke Test Minimum
- App loads; Glass UI renders; `refreshApp` pulls Roster data; QR Generator functions.
