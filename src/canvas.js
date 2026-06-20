import { marked } from 'marked';
import { attachGeoMap } from './geo.js';

const container = document.getElementById('canvas-container');
const inner = document.getElementById('canvas-inner');

let tx = 0, ty = 0, scale = 1;
let canvasW = 0, canvasH = 0; // set dynamically on each load

let dragging = false;
let dragStartX = 0, dragStartY = 0;
let dragStartTx = 0, dragStartTy = 0;

function applyTransform() {
  inner.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

function clampTranslation() {
  const vw = container.clientWidth;
  const vh = container.clientHeight;
  const cw = canvasW * scale;
  const ch = canvasH * scale;
  const pad = 80;
  tx = Math.min(tx, vw - pad);
  tx = Math.max(tx, -(cw - pad));
  ty = Math.min(ty, vh - pad);
  ty = Math.max(ty, -(ch - pad));
}

export function initCanvas() {
  // Pan — mouse
  container.addEventListener('mousedown', (e) => {
    if (e.target.closest('.canvas-card')) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartTx = tx;
    dragStartTy = ty;
    container.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    tx = dragStartTx + (e.clientX - dragStartX);
    ty = dragStartTy + (e.clientY - dragStartY);
    clampTranslation();
    applyTransform();
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    container.style.cursor = '';
  });

  // Pan — touch
  let lastTouchX = 0, lastTouchY = 0;
  let touchDist = 0;
  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      touchDist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
    }
  }, { passive: true });
  container.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouchX;
      const dy = e.touches[0].clientY - lastTouchY;
      tx += dx; ty += dy;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      clampTranslation();
      applyTransform();
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      zoomAt(
        (e.touches[0].clientX + e.touches[1].clientX) / 2,
        (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist / touchDist
      );
      touchDist = dist;
    }
  }, { passive: false });

  // Zoom — wheel
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 0.92 : 1.08);
  }, { passive: false });
}

function zoomAt(cx, cy, factor) {
  const newScale = Math.min(3, Math.max(0.3, scale * factor));
  const ratio = newScale / scale;
  tx = cx - ratio * (cx - tx);
  ty = cy - ratio * (cy - ty);
  scale = newScale;
  clampTranslation();
  applyTransform();
}

export function loadScrapbook(scrapbook) {
  inner.innerHTML = '';

  // Canvas matches the viewport exactly — photos fill it at scale 1
  canvasW = container.clientWidth;
  canvasH = container.clientHeight;
  inner.style.width = `${canvasW}px`;
  inner.style.height = `${canvasH}px`;

  scale = 1; tx = 0; ty = 0;
  applyTransform();

  for (const { photo, x, y, w, h, rot } of scatter(scrapbook.photos, canvasW, canvasH)) {
    inner.appendChild(createCard(photo, x, y, w, h, rot));
  }
}

function scatter(photos, vw, vh) {
  const n = photos.length;
  // Choose cols so cells are as square as possible
  const cols = Math.round(Math.sqrt(n * (vw / vh)));
  const rows = Math.ceil(n / cols);
  const cellW = vw / cols;
  const cellH = vh / rows;

  const margin = 10; // px gap between cells before jitter
  const photoW = cellW - margin * 2;
  const photoH = cellH - margin * 2;

  const shuffled = [...photos].sort(() => Math.random() - 0.5);

  return shuffled.map((photo, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Slight jitter so photos don't sit in a rigid grid
    const jx = (Math.random() - 0.5) * margin * 1.5;
    const jy = (Math.random() - 0.5) * margin * 1.5;

    const x = col * cellW + margin + jx;
    const y = row * cellH + margin + jy;
    const rot = (Math.random() - 0.5) * 10; // ±5°

    return { photo, x, y, w: photoW, h: photoH, rot };
  });
}

function createCard(photo, x, y, w, h, rot) {
  const card = document.createElement('div');
  card.className = 'canvas-card';
  card.style.left = `${x}px`;
  card.style.top = `${y}px`;
  card.style.width = `${w}px`;
  card.style.height = `${h}px`;
  card.style.setProperty('--rot', `${rot}deg`);

  const front = document.createElement('div');
  front.className = 'canvas-card__front';
  const img = document.createElement('img');
  img.src = photo.src;
  img.alt = photo.alt || '';
  img.draggable = false;
  front.appendChild(img);

  const back = document.createElement('div');
  back.className = 'canvas-card__back';
  let onFlip = null;
  if (photo.flip) {
    back.style.background = photo.flip.background || '#1c1c1c';
    back.style.color = photo.flip.textColor || '#f0ece4';
    back.innerHTML = marked.parse(photo.flip.markdown || '');
  }
  if (photo.geo) {
    onFlip = attachGeoMap(back, photo.geo);
  }

  card.appendChild(front);
  card.appendChild(back);

  // Correct aspect ratio once the image loads, constrained to cell dimensions
  img.addEventListener('load', () => {
    const aspect = img.naturalWidth / img.naturalHeight;
    let fw = w, fh = h;
    if (aspect > w / h) {
      fh = Math.round(fw / aspect);
    } else {
      fw = Math.round(fh * aspect);
    }
    card.style.width = `${fw}px`;
    card.style.height = `${fh}px`;
  });

  let pointerMoved = false;
  card.addEventListener('pointerdown', (e) => {
    pointerMoved = false;
    e.stopPropagation();
  });
  card.addEventListener('pointermove', () => { pointerMoved = true; });
  card.addEventListener('pointerup', (e) => {
    e.stopPropagation();
    if (!pointerMoved && photo.flip) {
      card.classList.toggle('flipped');
      if (card.classList.contains('flipped') && onFlip) onFlip();
    }
  });

  return card;
}
