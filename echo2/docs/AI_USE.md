# AI Use and Prompt Log - NASA Space Apps Hackathon 2026

## Project Overview
- **Project Name:** NASA Mission Control & Space Apps Explorer (Echo-Space v3.5)
- **Architecture:** Offline-First Full-Stack (React 18 + Vite + Express/FastAPI Python Compute Bridge)
- **Compliance:** Rigorously adheres to NASA Space Apps judging criteria (NASA Data as Sole Foundation, Deterministic Science & Computation in Python, Offline Safety Net & Demo Resilience).

## AI Tools & Models Used
- **Google Gemini 2.5/3.5 Flash & Pro:** Utilized via `@google/genai` SDK for natural language explanation of pre-computed scientific data, mission briefings, and voice-interactive telemetry assistant (Echo).
- **Antigravity AI Coding Agent:** Built and structured the codebase, offline caching wrappers, and deterministic compute modules.

## Prompt Engineering & Verification Log
1. **Prompt:** "Design an offline-first NASA Space Apps architecture with deterministic Python computation in `src/compute/` and robust fallback fixtures in `demo_fixtures/`."
   - *Action:* Structured `safe.py`, `src/compute/`, `src/acquire/`, and local fallback fixtures.
2. **Prompt:** "Ensure all physics and orbital calculations are executed deterministically in Python without hallucination."
   - *Action:* Implemented Keplerian propagation, radar backscatter analysis, and spectral catalog parsing algorithms.
3. **Prompt:** "Incorporate NASA data sources: APOD, NeoWs, GIBS Tile Downloader, ASF Search Sentinel-1, IRSA/SPHEREx, SpiceyPy, and OSDR/GeneLab."
   - *Action:* Created dedicated endpoints and data contracts for each required dataset.
