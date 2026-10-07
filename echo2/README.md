# NASA Mission Control & Space Apps Explorer (Offline-First Architecture)

> **NASA Space Apps Hackathon 2026 Submission**  
> Explore the machines humans left behind in space.

---

## 👥 Team Information

**Team Name:** Team Lost_in_Space

### Team Members

- **Tasnuba Tarannum Taha** — Team Leader, Testing & Voice 
- **Tamim khan shuvo** — Web Developer & Scripting
- **Sabikun Nahar** — UI/UX Designer & Developer
- **Sharmishta Sarker** — Video Editor
- **Sohan Ibn Sahid** — Researcher
- **A B M Sojibur Rahman** — Researcher

---

## 🎯 High-Level Summary

Echoes of Exploration is an interactive educational platform developed for the NASA Space Apps Challenge 2026. Inspired by the "Abandoned but Not Forgotten" challenge, the platform helps users discover the stories of spacecraft, landers, rovers, and scientific instruments that remain on the Moon, Mars, and beyond.

Through AI-powered conversations, interactive planetary maps, mission archives, NASA media resources, and gamified learning experiences, users can explore the legacy of these machines and their contributions to scientific discovery.

---

## 🚀 Architectural Overview

This system is built from the ground up to satisfy rigorous NASA Space Apps judging criteria:
1. **NASA Data as the Sole Foundation:** All datasets, telemetry, and visualization features derive directly from official NASA APIs and repositories.
2. **Deterministic Science & Computation:** All orbital mechanics, radar signal processing, spectral catalog analytics, and spatial math are computed deterministically in TypeScript (`src/compute/`). LLMs are strictly restricted to summarizing pre-computed results (`src/agents/`).
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
│   └── api/                # Express backend endpoints
└── web/                    # Offline-first React UI frontend & HUD
```
### Google AI Studio Project

https://ai.studio/apps/e17a957c-9dd9-4b25-8729-f0d762b458a4

---

## 💡 Our Solution

Echoes of Exploration transforms mission archives and NASA data into an engaging digital museum where users can:

- Explore abandoned NASA hardware
- Learn mission histories
- Interact with an AI guide
- View planetary maps
- Access NASA media resources
- Complete educational challenges
- Discover the legacy of historic exploration missions

The platform combines storytelling, AI assistance, interactive visualization, and gamification to make space exploration more engaging and accessible.

---

## 🛰️ Integrated NASA Datasets & Feeds
## ✨ Key Features

### 🤖 Echo AI Companion

Users can interact with Echo through text and voice conversations to learn about NASA missions, abandoned hardware, scientific discoveries, and space exploration topics. Echo can also guide users through different sections of the platform.

### 🛰️ Hardware Atlas

Interactive Moon and Mars maps displaying locations of historic NASA hardware, landers, rovers, and exploration equipment.

### 🚀 Mission Explorer

A searchable archive of historic NASA missions and abandoned equipment featuring mission histories, discoveries, and exploration records.

### 📡 NASA Data Observatory

Integration of NASA open data sources including APOD, NeoWs, DONKI, and NASA Image & Video Library.

### 🎓 NASA Space School

Quiz-based learning experience featuring XP progression, educational challenges, achievement badges, and rank advancement.


---

## 🛰️ NASA Open Data Integration

The project utilizes publicly available NASA resources to provide authentic educational content and scientific information.

### NASA Resources Used

- Astronomy Picture of the Day (APOD)
- Near Earth Object Web Service (NeoWs)
- DONKI Space Weather Database
- NASA Image and Video Library
- NASA Mission Archives
- 
### How NASA Data Is Used

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
