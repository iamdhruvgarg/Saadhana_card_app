import { useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
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
import {
  saveWeekData as fbSaveWeek,
  loadWeekData as fbLoadWeek,
  saveVaniProgress as fbSaveVani,
  loadVaniProgress as fbLoadVani,
} from '../firebase/firestore';

// ─── localStorage helpers (offline cache) ──────────────────

function weekKey(monday) {
  const d = new Date(monday);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `sadhana-${yyyy}-${mm}-${dd}`;
}

function weekId(monday) {
  const d = new Date(monday);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function loadWeekDataLocal(monday) {
  try {
    const stored = localStorage.getItem(weekKey(monday));
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return createEmptyWeekData();
}

function saveWeekDataLocal(monday, data) {
  try {
    localStorage.setItem(weekKey(monday), JSON.stringify(data));
  } catch { /* ignore */ }
}

function loadVaniLocal() {
  try {
    const stored = localStorage.getItem('sadhana-vani-progress');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {};
}

function saveVaniLocal(progress) {
  try {
    localStorage.setItem('sadhana-vani-progress', JSON.stringify(progress));
  } catch { /* ignore */ }
}

function loadNameLocal() {
  return localStorage.getItem('sadhana-devotee-name') || '';
}

function saveNameLocal(name) {
  localStorage.setItem('sadhana-devotee-name', name);
}

// ─── Reducer ───────────────────────────────────────────────

const initialState = (monday) => ({
  weekStart: monday,
  weekData: loadWeekDataLocal(monday),
  devoteeName: loadNameLocal(),
  vaniProgress: loadVaniLocal(),
  activeDay: DAYS[0],
  activeSection: 'NIDRA',
  firestoreLoaded: false,
});

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ACTIVITY': {
      const { day, activityId, value } = action.payload;
      const dayData = { ...state.weekData[day] };
      dayData[activityId] = dayData[activityId] === value ? null : value;
      const weekData = { ...state.weekData, [day]: dayData };
      return { ...state, weekData };
    }
    case 'SET_CUSTOM_VALUE': {
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
      const { day, activityId, note } = action.payload;
      const dayData = { ...state.weekData[day] };
      dayData[activityId + '_note'] = note || '';
      const weekData = { ...state.weekData, [day]: dayData };
      return { ...state, weekData };
    }
    case 'SET_DAY':
      return { ...state, activeDay: action.payload };
    case 'SET_SECTION':
      return { ...state, activeSection: action.payload };
    case 'SET_NAME':
      return { ...state, devoteeName: action.payload };
    case 'NAVIGATE_WEEK': {
      const offset = action.payload;
      const newMonday = new Date(state.weekStart);
      newMonday.setDate(newMonday.getDate() + offset * 7);
      return {
        ...state,
        weekStart: newMonday,
        weekData: loadWeekDataLocal(newMonday),
        firestoreLoaded: false,
      };
    }
    case 'LOAD_CLOUD_DATA': {
      const { weekData, devoteeName } = action.payload;
      return {
        ...state,
        weekData: weekData || state.weekData,
        devoteeName: devoteeName || state.devoteeName,
        firestoreLoaded: true,
      };
    }
    case 'TOGGLE_VANI_HEARD': {
      const lecId = action.payload;
      const prev = state.vaniProgress[lecId] || {};
      return {
        ...state,
        vaniProgress: {
          ...state.vaniProgress,
          [lecId]: { ...prev, heard: !prev.heard },
        },
      };
    }
    case 'SET_VANI_REMARK': {
      const { lecId, remarks } = action.payload;
      const prev = state.vaniProgress[lecId] || {};
      return {
        ...state,
        vaniProgress: {
          ...state.vaniProgress,
          [lecId]: { ...prev, remarks },
        },
      };
    }
    case 'LOAD_VANI_CLOUD': {
      return {
        ...state,
        vaniProgress: action.payload || state.vaniProgress,
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
  const activityWeeklyMarks = {};

  Object.keys(SECTIONS).forEach(s => {
    sectionScores[s] = { points: 0, max: 0 };
  });

  ACTIVITIES.forEach(activity => {
    const section = SECTIONS[activity.section];
    let weeklyPoints;

    if (activity.inputType) {
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

  DAYS.forEach(day => {
    let sevaMinutes = 0;
    SEVA_ACTIVITIES.forEach(s => {
      sevaMinutes += weekData[day]?.[s.id] || 0;
    });
    sectionScores.SEVA.points += sevaMinutes;
  });

  const dailyScores = {};
  DAYS.forEach((day) => {
    let dayBody = 0;
    let dayBodyMax = 0;
    let daySoul = 0;
    let daySoulMax = 0;

    ACTIVITIES.forEach(activity => {
      const section = SECTIONS[activity.section];
      const val = weekData[day]?.[activity.id];

      if (activity.inputType) {
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

const FIRESTORE_SAVE_DELAY = 2000; // debounce Firestore writes by 2s

export default function useSadhanaStore(uid) {
  const monday = useMemo(() => getMonday(new Date()), []);
  const [state, dispatch] = useReducer(reducer, monday, initialState);
  const weekSaveTimer = useRef(null);
  const vaniSaveTimer = useRef(null);

  // ─── Load from Firestore on mount + week change ───────
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    (async () => {
      const wId = weekId(state.weekStart);
      const result = await fbLoadWeek(uid, wId);
      if (cancelled) return;
      if (result && result.weekData) {
        dispatch({ type: 'LOAD_CLOUD_DATA', payload: result });
      }
    })();

    return () => { cancelled = true; };
  }, [uid, state.weekStart]);

  // Load vani progress from Firestore on mount
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    (async () => {
      const vani = await fbLoadVani(uid);
      if (cancelled) return;
      if (vani && Object.keys(vani).length > 0) {
        dispatch({ type: 'LOAD_VANI_CLOUD', payload: vani });
      }
    })();

    return () => { cancelled = true; };
  }, [uid]);

  // Compute scores
  const scores = useMemo(() => computeScores(state.weekData), [state.weekData]);

  // ─── Auto-save: localStorage (immediate) + Firestore (debounced) ──
  useEffect(() => {
    saveWeekDataLocal(state.weekStart, state.weekData);
    saveNameLocal(state.devoteeName);

    if (uid) {
      if (weekSaveTimer.current) clearTimeout(weekSaveTimer.current);
      weekSaveTimer.current = setTimeout(() => {
        const wId = weekId(state.weekStart);
        fbSaveWeek(uid, wId, state.weekData, scores, state.devoteeName);
      }, FIRESTORE_SAVE_DELAY);
    }

    return () => {
      if (weekSaveTimer.current) clearTimeout(weekSaveTimer.current);
    };
  }, [state.weekData, state.devoteeName, state.weekStart, uid, scores]);

  useEffect(() => {
    saveVaniLocal(state.vaniProgress);

    if (uid) {
      if (vaniSaveTimer.current) clearTimeout(vaniSaveTimer.current);
      vaniSaveTimer.current = setTimeout(() => {
        fbSaveVani(uid, state.vaniProgress);
      }, FIRESTORE_SAVE_DELAY);
    }

    return () => {
      if (vaniSaveTimer.current) clearTimeout(vaniSaveTimer.current);
    };
  }, [state.vaniProgress, uid]);

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

  const prevWeek = useCallback(() => {
    dispatch({ type: 'NAVIGATE_WEEK', payload: -1 });
  }, []);

  const nextWeek = useCallback(() => {
    dispatch({ type: 'NAVIGATE_WEEK', payload: 1 });
  }, []);

  const loadCloudData = useCallback((weekData, devoteeName) => {
    dispatch({ type: 'LOAD_CLOUD_DATA', payload: { weekData, devoteeName } });
  }, []);

  const toggleVaniHeard = useCallback((lecId) => {
    dispatch({ type: 'TOGGLE_VANI_HEARD', payload: lecId });
  }, []);

  const setVaniRemark = useCallback((lecId, remarks) => {
    dispatch({ type: 'SET_VANI_REMARK', payload: { lecId, remarks } });
  }, []);

  const loadVaniCloud = useCallback((vaniProgress) => {
    dispatch({ type: 'LOAD_VANI_CLOUD', payload: vaniProgress });
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
    loadCloudData,
    toggleVaniHeard,
    setVaniRemark,
    loadVaniCloud,
    prevWeek,
    nextWeek,
  };
}
