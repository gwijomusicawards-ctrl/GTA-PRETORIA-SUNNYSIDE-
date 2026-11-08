# Pretoria Sunnyside — playable 3D browser game

A small, original open-world 3D game prototype inspired by Sunnyside, Pretoria. It is not GTA San Andreas and does not use GTA characters, logos, maps, or assets.

## Play locally
1. Install Python 3.
2. Open a terminal in this folder.
3. Run `python -m http.server 8000`.
4. Open `http://localhost:8000` in Chrome.

Do not open `index.html` directly as a file: browser module imports need a local web server.

## Controls
- W A S D: walk / drive
- Shift: sprint
- Mouse drag: rotate camera
- E: interact with a nearby shop/place
- F: enter or leave the starter car
- Space: handbrake while driving
- Mobile: on-screen movement and action buttons

## Map
The game attempts to load roads, building footprints and nearby points of interest from OpenStreetMap Overpass for a Sunnyside-area bounding box. If the public map service is unavailable, it automatically uses a generated neighbourhood grid. OpenStreetMap data is © OpenStreetMap contributors, licensed under ODbL. The prototype uses approximate 3D building blocks, not photogrammetry or surveyed building heights.

## Deploy to Render
1. Create a GitHub repository and upload all files in this folder.
2. In Render, choose **New + → Static Site** and connect the repository.
3. Set **Build Command** to blank (or `echo "Static game"`).
4. Set **Publish Directory** to `.`.
5. Deploy. Render will provide a public URL.

The included `render.yaml` can also be used as a Blueprint.

## Current prototype features
- Third-person 3D player movement and follow camera
- Drivable starter car
- Sunnyside-inspired fallback neighbourhood
- Optional OpenStreetMap roads, buildings and shop/place discovery markers
- Basic discovery rewards, cash, health, stamina and wanted-level HUD
- Keyboard and touch controls
- Original SVG game logo

## Important next development stages
A production-scale game still needs original character animation, detailed 3D assets, traffic and pedestrian AI, mission scripting, audio, save games, server-side systems, collision/physics, optimization, and a tested mobile UI. This project is a playable foundation, not a finished commercial AAA title.
