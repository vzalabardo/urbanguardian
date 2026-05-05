// ============================================================
//  Urban Guardian — notifications.js
//  Responsibility: In-app notification management
//  Covers: real-time listener, mark as read, unread count,
//          create notification (server-side helper pattern)
// ============================================================

import { db, auth }  from '../firebase-config.js';
import {
  collection, doc, addDoc, updateDoc, onSnapshot,
  query, where, orderBy, limit, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const NOTIF_COL = 'notifications';

// ── Listen to user's notifications (last 30) ──────────────
export function watchNotifications(callback) {
  const user = auth.currentUser;
  if (!user) return () => {};

  const q = query(
    collection(db, NOTIF_COL),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc'),
    limit(30)
  );

  return onSnapshot(q, (snap) => {
    const notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(notifications);
  });
}

// ── Mark a single notification as read ───────────────────
export async function markAsRead(notificationId) {
  await updateDoc(doc(db, NOTIF_COL, notificationId), {
    read:   true,
    readAt: serverTimestamp()
  });
}

// ── Mark all unread as read ───────────────────────────────
export async function markAllAsRead(notifications) {
  const unread = notifications.filter(n => !n.read);
  await Promise.all(unread.map(n => markAsRead(n.id)));
}

// ── Count unread notifications ────────────────────────────
export function countUnread(notifications) {
  return notifications.filter(n => !n.read).length;
}

// ── Create notification (call from trusted client code) ───
export async function createNotification({
  userId, type, title, message, data = {},
  actionUrl = null, actionLabel = null
}) {
  await addDoc(collection(db, NOTIF_COL), {
    userId,
    type,
    title,
    message,
    data,
    read:        false,
    readAt:      null,
    createdAt:   serverTimestamp(),
    actionUrl,
    actionLabel
  });
}
