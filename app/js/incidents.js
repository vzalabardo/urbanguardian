// ============================================================
//  Urban Guardian — incidents.js
//  Responsibility: Firestore CRUD for incidents collection
//  Covers: create incident, real-time listener, validate/dispute,
//          auto-expiry filter, GeoJSON conversion for heatmap
// ============================================================

import { db, auth }  from '../firebase-config.js';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, Timestamp,
  increment, arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const INCIDENTS_COL = 'incidents';
const EXPIRY_HOURS  = 48;

// ── Create a new incident ──────────────────────────────────
export async function reportIncident({ type, severity, lat, lng, address, description }) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const now       = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + EXPIRY_HOURS * 60 * 60 * 1000);

  const ref = await addDoc(collection(db, INCIDENTS_COL), {
    reportedBy:  user.uid,
    type,
    severity,    // 1–5
    location: { lat, lng, address: address ?? '' },
    description: description ?? '',
    timestamp:   now,
    expiresAt,
    validations: {
      confirmed:   0,
      disputed:    0,
      confirmedBy: [],
      disputedBy:  []
    },
    isActive:   true,
    resolution: null
  });

  return ref.id;
}

// ── Real-time listener for active incidents ─────────────────
// No Firestore filters — full client-side filtering to avoid any index issues.
export function watchActiveIncidents(callback) {
  return onSnapshot(collection(db, INCIDENTS_COL), (snapshot) => {
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const now    = Date.now();
    const incidents = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(i => {
        if (i.isActive === false) return false;
        const expMs = i.expiresAt?.toMillis?.()   ?? null;
        const tsMs  = i.timestamp?.toMillis?.()   ?? i.reportedAt?.toMillis?.() ?? null;
        if (expMs !== null) return expMs > now;
        if (tsMs  !== null) return tsMs  > cutoff;
        return true;
      });
    callback(incidents);
  });
}

// ── Convert incidents array to GeoJSON ─────────────────────
export function incidentsToGeoJSON(incidents) {
  return {
    type: 'FeatureCollection',
    features: incidents
      .filter(inc => typeof inc.location?.lng === 'number' && typeof inc.location?.lat === 'number')
      .map(inc => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [inc.location.lng, inc.location.lat]
      },
      properties: {
        id:          inc.id,
        type:        inc.type,
        severity:    inc.severity,
        description: inc.description ?? '',
        reportedAt:  inc.timestamp?.toMillis?.() ?? inc.reportedAt?.toMillis?.() ?? null
      }
    }))
  };
}

// ── Real-time listener for historical incidents (heatmap) ───
// Includes ALL incidents (active + expired) in the last `days` days.
export function watchHistoricalIncidents(callback, days = 30) {
  const cutoff = Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000);
  const q = query(
    collection(db, INCIDENTS_COL),
    where('timestamp', '>', cutoff),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const incidents = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(incidents);
  });
}

// ── Convert historical incidents to weighted GeoJSON for heatmap
// weight = (severity / 5) × 2^(−daysSince / halfLifeDays)
// halfLifeDays = 20  →  20 days → ×0.5, 30 days → ×0.35, 60 days → ×0.12
export function historicalToHeatmapGeoJSON(incidents, halfLifeDays = 20) {
  const now = Date.now();
  const features = incidents.flatMap(inc => {
    const ts       = inc.timestamp?.toMillis?.() ?? now;
    const daysSince = (now - ts) / (1000 * 60 * 60 * 24);
    const decay    = Math.pow(2, -daysSince / halfLifeDays);
    const weight   = (inc.severity / 5) * decay;
    if (weight < 0.005) return [];
    return [{
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [inc.location.lng, inc.location.lat]
      },
      properties: { weight, severity: inc.severity }
    }];
  });
  return { type: 'FeatureCollection', features };
}

// ── Validate (confirm) an incident ─────────────────────────
export async function confirmIncident(incidentId) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const ref  = doc(db, INCIDENTS_COL, incidentId);
  await updateDoc(ref, {
    'validations.confirmed':  increment(1),
    'validations.confirmedBy': arrayUnion(user.uid)
  });
}

// ── Dispute an incident ────────────────────────────────────
export async function disputeIncident(incidentId) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const ref = doc(db, INCIDENTS_COL, incidentId);
  await updateDoc(ref, {
    'validations.disputed':  increment(1),
    'validations.disputedBy': arrayUnion(user.uid)
  });
}

// ── Deactivate an incident (author or admin) ───────────────
export async function deactivateIncident(incidentId, resolution = '') {
  const ref = doc(db, INCIDENTS_COL, incidentId);
  await updateDoc(ref, { isActive: false, resolution });
}
