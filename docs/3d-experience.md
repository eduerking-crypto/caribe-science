# 3D experience

The homepage hero is an immersive but **progressive** experience: WebGL and
WebGL2-capable browsers get the full world, everything else gets a plain
gradient canvas — no broken states, no blocking.

## Globe3D (`src/components/Globe3D.tsx`)

React Three Fiber scene inside a lazy `next/dynamic` component:

- **Ocean sphere** — wireframe icosahedron, opacity ~0.55, with a
  latitude-based color gradient (deep blue at the poles → reef teal at the
  equator) via vertex colors.
- **Graticals** — latitude/longitude arcs as `<line>` primitives at 15°
  intervals, subdued teal (opacity 0.18), gentle slow rotation.
- **Island dots** — glowing points over the Caribbean basin sized by
  relative landmass, positioned with the standard lat/lon → sphere
  projection (`toVec`).
- **Stars** — a sparse particle field far behind the globe.
- **Accessibility**: `prefers-reduced-motion` disables rotation; the globe is
  `aria-hidden` (decorative) and sits behind a `Suspense` fallback so content
  is never blocked.

All geometry is generated client-side — zero model assets, zero network
requests. Mesh counts are tiny (one wireframe icosahedron, ~30 line strips,
~30 dots, one stars buffer) for low-end GPUs.

## MapCaribe (`src/components/MapCaribe.tsx`)

MapLibre GL without any tile server:

- A spec-compliant v8 style with a `background` layer (deep ocean #0B2333)
  and a single GeoJSON `circle` layer of 25 Caribbean points (islands in sun
  yellow ~#FFC93D, mainland coasts in reef teal ~#3CC6C1).
- Radius interpolates with zoom (2.5 → 5 px); white halo stroke for
  legibility on the dark sea.
- Hover reveals a nametag popup; pan/zoom bounded to the basin
  (min 2.2, max 8, center 16.5°N 72°W).
- Footer bar shows the colour legend (Islas / Costas continentales).

Because the map has **no external tiles**, it renders instantly, works
offline and produces nothing but a handful of kilobytes.

## Design language

Both visuals share the platform palette: ocean ink `#0B2333`, reef teal
`#3CC6C1`, sun `#FFC93D`, sand and coral accents — consistent with the CSS
`@theme` tokens (`ocean/reef/sun/coral/sand/ink`) used across the site.