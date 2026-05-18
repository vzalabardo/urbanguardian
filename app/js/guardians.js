// ============================================================
//  Urban Guardian — guardians.js
//  Responsibility: Guardian session management
//  Covers: activate/deactivate guardian mode, real-time list
//          of nearby active guardians, location updates
// ============================================================

import { db, auth }  from '../firebase-config.js';
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc,
  onSnapshot, query, where, serverTimestamp, Timestamp, GeoPoint
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const SESSIONS_COL     = 'guardian_sessions';
const USERS_COL        = 'users';
const LOCATION_INTERVAL = 30_000; // ms

let activeSessionId    = null;
let locationIntervalId = null;

// ── Activate guardian mode ─────────────────────────────────
export async function activateGuardian(maxDistanceMeters = 1000) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const position = await getCurrentPosition();

  const ref = await addDoc(collection(db, SESSIONS_COL), {
    guardianId: user.uid,
    startedAt:  serverTimestamp(),
    endedAt:    null,
    currentLocation: {
      lat:       position.coords.latitude,
      lng:       position.coords.longitude,
      accuracy:  position.coords.accuracy,
      timestamp: Timestamp.now()
    },
    isAvailable:  true,
    maxDistance:  maxDistanceMeters,
    activeRoute:  null,
    helpRequests: []
  });

  activeSessionId = ref.id;

  await setDoc(doc(db, USERS_COL, user.uid), {
    isGuardian:     true,
    guardianActive: true
  }, { merge: true });

  // Start periodic location updates
  locationIntervalId = setInterval(() => updateGuardianLocation(), LOCATION_INTERVAL);

  return activeSessionId;
}

// ── Deactivate guardian mode ───────────────────────────────
export async function deactivateGuardian() {
  const user = auth.currentUser;
  if (!user || !activeSessionId) return;

  clearInterval(locationIntervalId);
  locationIntervalId = null;

  await updateDoc(doc(db, SESSIONS_COL, activeSessionId), {
    isAvailable: false,
    endedAt:     serverTimestamp()
  });

  await setDoc(doc(db, USERS_COL, user.uid), {
    guardianActive: false
  }, { merge: true });

  activeSessionId = null;
}

// ── Update guardian's current location ─────────────────────
export async function updateGuardianLocation() {
  if (!activeSessionId) return;

  try {
    const position = await getCurrentPosition();
    await updateDoc(doc(db, SESSIONS_COL, activeSessionId), {
      currentLocation: {
        lat:       position.coords.latitude,
        lng:       position.coords.longitude,
        accuracy:  position.coords.accuracy,
        timestamp: Timestamp.now()
      }
    });
  } catch (e) {
    console.warn('[guardians.js] Location update failed', e);
  }
}

// ── Watch active guardian sessions ────────────────────────
export function watchActiveGuardians(callback) {
  const q = query(
    collection(db, SESSIONS_COL),
    where('isAvailable', '==', true)
  );

  return onSnapshot(q, (snapshot) => {
    const guardians = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(guardians);
  });
}

// ── Get current guardian session ID ───────────────────────
export function getActiveSessionId() {
  return activeSessionId;
}

// ── Fetch full profile for a guardian ──────────────────
export async function getGuardianProfile(guardianId) {
  if (!guardianId) return null;
  const snap = await getDoc(doc(db, USERS_COL, guardianId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── Helper: geolocation promise wrapper ───────────────
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 5_000
    });
  });
}
