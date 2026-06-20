# Portfolio Site — Build Plan

## Stack
Vanilla JS + CSS, Vite (bundler/dev server only), `marked` for Markdown, `leaflet` for geo maps. No framework.

## Data model (`data.json`)
- `meta`: title, author, bio (Markdown, rendered on About page), contact links
- `scrapbook.photos[]`: photos for the canvas home page
- `projects[]`: id, title, year, location, story (Markdown), photos[]
- `photo`: id, src, alt, `flip` (optional: markdown, background, textColor), `geo` (optional: lat, lng, zoom)

All photos (scrapbook and project) share the same schema. Flip is only active on scrapbook canvas cards — project strip photos are purely visual.

## File structure
```
index.html          — app shell
src/
  main.js           — routing (#scrapbook, #project/:id, #about), sidebar, mobile drawer
  canvas.js         — scrapbook pan/zoom canvas, viewport-driven scatter layout, flip cards
  strip.js          — horizontal photo strip for project pages, resize logic
  geo.js            — lazy Leaflet map on flip back (OSM tiles + sepia filter)
  style.css         — all styles, single --page-bg token, mobile breakpoint at 768px
data.json           — sample content (scrapbook + 3 projects, placeholder images)
schema.json         — JSON Schema for data.json
```

## Routing
Hash-based: `#scrapbook` (default), `#project/<id>`, `#about`.

## Scrapbook canvas (`src/canvas.js`)
- Pan: mouse drag + single-finger touch
- Zoom: wheel + two-finger pinch
- Layout: viewport-driven grid-jitter scatter — canvas sized to container at load time, cols calculated from aspect ratio, photos fill cells with ±5° random rotation
- Re-scatters on window resize (200ms debounce) and when navigating to scrapbook from same hash
- Cards expand to min 200×200px when flipped so text/map is always readable
- Font size scales with card width via `cqw` container query units (`container-type: size`)

## Photo strip (`src/strip.js`)
- Horizontally scrollable flex row, scrollbar hidden
- Photos sized to fit visible height exactly, constrained by both width and height (correct aspect ratio after load via double-rAF)
- ResizeObserver re-sizes all cards on viewport change
- No flip interaction — project photos are purely visual

## Story panel
- Bottom 1/3 of project view (flex: 1 vs strip flex: 2)
- Per-project Markdown text, vertical scroll, scrollbar hidden
- Hidden entirely if `project.story` is absent

## Geo maps (`src/geo.js`)
- Lazy-initialised Leaflet map on first flip of a card with `geo` field
- OSM tiles with CSS filter: `sepia(0.7) contrast(0.85) brightness(1.05) saturate(0.8)` for rustic look
- Leaflet default icon paths fixed for Vite bundling

## Sidebar
- Desktop: fixed 220px left column
- Mobile (≤768px): `position: fixed`, slides in with `.open` class
- Structure: site title → Scrapbook link → "Projects" label + project list → About link
- Hamburger `#menu-btn` top-left of main; hidden when sidebar open via sibling selector
- Close `#close-btn` inside sidebar header, mobile only

## Visual design
- Font: Playfair Display (Google Fonts) for all serif text
- Background: single `--page-bg: #f0ece4` across all views
- Scrapbook cards: white border (`border: 5px solid #fff`), drop shadow, rotation via `--rot` CSS var
- Sidebar: dark (`#1a1a1a`), accent colour `#c8b89a`

## Completed
- [x] JSON schema
- [x] Vite scaffold, routing, sidebar, mobile drawer
- [x] Horizontal photo strip with correct sizing
- [x] Scrapbook canvas with pan/zoom/pinch and viewport-filling scatter
- [x] Card flip (scrapbook only) with Leaflet geo maps
- [x] Unified background colour, Playfair Display font
- [x] Hidden scrollbars on strip and story panel

## Remaining

### Content & production
- Replace picsum placeholder images with real photos
- Write real project stories and scrapbook captions
- Add geo tags to real photos
- Favicon, meta tags (og:image, description)
- `vite build` output check
- Test on real iOS/Android devices

### Polish
- About page typography and contact link rendering
- Project transition animations (fade when switching projects)
- Keyboard navigation (arrow keys to scroll strip, escape to unflip canvas cards)
- Consider alternative project page layout (editorial vertical scroll)
