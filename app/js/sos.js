// ============================================================
//  Urban Guardian — sos.js
//  Responsibility: SOS alert flow (100% SIMULATED)
//  IMPORTANT: This does NOT call police or emergency services.
//  It creates a Firestore document and shows UI feedback only.
//  Covers: trigger SOS, PIN verification (real/fake), deactivate
// ============================================================

import { db, auth }  from '../firebase-config.js';
import {
  collection, doc, addDoc, updateDoc, getDoc, serverTimestamp, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const SOS_COL   = 'sos_alerts';
const USERS_COL = 'users';

let activeAlertId  = null;
let sosTimerHandle = null;

// ── Trigger SOS alert ──────────────────────────────────────
export async function triggerSOS() {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  if (activeAlertId)  return activeAlertId; // already active

  let lat = null, lng = null, accuracy = null;

  try {
    const pos = await getPosition();
    lat      = pos.coords.latitude;
    lng      = pos.coords.longitude;
    accuracy = pos.coords.accuracy;
  } catch (_) { /* proceed without GPS */ }

  const ref = await addDoc(collection(db, SOS_COL), {
    userId:      user.uid,
    triggeredAt: serverTimestamp(),
    deactivatedAt: null,
    location: { lat, lng, accuracy },
    status: 'active',
    deactivationType: null,
    notifiedContacts:  [],
    notifiedGuardians: [],
    recording: { started: false, duration: 0 },
    respondingGuardians: [],
    resolved: false
  });

  activeAlertId = ref.id;

  // Auto-deactivate after 30 minutes (timeout safety)
  sosTimerHandle = setTimeout(() => deactivateSOS('timeout'), 30 * 60 * 1000);

  return activeAlertId;
}

// ── Deactivate SOS with PIN verification ──────────────────
export async function deactivateWithPIN(enteredPIN) {
  const user = auth.currentUser;
  if (!user || !activeAlertId) return { success: false, fake: false };

  const userSnap = await getDoc(doc(db, USERS_COL, user.uid));
  const profile  = userSnap.data();

  if (enteredPIN === profile?.fakePIN) {
    // Fake PIN: pretend to deactivate but keep alert active silently
    return { success: true, fake: true };
  }

  if (enteredPIN === profile?.sosPIN) {
    await deactivateSOS('real_pin');
    return { success: true, fake: false };
  }

  return { success: false, fake: false };
}

// ── Internal deactivation ─────────────────────────────────
export async function deactivateSOS(type = 'real_pin') {
  if (!activeAlertId) return;
  clearTimeout(sosTimerHandle);

  await updateDoc(doc(db, SOS_COL, activeAlertId), {
    status:           'deactivated',
    deactivatedAt:    serverTimestamp(),
    deactivationType: type,
    resolved:         type !== 'fake_pin'
  });

  activeAlertId = null;
}

// ── Check if SOS is currently active ──────────────────────
export function isSOSActive() {
  return activeAlertId !== null;
}

// ── Get current alert ID ───────────────────────────────────
export function getActiveAlertId() {
  return activeAlertId;
}

// ── Helper: geolocation ────────────────────────────────────
function getPosition() {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 8_000, maximumAge: 0
    })
  );
}
