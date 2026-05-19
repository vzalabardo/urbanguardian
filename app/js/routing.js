// ============================================================
//  Urban Guardian — routing.js
//  Responsibility: Mapbox Directions API + safe route scoring
//  Covers: fetch route, penalize segments near incidents,
//          render route on map, clear route
// ============================================================

import { MAPBOX_TOKEN }  from '../firebase-config.js';
import { getMap }        from './map.js';
import { db, auth }      from '../firebase-config.js';
import { addDoc, collection, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const DIRECTIONS_BASE = 'https://api.mapbox.com/directions/v5/mapbox/walking';
const ROUTE_SOURCE_ID = 'ug-route';

// ── Fetch single walking route from Mapbox Directions API ──
export async function fetchRoute(originLng, originLat, destLng, destLat) {
  const coords = `${originLng},${originLat};${destLng},${destLat}`;
  const url = `${DIRECTIONS_BASE}/${coords}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;

  const res  = await fetch(url);
  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  return data.routes[0]; // { geometry, duration, distance, legs }
}

// ── Fetch multiple routes with alternatives ─────────────
export async function fetchRoutes(originLng, originLat, destLng, destLat) {
  const coords = `${originLng},${originLat};${destLng},${destLat}`;
  const url = `${DIRECTIONS_BASE}/${coords}?geometries=geojson&overview=full&steps=true&alternatives=true&access_token=${MAPBOX_TOKEN}`;

  const res  = await fetch(url);
  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  return data.routes; // Array of route objects
}

// ── Calculate a basic safety score for a route ─────────────
// incidents: array from watchActiveIncidents
// route: Mapbox route object with geometry.coordinates
export function calcSafetyScore(route, incidents) {
  if (!incidents || incidents.length === 0) return 100;

  const coords     = route.geometry.coordinates; // [[lng, lat], ...]
  const RADIUS_DEG = 0.002; // ~200m in degrees (rough approximation)
  let   penalty    = 0;

  for (const inc of incidents) {
    const iLng = inc.location.lng;
    const iLat = inc.location.lat;

    for (const [lng, lat] of coords) {
      const dist = Math.hypot(lng - iLng, lat - iLat);
      if (dist < RADIUS_DEG) {
        penalty += inc.severity * 2;
        break; // count each incident once per route
      }
    }
  }

  return Math.max(0, Math.round(100 - penalty));
}

const SAFE_ROUTE_ID  = 'ug-route-safe';
const FAST_ROUTE_ID  = 'ug-route-fast';
const INDEXED_IDS    = ['ug-ri-0', 'ug-ri-1', 'ug-ri-2'];
const INDEXED_COLORS = ['#2ECC71', '#4A90E2', '#F39C12'];

// ── Draw up to 3 routes, color-coded by safety rank ────────
export function drawAllRoutes(routes) {
  const map = getMap();
  if (!map) return;
  // Draw lower-ranked routes first so safest renders on top
  [...routes].reverse().forEach((route, revIdx) => {
    const idx    = routes.length - 1 - revIdx;
    const id     = INDEXED_IDS[idx];
    const color  = INDEXED_COLORS[idx];
    const width  = idx === 0 ? 6 : 4;
    const opacity = idx === 0 ? 0.95 : 0.45;
    _drawLayer(map, id, route.geometry, color, width, opacity);
  });
}

// ── Highlight one route by index, dim others ───────────────
export function highlightRouteByIndex(idx) {
  const map = getMap();
  if (!map) return;
  INDEXED_IDS.forEach((id, i) => {
    if (!map.getLayer(`${id}-line`)) return;
    map.setPaintProperty(`${id}-line`, 'line-opacity', i === idx ? 0.95 : 0.15);
    map.setPaintProperty(`${id}-line`, 'line-width',   i === idx ? 7   : 3);
  });
}

// ── Clear all indexed + legacy routes ──────────────────────
export function clearAllRoutes() {
  const map = getMap();
  if (!map) return;
  for (const id of [...INDEXED_IDS, SAFE_ROUTE_ID, FAST_ROUTE_ID, ROUTE_SOURCE_ID]) {
    if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
    if (map.getSource(id))          map.removeSource(id);
  }
}

// ── Internal helper: add/update a single line layer ────────
function _drawLayer(map, id, geometry, color, width, opacity) {
  const geojson = { type: 'Feature', geometry };
  if (map.getSource(id)) {
    map.getSource(id).setData(geojson);
    return;
  }
  map.addSource(id, { type: 'geojson', data: geojson });
  map.addLayer({
    id:     `${id}-line`,
    type:   'line',
    source:  id,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint:  { 'line-color': color, 'line-width': width, 'line-opacity': opacity }
  });
}

// ── Draw route on map ──────────────────────────────────────
export function drawRoute(route, color = '#4A90E2') {
  const map = getMap();
  if (!map) return;

  const geojson = {
    type: 'Feature',
    geometry: route.geometry
  };

  if (map.getSource(ROUTE_SOURCE_ID)) {
    map.getSource(ROUTE_SOURCE_ID).setData(geojson);
    return;
  }

  map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: geojson });

  map.addLayer({
    id:     `${ROUTE_SOURCE_ID}-line`,
    type:   'line',
    source:  ROUTE_SOURCE_ID,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color':   color,
      'line-width':   5,
      'line-opacity': 0.9
    }
  });
}

// ── Draw safe + fast routes simultaneously ─────────────────
export function drawRoutes(safeRoute, fastRoute) {
  const map = getMap();
  if (!map) return;
  if (fastRoute) _drawLayer(map, FAST_ROUTE_ID, fastRoute.geometry, '#4A90E2', 4, 0.5);
  if (safeRoute) _drawLayer(map, SAFE_ROUTE_ID, safeRoute.geometry, '#2ECC71', 6, 0.95);
}

// ── Highlight one route, dim the other ────────────────────
export function highlightRoute(which) { // 'safe' | 'fast'
  const map = getMap();
  if (!map) return;
  const isSafe = which === 'safe';
  if (map.getLayer(`${SAFE_ROUTE_ID}-line`))
    map.setPaintProperty(`${SAFE_ROUTE_ID}-line`, 'line-opacity', isSafe ? 0.95 : 0.25);
  if (map.getLayer(`${FAST_ROUTE_ID}-line`))
    map.setPaintProperty(`${FAST_ROUTE_ID}-line`, 'line-opacity', isSafe ? 0.25 : 0.9);
}

// ── Clear route from map ───────────────────────────────────
export function clearRoute() {
  const map = getMap();
  if (!map) return;
  if (map.getLayer(`${ROUTE_SOURCE_ID}-line`)) map.removeLayer(`${ROUTE_SOURCE_ID}-line`);
  if (map.getSource(ROUTE_SOURCE_ID))          map.removeSource(ROUTE_SOURCE_ID);
}

// ── Clear all routes (safe + fast + legacy) ────────────────
export function clearRoutes() {
  const map = getMap();
  if (!map) return;
  for (const id of [SAFE_ROUTE_ID, FAST_ROUTE_ID, ROUTE_SOURCE_ID]) {
    if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
    if (map.getSource(id))          map.removeSource(id);
  }
}

// ── Save route to Firestore ────────────────────────────────
export async function saveRoute({ origin, destination, route, safetyScore, nearbyIncidents }) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const ref = await addDoc(collection(db, 'routes'), {
    userId:      user.uid,
    origin,
    destination,
    routeType:   'safe',
    waypoints:   route.geometry.coordinates,
    distance:    route.distance,    // metres
    duration:    route.duration,    // seconds
    safetyScore,
    startedAt:   serverTimestamp(),
    completedAt: null,
    status:      'planned',
    nearbyIncidents: nearbyIncidents ?? [],
    guardianRequested: false,
    assignedGuardian:  null
  });

  return ref.id;
}
