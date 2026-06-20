// Seeded PRNG (mulberry32) so layouts are deterministic per seed
function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Base photo width is ~30% of the canvas viewport width, clamped to a sane range
function baseWidth(viewWidth) {
  return Math.round(Math.min(Math.max(viewWidth * 0.28, 180), 340));
}

function photoWidth(base, rand, sizeVariance) {
  const factor = 1 - sizeVariance / 2 + rand() * sizeVariance;
  return Math.round(base * factor);
}

function photoHeight(width, aspectRatio) {
  return Math.round(width / (aspectRatio || 1.5));
}

export function computeLayout(photos, settings = {}, viewWidth = 900) {
  const {
    algorithm = 'scatter',
    seed = 42,
    padding = 40,
    sizeVariance = 0.3,
    rotationRange = 6,
  } = settings;

  const rand = prng(seed);
  const base = baseWidth(viewWidth);

  switch (algorithm) {
    case 'grid':     return layoutGrid(photos, rand, base, padding, rotationRange);
    case 'spiral':   return layoutSpiral(photos, rand, base, padding, sizeVariance, rotationRange);
    case 'clusters': return layoutClusters(photos, rand, base, padding, sizeVariance, rotationRange);
    default:         return layoutScatter(photos, rand, base, padding, sizeVariance, rotationRange);
  }
}

function layoutScatter(photos, rand, base, padding, sizeVariance, rotationRange) {
  const placed = [];
  const results = [];

  for (const photo of photos) {
    const w = photoWidth(base, rand, sizeVariance);
    const h = photoHeight(w, photo.aspectRatio);
    const rotation = (rand() - 0.5) * 2 * rotationRange;

    let x, y, attempts = 0;
    do {
      // Spread grows with sqrt(n) so density stays consistent regardless of count
      const spread = (base + padding) * Math.sqrt(Math.max(placed.length, 1)) * 1.5;
      x = (rand() - 0.5) * spread * 2;
      y = (rand() - 0.5) * spread * 1.6;
      attempts++;
    } while (attempts < 40 && overlapsAny(placed, x, y, w, h, padding));

    placed.push({ x, y, w, h });
    results.push({ photo, x, y, width: w, height: h, rotation });
  }

  return normalizePositions(results, padding);
}

function layoutGrid(photos, rand, base, padding, rotationRange) {
  const cols = Math.ceil(Math.sqrt(photos.length));
  const results = [];

  photos.forEach((photo, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const w = base;
    const h = photoHeight(w, photo.aspectRatio);
    const rotation = (rand() - 0.5) * 2 * Math.min(rotationRange, 2);
    const x = col * (w + padding);
    const y = row * (h + padding);
    results.push({ photo, x, y, width: w, height: h, rotation });
  });

  return normalizePositions(results, padding);
}

function layoutSpiral(photos, rand, base, padding, sizeVariance, rotationRange) {
  const results = [];
  const spacing = base + padding;

  photos.forEach((photo, i) => {
    const angle = i * 2.4; // golden angle in radians
    const radius = spacing * 0.6 * Math.sqrt(i);
    const w = photoWidth(base, rand, sizeVariance * 0.5);
    const h = photoHeight(w, photo.aspectRatio);
    const rotation = (rand() - 0.5) * 2 * rotationRange;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.75;
    results.push({ photo, x, y, width: w, height: h, rotation });
  });

  return normalizePositions(results, padding);
}

function layoutClusters(photos, rand, base, padding, sizeVariance, rotationRange) {
  const clusterCount = Math.max(2, Math.ceil(photos.length / 4));
  const clusterRadius = base * 2.5;
  const clusterCenters = Array.from({ length: clusterCount }, (_, i) => {
    const angle = (i / clusterCount) * Math.PI * 2;
    const r = clusterRadius + rand() * base;
    return { cx: Math.cos(angle) * r, cy: Math.sin(angle) * r * 0.75 };
  });

  const results = [];
  const placed = [];

  photos.forEach((photo, i) => {
    const { cx, cy } = clusterCenters[i % clusterCount];
    const w = photoWidth(base, rand, sizeVariance);
    const h = photoHeight(w, photo.aspectRatio);
    const rotation = (rand() - 0.5) * 2 * rotationRange;

    let x, y, attempts = 0;
    do {
      x = cx + (rand() - 0.5) * base * 2.2;
      y = cy + (rand() - 0.5) * base * 1.7;
      attempts++;
    } while (attempts < 20 && overlapsAny(placed, x, y, w, h, padding));

    placed.push({ x, y, w, h });
    results.push({ photo, x, y, width: w, height: h, rotation });
  });

  return normalizePositions(results, padding);
}

function overlapsAny(placed, x, y, w, h, padding) {
  for (const p of placed) {
    if (
      x < p.x + p.w + padding &&
      x + w + padding > p.x &&
      y < p.y + p.h + padding &&
      y + h + padding > p.y
    ) return true;
  }
  return false;
}

function normalizePositions(results, padding) {
  const minX = Math.min(...results.map(r => r.x));
  const minY = Math.min(...results.map(r => r.y));
  const offset = padding * 2;
  return results.map(r => ({ ...r, x: r.x - minX + offset, y: r.y - minY + offset }));
}
