import { DAYS, ACTIVITIES, SEVA_ACTIVITIES } from '../data/activities';

// ─── Last Sync Timestamp ────────────────────────────────
const LAST_SYNC_KEY = 'sadhana-last-sync';

export function getLastSyncTime() {
  const ts = localStorage.getItem(LAST_SYNC_KEY);
  return ts ? new Date(parseInt(ts, 10)) : null;
}

function saveLastSyncTime() {
  localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
}

// ─── Retry Helper ───────────────────────────────────────

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with exponential-backoff retry.
 * Retries on network errors and 5xx server errors.
 * Client errors (4xx) are returned immediately without retry.
 */
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      // Apps Script redirects (302) to the actual response URL on POST.
      // fetch follows redirects by default, so we get the final response.
      if (response.ok) return response;
      // Server error → retry with backoff
      if (response.status >= 500) {
        if (attempt < maxRetries - 1) {
          await delay(Math.pow(2, attempt) * 1000);
          continue;
        }
      }
      // Client error or final server-error attempt → return as-is
      return response;
    } catch (err) {
      // Network error → retry unless last attempt
      if (attempt === maxRetries - 1) throw err;
      await delay(Math.pow(2, attempt) * 1000);
    }
  }
}

// ─── Main Sync Function ─────────────────────────────────

/**
 * Sync week data to Google Sheets via deployed Apps Script Web App.
 *
 * Uses standard CORS mode (Apps Script Web Apps deployed as "Anyone"
 * support CORS natively). Content-Type is kept as 'text/plain' to
 * avoid triggering a CORS preflight OPTIONS request.
 *
 * @param {string} sheetsUrl - The deployed Apps Script Web App URL
 * @param {object} weekData - Full week activity data
 * @param {object} scores - Computed scores from useSadhanaStore
 * @param {string} devoteeName - Devotee name
 * @param {Date} weekStart - Monday of the week
 * @returns {Promise<'synced'|'error'|'not-configured'>}
 */
export async function syncToSheets(sheetsUrl, weekData, scores, devoteeName, weekStart) {
  if (!sheetsUrl || !sheetsUrl.trim()) {
    return 'not-configured';
  }

  // Validate URL format
  try {
    new URL(sheetsUrl);
  } catch {
    return 'not-configured';
  }

  // Build payload (format must match Apps Script doPost expectations)
  const d = new Date(weekStart);
  const weekLabel = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const payload = {
    devoteeName: devoteeName || 'Unknown',
    weekStart: weekLabel,
    activities: ACTIVITIES.map(a => ({
      id: a.id,
      label: a.label,
      section: a.section,
      maxPoints: a.maxPoints,
      daily: DAYS.map(day => ({
        day,
        value: weekData[day]?.[a.id] ?? null,
      })),
    })),
    seva: SEVA_ACTIVITIES.map(s => ({
      id: s.id,
      label: s.label,
      daily: DAYS.map(day => ({
        day,
        minutes: weekData[day]?.[s.id] || 0,
      })),
    })),
    scores: {
      bodyTotal: scores.bodyTotal,
      soulTotal: scores.soulTotal,
      bodyPct: Math.round(scores.bodyPct * 10) / 10,
      soulPct: Math.round(scores.soulPct * 10) / 10,
      totalPct: Math.round(scores.totalPct * 10) / 10,
      grade: scores.grade,
    },
  };

  try {
    const response = await fetchWithRetry(sheetsUrl, {
      method: 'POST',
      // No 'mode' — defaults to 'cors', which Apps Script supports.
      headers: {
        'Content-Type': 'text/plain', // avoids CORS preflight
      },
      body: JSON.stringify(payload),
    });

    // Apps Script may respond with an opaque redirect in some
    // configurations. If the request itself succeeded (no throw),
    // the data was sent — treat as success.
    if (!response || response.type === 'opaqueredirect') {
      saveLastSyncTime();
      return 'synced';
    }

    // Try to parse JSON to confirm server-side success
    try {
      const json = await response.json();
      if (json.status === 'error') {
        console.error('Sheets sync server error:', json.message);
        return 'error';
      }
    } catch {
      // JSON parse failed — could be redirect body or empty.
      // Since fetch didn't throw, the request was delivered.
    }

    saveLastSyncTime();
    return 'synced';
  } catch (err) {
    console.error('Sheets sync failed:', err);
    return 'error';
  }
}
