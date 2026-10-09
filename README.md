# The Orbit Travel Intelligence 🪐

An autonomous travel intelligence and anti-fatigue decision agent developed with React, TypeScript, Vite, Tailwind CSS, and Google Gemini.

Designed to eliminate decision fatigue with real-time departure corridors, crowd-filtered pacing, verified acoustic sanctuary lodging, live meteorological telemetry, and instant constraint memory loops.

---

## 🚀 Key Features & Bug Fixes

- **Global & Regional Place Autocomplete**:
  - Live dynamic geocoding integration (Open-Meteo) covering all cities, districts, hill stations, and landmarks across India and globally.
  - Built-in instant presets for 160+ top travel destinations and origin hubs.
  - Live search badges with elevation and region indicators.

- **Vercel Fullstack Deployment Ready**:
  - Native Vercel Serverless API handlers (`api/plan.ts`, `api/weather.ts`, `api/chat.ts`, `api/grounded-search.ts`, `api/simulate-purchase.ts`, `api/health.ts`).
  - `vercel.json` routing configured for SPA and serverless API execution.
  - Built-in client-side autonomous engine (`src/utils/planGenerator.ts`) that guarantees seamless generation even in static offline mode without backend cold starts.

- **Responsive Interactive Tabs & Corridors**:
  - Curated high-fatigue corridor tabs immediately switch routes and trigger plan updates upon selection.
  - Duration tabs (1 Day, 2 Days, 3 Days, 4+ Days, All Days) adjust the schedule and adapt itineraries dynamically.
  - Itinerary day filter tabs (All Days, Day 1, Day 2, etc.) stay synchronized without empty state glitches.
  - Weather forecast tabs (Travel Dates Forecast, Transit Timeline, Ghats Road & Packing Intel) load real multi-day forecasts for any chosen destination.

- **Multi-Turn Copilot & Grounding**:
  - Contextual AI Copilot for route advice, packing tips, and local food recommendations.
  - Google Search Grounding drawer for live road bottlenecks and dining intelligence.
  - Bespoke Editorial Dossier PDF export with high-DPI canvas generation.

---

## 🛠️ Deploying to Vercel

1. Commit and push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Fix Vercel deployment, autocomplete search, and tab functionality"
   git push origin main
   ```

2. Open [Vercel](https://vercel.com/) and click **Add New Project** ➔ **Import Git Repository**.

3. In the project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` (or `bun install`)

4. *(Optional for live Gemini AI generation)*:
   - Under **Environment Variables**, add:
     - `GEMINI_API_KEY`: Your Google AI Studio Gemini API Key.
   *(Note: The app also includes an autonomous fallback engine that works out of the box even without an API key).*

5. Click **Deploy**. Your app will be live with full functionality!

---

## 💻 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/aneeshtele-Eric/Vibe-Coding.git
   cd Vibe-Coding
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional):
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY in .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.
