import { marked } from 'marked';

const leftPane  = document.getElementById('portfolio-left');
const photoEl   = document.getElementById('portfolio-photo');
const captionEl = document.getElementById('portfolio-caption');

export function loadPortfolio(scrapbook) {
  leftPane.innerHTML = '';

  for (const photo of scrapbook.photos) {
    const thumb = document.createElement('div');
    thumb.className = 'portfolio-thumb';
    thumb.dataset.id = photo.id;
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.alt || '';
    img.draggable = false;
    thumb.appendChild(img);
    thumb.addEventListener('click', () => selectPhoto(photo));
    leftPane.appendChild(thumb);
  }

  if (scrapbook.photos.length) selectPhoto(scrapbook.photos[0]);
}

function selectPhoto(photo) {
  leftPane.querySelectorAll('.portfolio-thumb').forEach(t =>
    t.classList.toggle('active', t.dataset.id === photo.id)
  );

  photoEl.src = photo.src;
  photoEl.alt = photo.alt || '';

  if (photo.caption) {
    captionEl.innerHTML = marked.parse(photo.caption);
    captionEl.hidden = false;
  } else {
    captionEl.innerHTML = '';
    captionEl.hidden = true;
  }

}
