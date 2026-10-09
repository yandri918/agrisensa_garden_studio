---
title: "AgriSensa Garden Studio - Spatial Precision Garden Planner with Open-Source AI, RAG & Digital Twin"
published: true
tags: devchallenge, hacktoberfest, opensource, ai
cover_image: https://agrisensa-garden-studio-production.up.railway.app/cover.jpg
---

> *"Design on your screen. Step outside with your tape measure. Touch the soil. Grow together."*

![AgriSensa Garden Studio: Spatial Precision Garden Planner](https://agrisensa-garden-studio-production.up.railway.app/cover.jpg)

This submission is built for the **Hacktoberfest Open-Source AI Challenge — Week 1: Touch Grass**.

* **Live Demo (Production on Railway):** [https://agrisensa-garden-studio-production.up.railway.app](https://agrisensa-garden-studio-production.up.railway.app)
* **GitHub Repository (MIT Open Source):** [https://github.com/yandri918/agrisensa_garden_studio](https://github.com/yandri918/agrisensa_garden_studio)

---

## The "Touch Grass" Connection: Why We Built This

Modern humans spend an average of 9+ hours a day glued to computer and smartphone screens. We talk about food sovereignty, sustainable living, and urban farming, but stepping outside into an overgrown, empty backyard often feels overwhelming:
* *Where should the raised beds go so they get maximum morning sunlight?*
* *How far should they be from the water tap to keep piping efficient?*
* *Will this sprinkler accidentally spray my chicken coop and create mud?*
* *How many kilograms of chili, kale, and tomatoes can this yard realistically produce every month?*

**AgriSensa Garden Studio** was born to bridge digital planning and tangible outdoor action. 

Our application does not keep you on the screen. **The screen is merely the launchpad to get your hands dirty in the soil.** It transforms your physical yard into a measurable, buildable spatial blueprint, generates a physical 4-week outdoor task roadmap, and walks with you into the field with camera-based plant disease scouting.

---

## What Does AgriSensa Garden Studio Do?

AgriSensa Garden Studio is an open-source, full-stack precision agro-spatial planning suite:

### 1. Deterministic 2D Blueprint & 3D Digital Twin
* Measure yard dimensions down to centimeters ($m$ and $m^2$).
* Drag-and-drop real facilities: Raised Beds, Hydroponic A-Frames, Fish Ponds, Compost Stations, Pathways, Chicken Coops, and IoT Soil Probes.
* Real-time 3D spatial scene powered by Three.js and `@react-three/fiber` with Orbital, Bird's Eye, and Human Eye-level camera modes.

### 2. Smart Precision Irrigation Engine
* Drip irrigation configuration (emitter spacing, lateral line counts, water volume estimations).
* Sprinkler coverage radii ($1.0m - 4.0m$) with interactive transparent spray overlap circles.
* **Spatial Safety Rules Engine**: Deterministic BFS collision detection that prevents environmental conflicts (e.g., throwing a safety hazard if a sprinkler sprays a chicken coop).

### 3. Generative AI Spatial Planner (Gemini 3.8 Flash Cascade)
* **Auto-Arrange Mode**: Unlike generic AI templates that wipe out your layout, our custom auto-arrange re-positions the *exact components you selected from the sidebar* into an optimal, collision-free layout with accessible $0.6m$ maintenance aisles.
* Tailors layout for either **Household Food Independence** or **Commercial Mini-Market Farm**.

### 4. Agro-Knowledge RAG Co-Pilot (Context-Aware Consultation)
* An intelligent agronomic co-pilot grounded with live agricultural research bulletins from Balai Penelitian Tanaman Sayuran (Balitsa Kementan), BPTP, and precision farming journals.
* Reads your active plot size, planted crops, physical facilities, and microclimate in real time.
* Formats responses as interactive visual strategy cards with 1-click garden execution buttons (e.g., automatically placing companion marigolds to repel thrips).

### 5. "Paste-a-Seed" Smart Variety Importer
* Paste any seed product link (Cap Panah Merah, Known-You Seed, Tunas Agro) or product description.
* Parses agronomic specifications (harvest days HST, ideal spacing cm, yield kg/m², sunlight requirements, companion matrices) directly into validated garden bed models.

### 6. Live Commodity Price Intelligence & Dynamic Harvest ROI
* Real-time commodity price tracking for horticultural produce (chili, tomatoes, lettuce, pak choi, celery) sourced from national food price indices (Bapanas / PIHPS).
* Calculates baseline vs live revenue valuations in Indonesian Rupiah (IDR), delta percentage variances, and price volatility alerts.

### 7. Edge Computer Vision Crop Scouting (Roboflow Integration)
* Direct field companion tool: Take a photo of a struggling leaf with your phone.
* Runs inference across multi-class agriculture models:
  * **Chili Pests**: Thrips, Armyworm Caterpillars (*Spodoptera*), Aphids, Whiteflies (*Bemisia tabaci*).
  * **Plant Pathology (PlantDoc)**: Early Blight (*Alternaria*), Late Blight (*Phytophthora*), Powdery Mildew, Bacterial Spot.
* **Spatial Digital Twin Feedback**: Detects an issue -> flags the corresponding bed on your 2D/3D map with a warning badge -> provides organic IPM remedies -> **automatically suggests switching sprinkler to precision drip irrigation** to prevent water splashing that spreads fungal spores.

### 8. Microclimate & GPS Pinpoint Telemetry (Open-Meteo)
* 1-Click GPS pinpoint sensor detection or direct district search (*Cianjur, Lembang, Batu, Bogor, Sleman*).
* Fetches real-time microclimate metrics: Temperature, Relative Humidity, Precipitation sum ($mm$), and **FAO-56 Penman-Monteith Evapotranspiration ($ET_0$)**.
* **Smart Rain Delay**: Automatically halts irrigation schedules when rain probability $>70\%$ or precipitation exceeds $4mm$, saving water and preventing root rot.

---

## Technical Architecture & Stack

```
+------------------------------------------------------------------------+
|                        AgriSensa Garden Studio                         |
+------------------------------------------------------------------------+
|  Frontend: Next.js 16 (Turbopack) • React 19 • Tailwind CSS v4         |
|  3D Visuals: Three.js • @react-three/fiber • @react-three/drei        |
|  State Management: Zustand (with multi-level Undo/Redo history)        |
+------------------------------------------------------------------------+
|                         Server Route Handlers                          |
|  • /api/ai/plan           -> Secure Gemini 3.8 Flash Spatial Cascade   |
|  • /api/ai/copilot        -> Agro-Knowledge RAG with Web Research      |
|  • /api/seed/import       -> Variety Extraction Engine                 |
|  • /api/market-prices     -> Live Bapanas Price Telemetry & ROI Cache  |
|  • /api/vision/diagnose   -> Roboflow Inference & Agronomy Rule Engine |
|  • /api/weather           -> Open-Meteo Microclimate Telemetry Cache   |
+------------------------------------------------------------------------+
|                      Provider Abstraction Layer                        |
|  • SearchProvider         -> Multi-Search (Tavily, Exa, Native)        |
|  • ScraperProvider        -> Multi-Scraper (Tavily, Exa, BrightData)   |
|  • Zero UI Exposure       -> Server-side fallback with zero UI leak    |
+------------------------------------------------------------------------+
|                 Enterprise Security & Validation                       |
|  • Zod JSON Schema Sanitation (zero unvalidated deserialization)       |
|  • Strict Content Security & HTTP Headers (nosniff, DENY frame)        |
|  • Semgrep Static Security Audit: 125 Rules across 30 files -> 0 Flaws |
|  • Cloud Infrastructure: Deployed via Railway CI/CD Container Engine   |
+------------------------------------------------------------------------+
```

---

## Step-by-Step "Touch Grass" User Journey

1. **Step 1: Grab a Tape Measure**: Measure your physical yard. Input width & depth (e.g., $6m \times 8m$).
2. **Step 2: Place Your Backyard Dreams**: Add 3 raised beds for tomatoes and chilies, a compost bin, a water tap, and an IoT probe.
3. **Step 3: Let AI Auto-Arrange**: Hit **AI Planner**. Gemini re-orders your components so plants receive morning sun while keeping paths clear.
4. **Step 4: Check Weather & Rain Delay**: Hit **GPS** in the weather widget. Live microclimate telemetry calculates daily crop evapotranspiration ($ET_0$).
5. **Step 5: Step Outside & Plant**: Follow the generated outdoor checklist—stake boundaries with string, dig soil, plant seedlings.
6. **Step 6: Scout with Computer Vision**: If a chili leaf curls, snap a photo. Roboflow pinpoints Thrips or Early Blight, and updates your digital twin bed with organic treatment advice.
7. **Step 7: Harvest & Track Real Revenue**: Monitor live market price benchmarks and realize the economic value of growing your own food.

---

## Enterprise Security & Code Quality

Before publishing to production, we subjected our codebase to rigorous static analysis:
* **Semgrep SAST Security Scan**: Ran 125 community & OWASP rules (`p/security-audit`, `p/owasp-top-ten`, `p/react`, `p/secrets`) across all repository files -> **0 findings / Clean**.
* **Zero Client-Side Secret Leakage**: All AI tokens, search keys, and scraper credentials are strictly scoped to backend Route Handlers with rate limits and payload size guards.
* **Provider Abstraction Layer**: Resilient multi-provider failover backend ensuring high availability with zero provider branding leaks in the UI.
* **Zero Emojis**: The user interface is strictly styled using curated SVG iconography (`lucide-react`) and high-contrast dark-mode glassmorphism.

---

## How to Run Locally

```bash
# 1. Clone repository
git clone https://github.com/yandri918/agrisensa_garden_studio.git
cd agrisensa_garden_studio

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional for local Gemini)
cp .env.example .env.local

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Try the Live Demo

Experience the live digital twin right now:
[https://agrisensa-garden-studio-production.up.railway.app](https://agrisensa-garden-studio-production.up.railway.app)

*Design your space. Step outside. Touch grass. Grow food.*
