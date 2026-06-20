import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path when bundled with Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

export function attachGeoMap(backEl, geo) {
  const mapEl = document.createElement('div');
  mapEl.className = 'card-map';
  backEl.appendChild(mapEl);

  let initialised = false;
  let map = null;

  return function onFlip() {
    if (!initialised) {
      initialised = true;
      map = L.map(mapEl, {
        center: [geo.lat, geo.lng],
        zoom: geo.zoom ?? 13,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      });
      L.tileLayer(TILE_URL, { attribution: ATTRIBUTION }).addTo(map);
      L.marker([geo.lat, geo.lng]).addTo(map);
    }
    requestAnimationFrame(() => map.invalidateSize());
  };
}
