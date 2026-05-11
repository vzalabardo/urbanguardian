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

  // If style not ready yet, queue for when it loads
  if (!mapInstance.isStyleLoaded()) {
    mapInstance.once('load', () => addIncidentMarkers(geojson, onClickCallback));
    return;
  }

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

// ── Guardian markers (circle layer — same approach as incidents) ──
const GUARDIAN_SOURCE  = 'guardians-src';
const GUARDIAN_LAYER   = 'guardians-circles';
const guardianIconMarkers = new Map(); // id → mapboxgl.Marker (FA icon, pointer-events:none)

export function updateGuardianMarkers(guardians, onClickCallback) {
  if (!mapInstance) return;

  const geojson = {
    type: 'FeatureCollection',
    features: guardians
      .filter(g => g.currentLocation?.lat && g.currentLocation?.lng)
      .map(g => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [g.currentLocation.lng, g.currentLocation.lat]
        },
        properties: {
          id:            g.id,
          displayName:   g.displayName   ?? 'Guardian',
          guardianLevel: g.guardianLevel ?? 1,
          guardianScore: g.guardianScore ?? 0,
          guardianId:    g.guardianId    ?? '',
          startedAtMs:   g.startedAt?.toMillis?.() ?? null,
          photoURL:      g.photoURL      ?? ''
        }
      }))
  };

  // ── Sync HTML icon markers (FA shield, pointer-events:none) ──
  const activeIds = new Set(guardians.map(g => g.id));

  // Remove stale icon markers
  guardianIconMarkers.forEach((marker, id) => {
    if (!activeIds.has(id)) { marker.remove(); guardianIconMarkers.delete(id); }
  });

  // Add / move icon markers
  guardians.forEach(g => {
    const loc = g.currentLocation;
    if (!loc?.lat || !loc?.lng) return;
    if (guardianIconMarkers.has(g.id)) {
      guardianIconMarkers.get(g.id).setLngLat([loc.lng, loc.lat]);
      return;
    }
    const el = document.createElement('div');
    el.style.cssText = 'pointer-events:none;display:flex;align-items:center;justify-content:center;width:30px;height:30px;';
    el.innerHTML = '<i class="fa-solid fa-shield-halved" style="color:#fff;font-size:13px;"></i>';
    const m = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([loc.lng, loc.lat])
      .addTo(mapInstance);
    guardianIconMarkers.set(g.id, m);
  });

  // ── GeoJSON source / circle layer for click detection ──
  try {
    if (mapInstance.getSource(GUARDIAN_SOURCE)) {
      mapInstance.getSource(GUARDIAN_SOURCE).setData(geojson);
      return;
    }

    mapInstance.addSource(GUARDIAN_SOURCE, { type: 'geojson', data: geojson });

    mapInstance.addLayer({
      id:     GUARDIAN_LAYER,
      type:   'circle',
      source:  GUARDIAN_SOURCE,
      paint: {
        'circle-radius': 15,
        'circle-color':  '#6C63FF',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2.5,
        'circle-opacity': 0.92
      }
    });

    mapInstance.on('click', GUARDIAN_LAYER, (e) => {
      const props = e.features[0].properties;
      if (onClickCallback) onClickCallback(props, e.lngLat);
    });

    mapInstance.on('mouseenter', GUARDIAN_LAYER, () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    });
    mapInstance.on('mouseleave', GUARDIAN_LAYER, () => {
      mapInstance.getCanvas().style.cursor = '';
    });
  } catch (_) {
    // Style not loaded yet — map.on('load') will retry
  }
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

// ── Temporal decay heatmap layer ──────────────────────────
const HEATMAP_SOURCE = 'heatmap-historical';
const HEATMAP_LAYER  = 'heatmap-layer';

export function updateHeatmapLayer(geojson) {
  if (!mapInstance) return;

  if (mapInstance.getSource(HEATMAP_SOURCE)) {
    mapInstance.getSource(HEATMAP_SOURCE).setData(geojson);
    return;
  }

  mapInstance.addSource(HEATMAP_SOURCE, { type: 'geojson', data: geojson });

  // Insert below circle markers so active incidents render on top
  const beforeLayer = mapInstance.getLayer(INCIDENT_LAYER) ? INCIDENT_LAYER : undefined;

  mapInstance.addLayer({
    id:     HEATMAP_LAYER,
    type:   'heatmap',
    source:  HEATMAP_SOURCE,
    paint: {
      // weight property carries the decay value (0–1)
      'heatmap-weight': ['get', 'weight'],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 3],
      'heatmap-radius':    ['interpolate', ['linear'], ['zoom'], 10, 30, 14, 50, 16, 70],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0,   'rgba(0,0,0,0)',
        0.1, 'rgba(231,76,60,0.05)',
        0.3, 'rgba(231,76,60,0.25)',
        0.5, 'rgba(192,57,43,0.50)',
        0.7, 'rgba(150,20,20,0.70)',
        1.0, 'rgba(100,0,0,0.85)'
      ],
      'heatmap-opacity': 0.75
    }
  }, beforeLayer);
}

export function setHeatmapVisibility(visible) {
  if (!mapInstance || !mapInstance.getLayer(HEATMAP_LAYER)) return;
  mapInstance.setLayoutProperty(HEATMAP_LAYER, 'visibility', visible ? 'visible' : 'none');
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
