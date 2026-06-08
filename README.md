# RSM Insights — Concept Enterprise Insights Platform

A **concept** front-end for a futuristic enterprise insights platform built around
RSM's three core services — **Audit**, **Tax**, and **Consulting**. Financial data
is rendered as living, navigable 3D worlds: a verification mesh for Audit, a scenario
wave-field for Tax, and an enterprise digital twin for Consulting.

> ⚠️ **Disclaimer** — This is an independent concept / portfolio demonstration. It is
> **not affiliated with, authorized by, or endorsed by RSM US LLP or RSM International.**
> All trademarks belong to their respective owners.

## Live demo

GitHub Pages → `https://nightschuy.github.io/rsm-insights/`

## Experience

- **Immersive 3D visualizations** — realtime WebGL scenes, one per practice area, that
  cross-fade and re-light as you scroll.
- **Cinematic scroll storytelling** — GSAP + ScrollTrigger drive section reveals, camera
  parallax, layered glass-panel motion, and staggered typography.
- **Ultra-smooth scrolling** — Lenis for premium, weighted scroll feel.
- **Floating OS aesthetic** — glassmorphism panels, a live HUD, and a floating grid system.
- **Particle systems & glowing wireframes** — abstract motion background keeps the data alive.

## Tech

| Layer | Library |
|-------|---------|
| 3D / WebGL | [Three.js](https://threejs.org/) `0.160` (ES modules via import map) |
| Animation | [GSAP](https://gsap.com/) + ScrollTrigger + ScrollToPlugin |
| Smooth scroll | [Lenis](https://github.com/darkroomengineering/lenis) |
| Type | Sora + JetBrains Mono (Google Fonts) |

No build step — everything loads from CDNs. Open `index.html` or serve the folder.

## Run locally

```bash
# any static server works
python3 -m http.server 8000
# → http://localhost:8000
```

## Structure

```
index.html      markup + section content
css/style.css   glassmorphism UI, typography, layout
js/main.js      Three.js scenes, GSAP choreography, Lenis
assets/         (reserved for GLTF / Blender-exported digital-twin assets)
```

### Swapping in GLTF assets

The Three.js scene builds its geometry procedurally so the demo is dependency-free.
To drop in Blender/Spline-exported `.gltf`/`.glb` digital twins, load them with
`GLTFLoader` (`three/addons/loaders/GLTFLoader.js`) inside `StageFX` and add the
resulting model to the relevant section group (`groups.consulting`, etc.).

## Accessibility & performance

- Honors `prefers-reduced-motion` (disables scroll-jacking, particle motion, and reveals).
- Caps device pixel ratio at 2 and uses additive points / wireframes to stay light.
- Falls back gracefully if WebGL is unavailable (HUD reports `2D FALLBACK`).

---

Concept by [@nightschuy](https://github.com/nightschuy).
