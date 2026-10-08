# AgriSensa Garden Studio

> **Spatial 2D/3D Precision Garden Planner with Gemini AI & Agronomic Geometry Engine**  
> Built for *Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass*.  
> **Tagline:** Design your garden. Step outside. Grow together.

---

## 🌿 Overview

**AgriSensa Garden Studio** is an open-source spatial garden planning application that transforms small household yards and homestead plots into measurable, buildable, and productive food gardens.

It bridges the gap between digital design and real-world execution:
1. **Interactive 2D Blueprint**: Millimeter/centimeter-accurate spatial layout editor with grid snap, obstacle placement, and zone management.
2. **Interactive 3D Scene**: Real-time 3D visualization powered by Three.js and `@react-three/fiber` with orbital, top-down, and human eye-level camera presets.
3. **Deterministic Geometry Validation Engine**: Real-time detection of object boundary violations, spatial overlaps/collisions, and accessibility pathways from the garden entrance.
4. **Agronomic & ROI Engine**: Real-time calculation of planting spots, water requirements ($L/\text{day}$), monthly vegetable yield ($kg/\text{month}$), and economic valuation (IDR).
5. **Gemini AI Agronomic Co-Pilot**: AI-assisted layout generation and 4-week step-by-step outdoor gardening action plans tailored to household self-sufficiency or market commercial goals.
6. **Zero-Emoji Clean UI**: Strictly uses professional Lucide SVG iconography and dark-mode aesthetics.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **State Management**: Zustand
- **AI Integration**: `@google/genai` (Google Gemini 2.5 Flash)
- **Validation**: Zod & custom spatial BFS graph traversal
- **Styling**: Vanilla CSS Design Tokens (Custom glassmorphism & dark palette)
- **Icons**: Lucide React

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/yandri918/agrisensa_garden_studio.git
cd agrisensa_garden_studio
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure your Google Gemini API Key:

```bash
cp .env.example .env.local
```

Inside `.env.local`:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Get your free API key at [Google AI Studio](https://aistudio.google.com/))*

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📐 Key Capabilities

| Module | Features |
|---|---|
| **2D Blueprint Editor** | Pan, zoom, fit-to-screen, drag & drop snap (0.25m), 90° rotation, entrance & water source orientation |
| **3D Three.js Studio** | Procedural raised beds with foliage, NFT hydroponic racks, stone fish ponds, gravel paths, multi-angle camera |
| **Geometry Engine** | Boundary clipping, overlap detection, BFS access graph from entrance to all key beds |
| **Agronomic Catalog** | Pakcoy, Kangkung, Selada, Bayam, Cabai Rawit, Tomat Cherry, Timun, Terong, Kale |
| **Facility Catalog** | Raised beds, NFT A-frames, tilapia ponds, poultry coops, composters, paths, water taps |
| **AI Co-Pilot** | Gemini 2.5 Flash spatial layout suggestions + offline deterministic spatial fallback |
| **Touch Grass Plan** | Weekly outdoor checklist for land measurement, staking, soil prep, and planting |

---

## 📄 License

MIT License. Open-source contribution for Hacktoberfest 2026.
