# NASA Mission Control & Space Apps Explorer (Offline-First Architecture)

> **NASA Space Apps Hackathon 2026 Submission**  
> Elite Lead Space-Tech Software Engineer & Architecture Implementation.

---

## 🚀 Architectural Overview

This system is built from the ground up to satisfy rigorous NASA Space Apps judging criteria:
1. **NASA Data as the Sole Foundation:** All datasets, telemetry, and visualization features derive directly from official NASA APIs and repositories.
2. **Deterministic Science & Computation:** All orbital mechanics, radar signal processing, spectral catalog analytics, and spatial math are computed deterministically in Python (`src/compute/`). LLMs are strictly restricted to summarizing pre-computed results (`src/agents/`).
3. **Offline Safety Net & Demo Resilience:** Hackathon Wi-Fi is unreliable. All external network requests route through universal offline safety wrappers (`safe.py`), falling back seamlessly to local disk cache (`cache/`) or pre-packaged demo fixtures (`demo_fixtures/`).

---

## 📂 Directory Structure

```text
project/
├── LICENSE                 # Apache-2.0 Open Source License
├── README.md               # Run guide & explicit dataset references
├── cache/                  # Gitignored local NASA data cache
├── demo_fixtures/          # Offline fallback datasets committed to repository
├── docs/AI_USE.md          # Log of AI tools, prompts, and code generation records
├── src/
│   ├── acquire/            # Data collection scripts & API fetchers
│   ├── compute/            # Deterministic scientific algorithms & physics math
│   ├── agents/             # AI prompt templates & explanation logic
│   └── api/                # FastAPI / Express backend endpoints
└── web/                    # Offline-first React UI frontend & HUD
```

---

## 🛰️ Integrated NASA Datasets & Feeds

| Dataset / API | Purpose in Application | Fallback Fixture / Cache |
| :--- | :--- | :--- |
| **NASA APOD** | Astronomy Picture of the Day & mission context | `demo_fixtures/apod_fixture.json` |
| **NeoWs (Near-Earth Objects)** | Asteroid close-approach radar tracking & hazard analysis | `demo_fixtures/neows_fixture.json` |
| **GIBS Tile Downloader** | Global Imagery Browse Services for offline satellite mapping | `demo_fixtures/gibs_tiles/` |
| **ASF Search (Sentinel-1 SAR)** | Synthetic Aperture Radar flood & terrain detection | `demo_fixtures/sentinel1_fixture.json` |
| **IRSA / SPHEREx** | Infrared spectral catalog analytics & galaxy redshift parsing | `demo_fixtures/spherex_fixture.json` |
| **SpiceyPy / JPL SSD** | High-precision orbital ephemeris & trajectory geometry | `demo_fixtures/spice_fixture.json` |
| **OSDR / GeneLab** | Space biology multi-omics & gene expression analysis | `demo_fixtures/genelab_fixture.json` |

---

## 🛠️ Quick Start & Run Guide

1. **Install Dependencies:**
   ```bash
   npm install
   pip install -r requirements.txt # (if running Python compute backend)
   ```
2. **Start Development Server:**
   ```bash
   npm run dev
   ```
3. **Build for Production:**
   ```bash
   npm run build
   ```
