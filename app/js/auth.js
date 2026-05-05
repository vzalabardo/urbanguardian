// ============================================================
//  Urban Guardian — auth.js
//  Responsibility: Firebase Authentication session management
//  Covers: sign-in, sign-up, sign-out, auth state listener,
//          password reset, Google Sign-In (FASE 2+)
// ============================================================

import { auth, db }            from '../firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { doc, setDoc, getDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── Auth state observer ────────────────────────────────────
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Get current user ───────────────────────────────────────
export function getCurrentUser() {
  return auth.currentUser;
}

// ── Register with email/password ───────────────────────────
export async function registerWithEmail(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName });

  await setDoc(doc(db, 'users', user.uid), {
    uid:         user.uid,
    email:       user.email,
    displayName,
    photoURL:    null,
    phone:       null,
    createdAt:   serverTimestamp(),
    isGuardian:      false,
    guardianActive:  false,
    guardianLevel:   1,
    guardianScore:   0,
    stats: {
      routesCompleted:   0,
      incidentsReported: 0,
      helpProvided:      0,
      sosActivations:    0
    },
    trustedContacts: [],
    sosPIN:   null,
    fakePIN:  null,
    lastLocation: null,
    preferences: {
      notifications:  true,
      shareLocation:  true,
      autoGuardian:   false
    }
  });

  return user;
}

// ── Sign in with email/password ────────────────────────────
export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ── Sign out ───────────────────────────────────────────────
export async function logout() {
  await signOut(auth);
}

// ── Password reset ─────────────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ── Fetch user Firestore document ──────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}
