# Portfolio Site — Build Plan

## Stack
Vanilla JS + CSS, Vite (bundler/dev server only), `marked` for Markdown rendering. No framework.

## Data model
- `data.json` — source of truth, validated against `schema.json`
- `meta`: site title, author, bio (rendered on About page), contact links
- `projects[]`: id (slug), title, description, year, location, canvas settings, photos[]
- `photo`: id, src, alt, aspectRatio, flip.markdown (free-form Markdown)
- `canvas.layout`: algorithm (scatter/grid/spiral/clusters), seed, padding, sizeVariance, rotationRange

## File structure
```
index.html          — app shell, sidebar, canvas-view, about-view
src/
  main.js           — data load, routing (#project/:id, #about), sidebar render, mobile drawer
  canvas.js         — pan/zoom engine, pinch-zoom, card creation, flip interaction
  layout.js         — layout algorithms (scatter, grid, spiral, clusters), seeded PRNG
  style.css         — all styles, mobile breakpoint at 768px
data.json           — sample content (3 projects, placeholder images)
schema.json         — JSON Schema for data.json
```

## Routing
Hash-based: `#project/<id>` loads a project, `#about` shows the About page. Default route loads first project.

## Canvas engine (src/canvas.js)
- Pan: pointerdown/move/up with pointer capture
- Zoom: wheel event (cursor-centered) + two-finger pinch via pointer events
- `loadProject(project)`: clears world, runs layout, centers viewport on content centroid
- Initial zoom: 0.75 desktop, 0.55 mobile (based on `view.clientWidth < 600`)
- `hasPanned` flag prevents accidental card flips after a drag

## Layout engine (src/layout.js)
- `computeLayout(photos, settings, viewWidth)` — returns array of `{photo, x, y, width, height, rotation}`
- BASE_WIDTH = 28% of viewWidth, clamped 180–340px (responsive to viewport)
- All algorithms use seeded PRNG (mulberry32) for deterministic layouts
- `normalizePositions` shifts output so bounding box starts at (2×padding, 2×padding)

## Mobile sidebar (≤768px)
- Sidebar: `position: fixed`, hidden via `translateX(-100%)`, slides in with `.open` class
- Hamburger `#menu-btn`: absolute, top-left of `#main`; hidden when sidebar is open (`#sidebar.open ~ #main > #menu-btn { display: none }`)
- Close `#close-btn`: inside sidebar header, right-aligned, only visible on mobile
- Backdrop `#sidebar-backdrop`: dimmed overlay, click to close
- Selecting a project or About closes the drawer

## Completed stages
- [x] Stage 1: JSON schema
- [x] Stage 2: Vite scaffold, sidebar, hash routing
- [x] Stage 3: Canvas pan/zoom/pinch, layout algorithms, photo cards
- [x] Stage 4: Responsive layout (viewport-relative photo sizing)
- [x] Stage 5: Mobile sidebar (drawer, hamburger, backdrop)

## Remaining stages

### Stage 6: Card flip interaction
- Cards flip on click (already wired, needs visual testing)
- CSS: `transform-style: preserve-3d`, front/back with `backface-visibility: hidden`
- `--card-transform` CSS custom property preserves rotation on flipped state
- Need to verify flip works correctly and back content (Markdown) renders well

### Stage 7: About page
- `#about-view` toggles visible via routing
- `data.meta.bio` rendered as Markdown into `#about-content`
- Needs visual polish: typography, contact links rendering

### Stage 8: Project transitions
- Animate canvas out/in when switching projects (fade or slide)
- Consider animating individual cards in on load (staggered entrance)

### Stage 9: Polish & production
- Add `public/images/` and replace picsum placeholders with real photos
- Favicon, meta tags (og:image, description)
- `vite build` output check
- Test on real iOS/Android devices
- Keyboard navigation (arrow keys to pan, escape to unflip)
