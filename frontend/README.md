# AutoAlign-C2 Frontend

Next.js aerospace terminal web application for the Chandrayaan-2 Multi-Modal Lunar Image Registration System.

## Architecture & Features

- **Interactive 3D Mission Cover Page (`/`):** Auto-rotating 3D Chandrayaan-2 spacecraft model (`chandrayaan2.glb`) with pointer-delta drag tracking and smooth transition animations into `/dashboard`.
- **Aerospace Terminal Dashboard (`/dashboard`):** Production-grade flight interface built with clean geometric typography (`Inter`), telemetry displays (`JetBrains Mono`), and minimal matte glassmorphism.
- **Interactive Multi-Modal Visualizers:**
  - *Multi-Modal Swipe Comparison:* Real-time split view with clamped grab handle comparing high-res OHRC optical base against IIRS hyperspectral false-color overlay.
  - *LoFTR Dense Matching:* Multi-color correspondence vector network highlighting spectral tie-points, edge gradient locks, and topographic invariant landmarks.
  - *Checkerboard Tile Verification:* High-contrast alternating grid (24px, 32px, 48px, 64px) evaluating boundary convergence.
- **Milestone Progress Tracking:** 4-stage pipeline execution simulation with marginal overlap failure safety trip demonstration.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

```bash
npm run build
npm start
```
