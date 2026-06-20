import { computeLayout } from './layout.js';
import { marked } from 'marked';

const world = document.getElementById('canvas-world');
const view = document.getElementById('canvas-view');

let tx = 0, ty = 0, scale = 1;
let isPanning = false;
let hasPanned = false;
let lastPointer = { x: 0, y: 0 };
let activePointers = new Map();

export function initCanvas() {
  view.addEventListener('pointerdown', onPointerDown);
  view.addEventListener('pointermove', onPointerMove);
  view.addEventListener('pointerup', onPointerUp);
  view.addEventListener('pointercancel', onPointerUp);
  view.addEventListener('wheel', onWheel, { passive: false });
}

export function loadProject(project) {
  world.innerHTML = '';

  const layout = computeLayout(
    project.photos,
    project.canvas?.layout,
    view.clientWidth
  );

  if (project.canvas?.background) {
    view.style.background = project.canvas.background;
  } else {
    view.style.background = '';
  }

  for (const item of layout) {
    world.appendChild(createCard(item));
  }

  centerOn(getContentCentroid(layout));
}

function createCard({ photo, x, y, width, height, rotation }) {
  const card = document.createElement('div');
  card.className = 'photo-card';
  card.style.width = `${width}px`;
  card.style.height = `${height}px`;
  card.style.left = `${x}px`;
  card.style.top = `${y}px`;

  const baseTransform = `rotate(${rotation}deg)`;
  card.style.transform = baseTransform;
  card.style.setProperty('--card-transform', baseTransform);

  const front = document.createElement('div');
  front.className = 'photo-card__front';
  const img = document.createElement('img');
  img.src = photo.src;
  img.alt = photo.alt || '';
  img.draggable = false;
  front.appendChild(img);

  const back = document.createElement('div');
  back.className = 'photo-card__back';
  if (photo.flip) {
    back.style.background = photo.flip.background || '#1c1c1c';
    back.style.color = photo.flip.textColor || '#f0ece4';
    back.innerHTML = marked.parse(photo.flip.markdown || '');
  }

  card.appendChild(front);
  card.appendChild(back);

  card.addEventListener('click', () => {
    if (hasPanned) return;
    card.classList.toggle('flipped');
  });

  return card;
}

// ── Pan & pinch-zoom ──

function onPointerDown(e) {
  if (e.target.closest('.photo-card__back')) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  view.setPointerCapture(e.pointerId);

  if (activePointers.size === 1) {
    isPanning = true;
    hasPanned = false;
    lastPointer = { x: e.clientX, y: e.clientY };
    view.classList.add('panning');
  }
}

function onPointerMove(e) {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activePointers.size === 2) {
    // Pinch-zoom with two fingers
    const [a, b] = [...activePointers.values()];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);

    if (onPointerMove._lastPinchDist != null) {
      const factor = dist / onPointerMove._lastPinchDist;
      const mx = (a.x + b.x) / 2 - view.getBoundingClientRect().left;
      const my = (a.y + b.y) / 2 - view.getBoundingClientRect().top;
      tx = mx + (tx - mx) * factor;
      ty = my + (ty - my) * factor;
      scale = Math.min(Math.max(scale * factor, 0.1), 5);
      applyTransform();
    }
    onPointerMove._lastPinchDist = dist;
    return;
  }

  onPointerMove._lastPinchDist = null;

  if (!isPanning) return;
  const dx = e.clientX - lastPointer.x;
  const dy = e.clientY - lastPointer.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) hasPanned = true;
  tx += dx;
  ty += dy;
  lastPointer = { x: e.clientX, y: e.clientY };
  applyTransform();
}

function onPointerUp(e) {
  activePointers.delete(e.pointerId);
  onPointerMove._lastPinchDist = null;

  if (activePointers.size === 0) {
    isPanning = false;
    view.classList.remove('panning');
  }
}

// ── Mouse wheel zoom ──

function onWheel(e) {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.08 : 0.93;
  const rect = view.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  tx = mx + (tx - mx) * factor;
  ty = my + (ty - my) * factor;
  scale = Math.min(Math.max(scale * factor, 0.1), 5);
  applyTransform();
}

function applyTransform() {
  world.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

// ── View helpers ──

function getContentCentroid(layout) {
  const cx = layout.reduce((s, r) => s + r.x + r.width / 2, 0) / layout.length;
  const cy = layout.reduce((s, r) => s + r.y + r.height / 2, 0) / layout.length;
  return { cx, cy };
}

function centerOn({ cx, cy }) {
  const vw = view.clientWidth;
  const vh = view.clientHeight;
  // On narrow screens start at a tighter zoom so photos fill the viewport
  const isMobile = vw < 600;
  scale = isMobile ? 0.55 : 0.75;
  tx = vw / 2 - cx * scale;
  ty = vh / 2 - cy * scale;
  applyTransform();
}
