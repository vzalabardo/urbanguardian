// ============================================================
//  Urban Guardian — profile.js
//  Responsibility: User profile, stats, and achievements
//  Covers: read/update profile, increment stats, fetch
//          achievements catalogue, unlock achievements
// ============================================================

import { db, auth, storage } from '../firebase-config.js';
import {
  doc, getDoc, setDoc, updateDoc, collection, getDocs,
  serverTimestamp, increment
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
import { updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const USERS_COL = 'users';

// ── Read user profile ─────────────────────────────────────
export async function getProfile(uid) {
  const snap = await getDoc(doc(db, USERS_COL, uid ?? auth.currentUser?.uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── Update display name / phone ───────────────────────────
export async function updateProfileInfo({ displayName, phone }) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const updates = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (phone       !== undefined) updates.phone       = phone;

  await setDoc(doc(db, USERS_COL, user.uid), updates, { merge: true });

  if (displayName) await updateProfile(user, { displayName });
}

// ── Upload profile photo ──────────────────────────────────
export async function uploadProfilePhoto(file) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const storageRef = ref(storage, `profile_photos/${user.uid}`);
  await uploadBytes(storageRef, file);
  const photoURL = await getDownloadURL(storageRef);

  await setDoc(doc(db, USERS_COL, user.uid), { photoURL }, { merge: true });
  await updateProfile(user, { photoURL });

  return photoURL;
}

// ── Update SOS PINs ───────────────────────────────────────
export async function updatePINs({ sosPIN, fakePIN }) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const updates = {};
  if (sosPIN  !== undefined) updates.sosPIN  = sosPIN;
  if (fakePIN !== undefined) updates.fakePIN = fakePIN;

  await setDoc(doc(db, USERS_COL, user.uid), updates, { merge: true });
}

// ── Update trusted contacts ───────────────────────────────
export async function updateTrustedContacts(contacts) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  await setDoc(doc(db, USERS_COL, user.uid), { trustedContacts: contacts }, { merge: true });
}

// ── Update preferences ────────────────────────────────────
export async function updatePreferences(prefs) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const updates = {};
  for (const [k, v] of Object.entries(prefs)) {
    updates[`preferences.${k}`] = v;
  }
  await updateDoc(doc(db, USERS_COL, user.uid), updates);
}

// ── Increment a stat counter ──────────────────────────────
export async function incrementStat(statName) {
  const user = auth.currentUser;
  if (!user) return;
  await setDoc(doc(db, USERS_COL, user.uid), {
    [`stats.${statName}`]: increment(1)
  }, { merge: true });
}

// ── Add guardian score ────────────────────────────────────
export async function addGuardianScore(points) {
  const user = auth.currentUser;
  if (!user) return;
  await setDoc(doc(db, USERS_COL, user.uid), {
    guardianScore: increment(points)
  }, { merge: true });
}

// ── Fetch achievements catalogue ──────────────────────────
export async function getAchievements() {
  const snap = await getDocs(collection(db, 'achievements'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Fetch user's unlocked achievements ───────────────────
export async function getUserAchievements(uid) {
  const userId = uid ?? auth.currentUser?.uid;
  const snap = await getDocs(
    collection(db, 'user_achievements', userId, 'achievements')
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
