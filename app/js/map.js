// ============================================================
//  Urban Guardian — map.js
//  Responsibility: Mapbox GL JS map initialization and control
//  Covers: map init, user location marker, incident markers,
//          heatmap layer, map controls, camera navigation
// ============================================================

import { MAPBOX_TOKEN } from '../firebase-config.js';

let mapInstance = null;

// ── Initialize Mapbox map ──────────────────────────────────
export function initMap(containerId, options = {}) {
  if (!window.mapboxgl) {
    console.error('[map.js] Mapbox GL JS not loaded');
    return null;
  }

  mapboxgl.accessToken = MAPBOX_TOKEN;

  mapInstance = new mapboxgl.Map({
    container: containerId,
    style:     'mapbox://styles/mapbox/dark-v11',
    center:    options.center  ?? [-3.7038, 40.4168], // Madrid default
    zoom:      options.zoom    ?? 14,
    pitch:     options.pitch   ?? 0,
    bearing:   options.bearing ?? 0,
    ...options.mapOptions
  });

  mapInstance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
  mapInstance.addControl(new mapboxgl.GeolocateControl({
    positionOptions:   { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading:   true
  }), 'top-right');

  return mapInstance;
}

// ── Get current map instance ───────────────────────────────
export function getMap() {
  return mapInstance;
}

// ── Fly camera to coordinates ──────────────────────────────
export function flyTo(lat, lng, zoom = 15) {
  if (!mapInstance) return;
  mapInstance.flyTo({ center: [lng, lat], zoom, speed: 1.4 });
}

// ── Add / update user location marker ─────────────────────
let userMarker = null;
export function setUserMarker(lat, lng) {
  if (!mapInstance) return;

  if (userMarker) {
    userMarker.setLngLat([lng, lat]);
    return;
  }

  const el = document.createElement('div');
  el.className = 'user-location-dot';
  el.innerHTML = `
    <div class="dot-inner"></div>
    <div class="dot-ring"></div>
  `;

  userMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
    .setLngLat([lng, lat])
    .addTo(mapInstance);
}

// ── Incident markers (circle layer colored by severity) ───
const INCIDENT_SOURCE = 'incidents-src';
const INCIDENT_LAYER  = 'incidents-circles';
let   activePopup     = null;

export function addIncidentMarkers(geojson, onClickCallback) {
  if (!mapInstance) return;

  if (mapInstance.getSource(INCIDENT_SOURCE)) {
    mapInstance.getSource(INCIDENT_SOURCE).setData(geojson);
    return;
  }

  mapInstance.addSource(INCIDENT_SOURCE, { type: 'geojson', data: geojson });

  mapInstance.addLayer({
    id:     INCIDENT_LAYER,
    type:   'circle',
    source:  INCIDENT_SOURCE,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'],
        12, ['interpolate', ['linear'], ['get', 'severity'], 1, 7,  5, 13],
        16, ['interpolate', ['linear'], ['get', 'severity'], 1, 11, 5, 20]
      ],
      'circle-color': [
        'interpolate', ['linear'], ['get', 'severity'],
        1, '#F1C40F',
        3, '#E67E22',
        5, '#E74C3C'
      ],
      'circle-stroke-color': 'rgba(255,255,255,0.9)',
      'circle-stroke-width': 2,
      'circle-opacity': 0.88
    }
  });

  mapInstance.on('click', INCIDENT_LAYER, (e) => {
    const props = e.features[0].properties;
    if (onClickCallback) onClickCallback(props, e.lngLat);
  });

  mapInstance.on('mouseenter', INCIDENT_LAYER, () => {
    mapInstance.getCanvas().style.cursor = 'pointer';
  });
  mapInstance.on('mouseleave', INCIDENT_LAYER, () => {
    mapInstance.getCanvas().style.cursor = '';
  });
}

// ── Guardian markers (HTML markers for custom styling) ─────
const guardianMarkers = new Map();

export function updateGuardianMarkers(guardians, onClickCallback) {
  if (!mapInstance) return;

  // Remove stale markers
  const activeIds = new Set(guardians.map(g => g.id));
  guardianMarkers.forEach((marker, id) => {
    if (!activeIds.has(id)) { marker.remove(); guardianMarkers.delete(id); }
  });

  // Add / update
  guardians.forEach(g => {
    const loc = g.currentLocation;
    if (!loc?.lat || !loc?.lng) return;

    if (guardianMarkers.has(g.id)) {
      guardianMarkers.get(g.id).setLngLat([loc.lng, loc.lat]);
      return;
    }

    const el = document.createElement('div');
    el.className = 'guardian-map-marker';
    el.innerHTML = `<i class="fa-solid fa-shield-halved"></i>`;
    el.style.cssText = [
      'width:32px', 'height:32px', 'border-radius:50%',
      'background:var(--primary,#6C63FF)', 'border:2px solid #fff',
      'display:flex', 'align-items:center', 'justify-content:center',
      'color:#fff', 'font-size:0.875rem', 'cursor:pointer',
      'box-shadow:0 2px 8px rgba(0,0,0,0.4)'
    ].join(';');

    if (onClickCallback) el.addEventListener('click', () => onClickCallback(g));

    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([loc.lng, loc.lat])
      .addTo(mapInstance);
    guardianMarkers.set(g.id, marker);
  });
}

// ── Show / close Mapbox popup ──────────────────────────────
export function showPopup(lngLat, html) {
  if (activePopup) activePopup.remove();
  activePopup = new mapboxgl.Popup({ closeButton: true, maxWidth: '280px', className: 'ug-popup' })
    .setLngLat(lngLat)
    .setHTML(html)
    .addTo(mapInstance);
  return activePopup;
}

export function closePopup() {
  if (activePopup) { activePopup.remove(); activePopup = null; }
}

// ── Add heatmap layer from GeoJSON source (legacy) ─────────
export function addHeatmapLayer(sourceId, geojsonData) {
  if (!mapInstance) return;
  if (mapInstance.getSource(sourceId)) {
    mapInstance.getSource(sourceId).setData(geojsonData);
    return;
  }
  mapInstance.addSource(sourceId, { type: 'geojson', data: geojsonData });
  mapInstance.addLayer({
    id: `${sourceId}-heat`, type: 'heatmap', source: sourceId,
    paint: {
      'heatmap-weight':   ['interpolate', ['linear'], ['get', 'severity'], 1, 0.2, 5, 1],
      'heatmap-intensity':['interpolate', ['linear'], ['zoom'], 11, 1, 15, 2],
      'heatmap-radius':   ['interpolate', ['linear'], ['zoom'], 11, 20, 15, 40],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,0,0)', 0.2, 'rgba(46,204,113,0.4)',
        0.5, 'rgba(243,156,18,0.6)', 0.8, 'rgba(231,76,60,0.7)', 1, 'rgba(231,76,60,0.9)'
      ],
      'heatmap-opacity': 0.75
    }
  });
}

// ── Remove a layer/source safely ──────────────────────────
export function removeLayer(sourceId) {
  if (!mapInstance) return;
  if (mapInstance.getLayer(`${sourceId}-heat`)) mapInstance.removeLayer(`${sourceId}-heat`);
  if (mapInstance.getSource(sourceId))          mapInstance.removeSource(sourceId);
}
