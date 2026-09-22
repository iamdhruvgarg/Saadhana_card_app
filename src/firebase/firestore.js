import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

// ─── Week Data (Sadhana Card) ─────────────────────────────

function weekDocRef(uid, weekId) {
  return doc(db, 'users', uid, 'sadhana', weekId);
}

export async function saveWeekData(uid, weekId, weekData, scores, devoteeName) {
  try {
    await setDoc(weekDocRef(uid, weekId), {
      weekData,
      scores: {
        bodyTotal: scores.bodyTotal,
        soulTotal: scores.soulTotal,
        bodyPct: Math.round(scores.bodyPct * 10) / 10,
        soulPct: Math.round(scores.soulPct * 10) / 10,
        totalPct: Math.round(scores.totalPct * 10) / 10,
        grade: scores.grade,
      },
      devoteeName: devoteeName || '',
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save week data:', err);
    return false;
  }
}

export async function loadWeekData(uid, weekId) {
  try {
    const snap = await getDoc(weekDocRef(uid, weekId));
    if (snap.exists()) {
      const data = snap.data();
      return {
        weekData: data.weekData || null,
        devoteeName: data.devoteeName || '',
      };
    }
    return null;
  } catch (err) {
    console.error('Failed to load week data:', err);
    return null;
  }
}

// ─── Vani Progress ────────────────────────────────────────

function vaniDocRef(uid) {
  return doc(db, 'users', uid, 'vani', 'progress');
}

export async function saveVaniProgress(uid, vaniProgress) {
  try {
    await setDoc(vaniDocRef(uid), {
      progress: vaniProgress,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save vani progress:', err);
    return false;
  }
}

export async function loadVaniProgress(uid) {
  try {
    const snap = await getDoc(vaniDocRef(uid));
    if (snap.exists()) {
      return snap.data().progress || {};
    }
    return {};
  } catch (err) {
    console.error('Failed to load vani progress:', err);
    return {};
  }
}

// ─── User Profile ─────────────────────────────────────────

function profileDocRef(uid) {
  return doc(db, 'users', uid, 'profile', 'info');
}

export async function saveUserProfile(uid, user) {
  try {
    await setDoc(profileDocRef(uid), {
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      lastLogin: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save profile:', err);
  }
}

// ─── Settings ─────────────────────────────────────────────

function settingsDocRef(uid) {
  return doc(db, 'users', uid, 'settings', 'config');
}

export async function saveSettings(uid, settings) {
  try {
    await setDoc(settingsDocRef(uid), {
      ...settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export async function loadSettings(uid) {
  try {
    const snap = await getDoc(settingsDocRef(uid));
    if (snap.exists()) return snap.data();
    return {};
  } catch (err) {
    console.error('Failed to load settings:', err);
    return {};
  }
}
