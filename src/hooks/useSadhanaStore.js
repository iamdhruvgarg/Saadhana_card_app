import { useReducer, useEffect, useCallback, useMemo } from 'react';
import {
  DAYS,
  ACTIVITIES,
  SEVA_ACTIVITIES,
  SECTIONS,
  MAX_BODY_WEEKLY,
  MAX_SOUL_WEEKLY,
  getGrade,
  createEmptyWeekData,
  computeCustomMarks,
  getActivityWeeklyMax,
} from '../data/activities';

// ─── localStorage helpers ──────────────────────────────────

const DEVOTEE_NAME_KEY = 'sadhana-devotee-name';
const SHEETS_URL_KEY = 'sadhana-sheets-url';
const LAST_SYNC_KEY = 'sadhana-last-sync';

function weekKey(monday) {
  const d = new Date(monday);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `sadhana-${yyyy}-${mm}-${dd}`;
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function loadWeekData(monday) {
  try {
    const stored = localStorage.getItem(weekKey(monday));
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return createEmptyWeekData();
}

function saveWeekData(monday, data) {
  try {
    localStorage.setItem(weekKey(monday), JSON.stringify(data));
  } catch { /* ignore */ }
}

function loadDevoteeName() {
  return localStorage.getItem(DEVOTEE_NAME_KEY) || '';
}

function saveDevoteeName(name) {
  localStorage.setItem(DEVOTEE_NAME_KEY, name);
}

export function loadSheetsUrl() {
  return localStorage.getItem(SHEETS_URL_KEY) || '';
}

export function saveSheetsUrl(url) {
  localStorage.setItem(SHEETS_URL_KEY, url);
}

function loadLastSyncTime() {
  const ts = localStorage.getItem(LAST_SYNC_KEY);
  return ts ? new Date(parseInt(ts, 10)) : null;
}

function saveLastSyncTime(time) {
  if (time) {
    localStorage.setItem(LAST_SYNC_KEY, String(time.getTime()));
  }
}

// ─── Reducer ───────────────────────────────────────────────

const initialState = (monday) => ({
  weekStart: monday,
  weekData: loadWeekData(monday),
  devoteeName: loadDevoteeName(),
  sheetsUrl: loadSheetsUrl(),
  lastSyncTime: loadLastSyncTime(),
  activeDay: DAYS[0],
  activeSection: 'NIDRA',
});

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ACTIVITY': {
      // For pill-button activities: toggle (tap same value to deselect)
      const { day, activityId, value } = action.payload;
      const dayData = { ...state.weekData[day] };
      dayData[activityId] = dayData[activityId] === value ? null : value;
      const weekData = { ...state.weekData, [day]: dayData };
      return { ...state, weekData };
    }
    case 'SET_CUSTOM_VALUE': {
      // For custom-input activities: set raw hours/minutes value
      const { day, activityId, value } = action.payload;
      const dayData = { ...state.weekData[day] };
      dayData[activityId] = Math.max(0, Number(value) || 0);
      const weekData = { ...state.weekData, [day]: dayData };
      return { ...state, weekData };
    }
    case 'SET_SEVA': {
      const { day, sevaId, minutes } = action.payload;
      const dayData = { ...state.weekData[day] };
      dayData[sevaId] = Math.max(0, Number(minutes) || 0);
      const weekData = { ...state.weekData, [day]: dayData };
      return { ...state, weekData };
    }
    case 'SET_NOTE': {
      // Store notes as activityId_note in the day data
      const { day, activityId, note } = action.payload;
      const dayData = { ...state.weekData[day] };
      const noteKey = activityId + '_note';
      dayData[noteKey] = note || '';
      const weekData = { ...state.weekData, [day]: dayData };
      return { ...state, weekData };
    }
    case 'SET_DAY':
      return { ...state, activeDay: action.payload };
    case 'SET_SECTION':
      return { ...state, activeSection: action.payload };
    case 'SET_NAME':
      return { ...state, devoteeName: action.payload };
    case 'SET_SHEETS_URL':
      return { ...state, sheetsUrl: action.payload };
    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };
    case 'NAVIGATE_WEEK': {
      const offset = action.payload; // -1 or +1
      const newMonday = new Date(state.weekStart);
      newMonday.setDate(newMonday.getDate() + offset * 7);
      return {
        ...state,
        weekStart: newMonday,
        weekData: loadWeekData(newMonday),
      };
    }
    default:
      return state;
  }
}

// ─── Score computation ─────────────────────────────────────

function computeScores(weekData) {
  let bodyTotal = 0;
  let soulTotal = 0;
  const sectionScores = {};
  const activityWeeklyMarks = {}; // stores computed weekly marks per activity

  // Initialize section scores
  Object.keys(SECTIONS).forEach(s => {
    sectionScores[s] = { points: 0, max: 0 };
  });

  // Compute weekly marks per activity
  ACTIVITIES.forEach(activity => {
    const section = SECTIONS[activity.section];
    let weeklyPoints;

    if (activity.inputType) {
      // Custom-input: compute from weekly total of raw values
      let weeklySum = 0;
      DAYS.forEach(day => {
        weeklySum += Number(weekData[day]?.[activity.id]) || 0;
      });
      weeklyPoints = computeCustomMarks(activity, weeklySum);
      activityWeeklyMarks[activity.id] = {
        weeklySum,
        marks: weeklyPoints,
        maxMarks: activity.weeklyMaxMarks,
        target: activity.weeklyTarget,
      };
    } else {
      // Pill-button: sum daily selected values
      weeklyPoints = 0;
      DAYS.forEach(day => {
        const val = weekData[day]?.[activity.id];
        if (val !== null && val !== undefined) weeklyPoints += val;
      });
      activityWeeklyMarks[activity.id] = {
        marks: weeklyPoints,
        maxMarks: activity.maxPoints * 7,
      };
    }

    if (section.scoreType === 'body') {
      bodyTotal += weeklyPoints;
    } else if (section.scoreType === 'soul') {
      soulTotal += weeklyPoints;
    }

    sectionScores[activity.section].points += weeklyPoints;
    sectionScores[activity.section].max += getActivityWeeklyMax(activity);
  });

  // SEVA totals (minutes, no scoring)
  DAYS.forEach(day => {
    let sevaMinutes = 0;
    SEVA_ACTIVITIES.forEach(s => {
      sevaMinutes += weekData[day]?.[s.id] || 0;
    });
    sectionScores.SEVA.points += sevaMinutes;
  });

  // Daily scores (for progress bars)
  const dailyScores = {};
  DAYS.forEach((day, _i) => {
    let dayBody = 0;
    let dayBodyMax = 0;
    let daySoul = 0;
    let daySoulMax = 0;

    ACTIVITIES.forEach(activity => {
      const section = SECTIONS[activity.section];
      const val = weekData[day]?.[activity.id];

      if (activity.inputType) {
        // For custom-input activities: compute daily contribution as proportion
        const dailyTarget = activity.weeklyTarget / 7;
        const dailyMax = activity.weeklyMaxMarks / 7;
        const rawVal = Number(val) || 0;
        const dailyEquiv = Math.min(dailyMax, (rawVal / dailyTarget) * dailyMax);

        if (section.scoreType === 'body') {
          dayBody += dailyEquiv;
          dayBodyMax += dailyMax;
        } else if (section.scoreType === 'soul') {
          daySoul += dailyEquiv;
          daySoulMax += dailyMax;
        }
      } else {
        // Pill-button
        const points = val !== null && val !== undefined ? val : 0;
        if (section.scoreType === 'body') {
          dayBody += points;
          dayBodyMax += activity.maxPoints;
        } else if (section.scoreType === 'soul') {
          daySoul += points;
          daySoulMax += activity.maxPoints;
        }
      }
    });

    let sevaMinutes = 0;
    SEVA_ACTIVITIES.forEach(s => {
      sevaMinutes += weekData[day]?.[s.id] || 0;
    });

    dailyScores[day] = {
      body: dayBody,
      bodyMax: dayBodyMax,
      soul: daySoul,
      soulMax: daySoulMax,
      total: dayBody + daySoul,
      totalMax: dayBodyMax + daySoulMax,
      sevaMinutes,
    };
  });

  const bodyPct = MAX_BODY_WEEKLY > 0 ? (bodyTotal / MAX_BODY_WEEKLY) * 100 : 0;
  const soulPct = MAX_SOUL_WEEKLY > 0 ? (soulTotal / MAX_SOUL_WEEKLY) * 100 : 0;
  const totalPct = (bodyPct + soulPct) / 2;

  return {
    bodyTotal,
    soulTotal,
    bodyPct,
    soulPct,
    totalPct,
    grade: getGrade(totalPct),
    dailyScores,
    sectionScores,
    activityWeeklyMarks,
  };
}

// ─── Hook ──────────────────────────────────────────────────

export default function useSadhanaStore() {
  const monday = useMemo(() => getMonday(new Date()), []);
  const [state, dispatch] = useReducer(reducer, monday, initialState);

  // Auto-save week data on change
  useEffect(() => {
    saveWeekData(state.weekStart, state.weekData);
  }, [state.weekData, state.weekStart]);

  // Auto-save devotee name on change
  useEffect(() => {
    saveDevoteeName(state.devoteeName);
  }, [state.devoteeName]);

  // Auto-save sheets URL on change
  useEffect(() => {
    saveSheetsUrl(state.sheetsUrl);
  }, [state.sheetsUrl]);

  // Auto-save lastSyncTime on change
  useEffect(() => {
    saveLastSyncTime(state.lastSyncTime);
  }, [state.lastSyncTime]);

  // Compute scores
  const scores = useMemo(() => computeScores(state.weekData), [state.weekData]);

  // Day info for DayTabs
  const dayInfos = useMemo(() => {
    return DAYS.map((day, i) => {
      const date = new Date(state.weekStart);
      date.setDate(date.getDate() + i);
      const ds = scores.dailyScores[day];
      const progress = ds && ds.totalMax > 0 ? ds.total / ds.totalMax : 0;
      return {
        key: day,
        date: date.getDate(),
        fullDate: date,
        progress,
      };
    });
  }, [state.weekStart, scores.dailyScores]);

  // Section info for SectionTabs
  const sectionInfos = useMemo(() => {
    return Object.entries(SECTIONS).map(([key, sec]) => {
      const ss = scores.sectionScores[key];
      return {
        key,
        label: sec.label,
        color: sec.color,
        score: ss?.points || 0,
        maxScore: key === 'SEVA' ? null : ss?.max || 0,
      };
    });
  }, [scores.sectionScores]);

  // Actions
  const setActivity = useCallback((day, activityId, value) => {
    dispatch({ type: 'SET_ACTIVITY', payload: { day, activityId, value } });
  }, []);

  const setCustomValue = useCallback((day, activityId, value) => {
    dispatch({ type: 'SET_CUSTOM_VALUE', payload: { day, activityId, value } });
  }, []);

  const setSeva = useCallback((day, sevaId, minutes) => {
    dispatch({ type: 'SET_SEVA', payload: { day, sevaId, minutes } });
  }, []);

  const setNote = useCallback((day, activityId, note) => {
    dispatch({ type: 'SET_NOTE', payload: { day, activityId, note } });
  }, []);

  const setDay = useCallback((day) => {
    dispatch({ type: 'SET_DAY', payload: day });
  }, []);

  const setSection = useCallback((section) => {
    dispatch({ type: 'SET_SECTION', payload: section });
  }, []);

  const setName = useCallback((name) => {
    dispatch({ type: 'SET_NAME', payload: name });
  }, []);

  const setSheetsUrl = useCallback((url) => {
    dispatch({ type: 'SET_SHEETS_URL', payload: url });
  }, []);

  const setLastSyncTime = useCallback((time) => {
    dispatch({ type: 'SET_LAST_SYNC_TIME', payload: time });
  }, []);

  const prevWeek = useCallback(() => {
    dispatch({ type: 'NAVIGATE_WEEK', payload: -1 });
  }, []);

  const nextWeek = useCallback(() => {
    dispatch({ type: 'NAVIGATE_WEEK', payload: 1 });
  }, []);

  return {
    ...state,
    scores,
    dayInfos,
    sectionInfos,
    setActivity,
    setCustomValue,
    setSeva,
    setNote,
    setDay,
    setSection,
    setName,
    setSheetsUrl,
    setLastSyncTime,
    prevWeek,
    nextWeek,
  };
}
