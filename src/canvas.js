import { marked } from 'marked';

const container = document.getElementById('canvas-container');
const inner = document.getElementById('canvas-inner');

const PHOTO_MAX = 300;   // max photo dimension in canvas px
const CANVAS_W = 2000;
const CANVAS_H = 1400;

let tx = 0, ty = 0, scale = 1;
let dragging = false;
let dragStartX = 0, dragStartY = 0;
let dragStartTx = 0, dragStartTy = 0;

function fitCanvas() {
  const vw = container.clientWidth;
  const vh = container.clientHeight;
  // Scale so the full canvas fits with padding, then center it
  scale = Math.min(vw / CANVAS_W, vh / CANVAS_H) * 0.9;
  tx = (vw - CANVAS_W * scale) / 2;
  ty = (vh - CANVAS_H * scale) / 2;
}

function applyTransform() {
  inner.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

function clampTranslation() {
  // Allow panning so the canvas never fully leaves the viewport
  const vw = container.clientWidth;
  const vh = container.clientHeight;
  const cw = CANVAS_W * scale;
  const ch = CANVAS_H * scale;
  const pad = 120;
  tx = Math.min(tx, vw - pad);
  tx = Math.max(tx, -(cw - pad));
  ty = Math.min(ty, vh - pad);
  ty = Math.max(ty, -(ch - pad));
}

export function initCanvas() {
  fitCanvas();
  applyTransform();

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
      const delta = dist / touchDist;
      touchDist = dist;
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      zoomAt(cx, cy, delta);
    }
  }, { passive: false });

  // Zoom — wheel
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    zoomAt(e.clientX, e.clientY, delta);
  }, { passive: false });
}

function zoomAt(cx, cy, factor) {
  const newScale = Math.min(2.5, Math.max(0.25, scale * factor));
  const ratio = newScale / scale;
  // Adjust translation so the point under the cursor stays fixed
  tx = cx - ratio * (cx - tx);
  ty = cy - ratio * (cy - ty);
  scale = newScale;
  clampTranslation();
  applyTransform();
}

export function loadScrapbook(scrapbook) {
  inner.innerHTML = '';
  inner.style.width = `${CANVAS_W}px`;
  inner.style.height = `${CANVAS_H}px`;
  fitCanvas();
  applyTransform();

  const placed = scatter(scrapbook.photos);
  for (const { photo, x, y, w, h, rot } of placed) {
    inner.appendChild(createCard(photo, x, y, w, h, rot));
  }
}

function scatter(photos) {
  // Grid-jitter: divide canvas into a grid, place one photo per cell
  const cols = Math.ceil(Math.sqrt(photos.length * (CANVAS_W / CANVAS_H)));
  const rows = Math.ceil(photos.length / cols);
  const cellW = CANVAS_W / cols;
  const cellH = CANVAS_H / rows;

  const result = [];
  const shuffled = [...photos].sort(() => Math.random() - 0.5);

  shuffled.forEach((photo, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Random position within cell, with margin so photos don't clip edges
    const margin = 40;
    const maxW = Math.min(PHOTO_MAX, cellW - margin * 2);
    const maxH = Math.min(PHOTO_MAX, cellH - margin * 2);

    // We don't know aspect ratio yet, so use a fixed size; resize after load
    const w = maxW;
    const h = maxH;

    const cx = col * cellW + margin + Math.random() * (cellW - margin * 2 - w);
    const cy = row * cellH + margin + Math.random() * (cellH - margin * 2 - h);
    const rot = (Math.random() - 0.5) * 14; // ±7 degrees

    result.push({ photo, x: Math.max(0, cx), y: Math.max(0, cy), w, h, rot });
  });

  return result;
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
  if (photo.flip) {
    back.style.background = photo.flip.background || '#1c1c1c';
    back.style.color = photo.flip.textColor || '#f0ece4';
    back.innerHTML = marked.parse(photo.flip.markdown || '');
  }

  card.appendChild(front);
  card.appendChild(back);

  // Resize to correct aspect ratio once image loads
  img.addEventListener('load', () => {
    const aspect = img.naturalWidth / img.naturalHeight;
    let fw = w, fh = h;
    if (aspect > 1) { fh = Math.round(fw / aspect); }
    else { fw = Math.round(fh * aspect); }
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
    if (!pointerMoved && photo.flip) card.classList.toggle('flipped');
  });

  return card;
}
