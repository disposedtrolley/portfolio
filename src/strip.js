import { marked } from 'marked';
import { attachGeoMap } from './geo.js';

const strip = document.getElementById('photo-strip');
const stripInner = document.getElementById('photo-strip-inner');
const storyPanel = document.getElementById('project-story');
const storyContent = document.getElementById('project-story-content');

export function initStrip() {
  strip.addEventListener('wheel', (e) => {
    e.preventDefault();
    strip.scrollLeft += e.deltaY + e.deltaX;
  }, { passive: false });

  // Resize all cards whenever the strip changes size (window resize, orientation change, etc.)
  new ResizeObserver(() => afterLayout(resizeAllCards)).observe(strip);
}

export function loadProject(project) {
  stripInner.innerHTML = '';
  strip.scrollLeft = 0;
  strip.style.background = project.background || '#f5f2ee';

  if (project.story) {
    storyContent.innerHTML = marked.parse(project.story);
    storyPanel.hidden = false;
  } else {
    storyPanel.hidden = true;
  }

  for (const photo of project.photos) {
    stripInner.appendChild(createCard(photo));
  }

  // Size after the layout caused by story panel show/hide has settled
  afterLayout(resizeAllCards);
}

// Double rAF: wait for two frames so the browser completes its layout pass
function afterLayout(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

function availableSize() {
  const style = getComputedStyle(stripInner);
  return {
    w: strip.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
    h: strip.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
  };
}

function resizeAllCards() {
  const { w: maxW, h: maxH } = availableSize();
  if (maxW <= 0 || maxH <= 0) return;
  for (const card of stripInner.querySelectorAll('.photo-card')) {
    const img = card.querySelector('img');
    if (!img.naturalWidth) continue; // not loaded yet — load event will handle it
    const aspect = img.naturalWidth / img.naturalHeight;
    // Fit within the visible area: constrain by whichever dimension is binding
    const h = Math.min(maxH, Math.round(maxW / aspect));
    const w = Math.round(aspect * h);
    card.style.height = `${h}px`;
    card.style.width = `${w}px`;
  }
}

function createCard(photo) {
  const card = document.createElement('div');
  card.className = 'photo-card';

  const front = document.createElement('div');
  front.className = 'photo-card__front';
  const img = document.createElement('img');
  img.src = photo.src;
  img.alt = photo.alt || '';
  img.draggable = false;
  front.appendChild(img);

  const back = document.createElement('div');
  back.className = 'photo-card__back';
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

  // When this image loads, resize all cards (layout is guaranteed settled by then)
  img.addEventListener('load', () => afterLayout(resizeAllCards));

  let pointerMoved = false;
  card.addEventListener('pointerdown', () => { pointerMoved = false; });
  card.addEventListener('pointermove', () => { pointerMoved = true; });
  card.addEventListener('pointerup', () => {
    if (!pointerMoved && photo.flip) {
      card.classList.toggle('flipped');
      if (card.classList.contains('flipped') && onFlip) onFlip();
    }
  });

  return card;
}
