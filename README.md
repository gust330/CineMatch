# CineMatch 🎬🍿

> **Intelligent, AI-powered movie and series discovery web app that curates personalized recommendations based on your cross-platform taste, ratings, and mood.**

[![React](https://img.shields.io/badge/React-18%20%7C%20TypeScript-61DAFB.svg?logo=react&logoColor=black)](#tech-stack)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?logo=vite&logoColor=white)](#tech-stack)
[![AI Recommendation](https://img.shields.io/badge/AI-Google%20Gemini%20%7C%20OpenRouter-orange.svg)](#ai-recommendation-engine)
[![Metadata](https://img.shields.io/badge/Metadata-OMDb%20API-yellow.svg)](#tech-stack)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E.svg?logo=supabase&logoColor=white)](#tech-stack)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## Overview

Streaming platform algorithms are siloed within their own walled gardens (Netflix only recommends Netflix; Prime only recommends Prime), ignoring your cross-platform taste and nuanced preferences.

**CineMatch** acts as an intelligent personal cinematic journal. It tracks what you've watched, learns continuously from your explicit ratings and notes, and queries multimodal AI models (Google Gemini & OpenRouter free-tier LLMs) to generate deeply tailored film and television recommendations.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CINEMATCH ARCHITECTURE                          │
├────────────────────────────────┬───────────────────────────────────────┤
│  [⭐] Personal Cinema Journal  │  [🤖] AI Recommendation Engine        │
│  · Explicit 1–10 star ratings  · Google Gemini 1.5 & OpenRouter LLMs   │
│  · Notes & emotional tags      │  · Structured JSON recommendation spec│
│  · Watchlist & History archive │  · Mood-based & niche trope discovery │
├────────────────────────────────┴───────────────────────────────────────┤
│                  [⚡] Enrichment & Persistence Flow                    │
│  OMDb Metadata (Posters, Runtime, IMDb) ──▶ Supabase Cloud Storage    │
├────────────────────────────────┬───────────────────────────────────────┤
│  [🎨] Cinema Design System     │  [📱] Responsive Web Experience       │
│  · Custom dark cinematic theme │  · Swipe-friendly recommendation deck │
│  · High-contrast typography    │  · Fast client-side Vite navigation   │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## Key Features

### 1. Intelligent AI Recommendation Pipeline (`src/services/gemini.ts` & `openrouter.ts`)
- **Semantic Taste Modeling**: Feeds your rated history, favorite genres, and disliked tropes into LLM prompts to discover hidden gems rather than generic blockbusters.
- **Explainable Recommendations**: Every suggestion includes a personalized *"Why you'll love it"* explanation linking directly to your past favorites.
- **Zero API Cost**: Optimized to utilize free-tier endpoints (Gemini 1.5 Flash / OpenRouter community models).

### 2. OMDb & TMDB Metadata Enrichment (`src/services/omdb.ts`)
- Automated retrieval of official high-resolution posters, IMDb / Rotten Tomatoes ratings, directors, cast lists, and plot summaries.

### 3. Comprehensive Watch Management
- **Interactive Feed (`src/pages/HomePage.tsx`)**: Discover new titles with instant *"Want to Watch"*, *"Seen It"*, or *"Skip"* actions.
- **Watchlist (`src/pages/WatchlistPage.tsx`)**: Filterable queue organized by genre, runtime, and streaming platform.
- **Viewing History (`src/pages/HistoryPage.tsx`)**: Complete log of watched titles with your personal ratings and review notes.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18, TypeScript (Strict), Vite |
| **Styling & Design System** | Tailwind CSS, Lucide Icons, Custom Cinema Design Tokens (`design-system/cinematch`) |
| **Backend & Sync** | Supabase (PostgreSQL, Auth, Client SDK) |
| **AI Providers** | Google Generative AI (Gemini Flash), OpenRouter API |
| **Movie Metadata** | OMDb API (Open Movie Database) |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ & **npm**
- An **OMDb API Key** ([omdbapi.com](http://www.omdbapi.com/apikey.aspx) — free tier available)
- (Optional) **Google Gemini API Key** ([aistudio.google.com](https://aistudio.google.com/)) or OpenRouter key

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/gust330/CineMatch.git
cd CineMatch

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```bash
VITE_OMDB_API_KEY="your_omdb_key"
VITE_GEMINI_API_KEY="your_gemini_api_key"

# Optional Supabase persistence
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### 3. Launch Development Server

```bash
npm run dev
```

Navigate to **`http://localhost:5173`** in your browser.

---

## Project Structure

```
CineMatch/
├── src/
│   ├── assets/              # Static SVG icons and imagery
│   ├── components/          # Movie cards, rating stars, and modal dialogs
│   ├── hooks/               # Custom hooks (useWatchlist, useRecommendations)
│   ├── layouts/             # Navigation header and footer layout shells
│   ├── pages/
│   │   ├── HomePage.tsx     # Discovery feed and recommendation generator
│   │   ├── WatchlistPage.tsx# Queued movies and series
│   │   ├── HistoryPage.tsx  # Rated titles ledger
│   │   └── ProfilePage.tsx  # User stats and genre distribution
│   ├── services/
│   │   ├── gemini.ts        # Gemini AI recommendation integration
│   │   ├── openrouter.ts    # Fallback AI endpoint integration
│   │   ├── omdb.ts          # OMDb API metadata enricher
│   │   └── supabase.ts      # Cloud database client
│   ├── styles/              # Global styles and Tailwind directives
│   ├── types/               # Movie, Rating, and Recommendation interfaces
│   └── utils/               # Formatting and local storage fallbacks
├── design-system/           # Custom CineMatch design system specifications
├── PRD_CineMatch.md         # Product requirements and roadmap
└── README.md
```

---

## Author & License

Engineered by **Gustavo Teixeira** ([@gust330](https://github.com/gust330)).  
Licensed under the [MIT License](LICENSE).
