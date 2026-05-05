// ============================================================
//  Urban Guardian — firebase-config.js
//  Firebase initialization + exports
//  Replace placeholder values with your actual Firebase config
//  before deploying. Never commit real keys to version control.
// ============================================================

import { initializeApp }      from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore }        from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth }             from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getStorage }          from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// ── Your Firebase project configuration ───────────────────
// Get these values from:
//   Firebase Console → Project Settings → Your apps → SDK setup
const firebaseConfig = {
  apiKey:            "AIzaSyA2vGV52wDwLiHyEqVTIQqMhaZ4Tcdr1iU",
  authDomain:        "urbanguardian-ab1c9.firebaseapp.com",
  projectId:         "urbanguardian-ab1c9",
  storageBucket:     "urbanguardian-ab1c9.firebasestorage.app",
  messagingSenderId: "344676317857",
  appId:             "1:344676317857:web:5f22fb7ce7b5ebad198ee0",
  measurementId:     "G-Q6SRTGD7PD"
};

// ── Initialize Firebase ────────────────────────────────────
const app = initializeApp(firebaseConfig);

// ── Service exports ────────────────────────────────────────
export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);

// ── Mapbox token ───────────────────────────────────────────
// Get your token from: https://account.mapbox.com/access-tokens/
export const MAPBOX_TOKEN = "pk.eyJ1IjoidnphbGFiYXJkbyIsImEiOiJjbW9zaGx5NjYyczNrMnhzYTI3MThuMWliIn0._D9f-GVn-0GMBsqqDmRtXg";

export default app;
