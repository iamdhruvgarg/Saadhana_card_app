/**
 * Sadhana Card — Activity Definitions
 * 
 * Complete data model for all 13 scored activities + 5 SEVA (unscored).
 * 
 * Two activity types:
 *  1. Pill-button: discrete options, points stored per day, summed weekly
 *  2. Custom-input: hours/minutes entered per day, marks computed from weekly total
 *
 * Body max: 525/week (NIDRA only — 3 × 25 × 7)
 * Soul max: computed dynamically from JAPA + PATHAN + COLLEGE
 */

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const SECTIONS = {
  NIDRA: {
    label: 'NIDRA',
    color: '#2E7D32',
    scoreType: 'body',
  },
  JAPA: {
    label: 'JAPA',
    color: '#E65100',
    scoreType: 'soul',
  },
  PATHAN: {
    label: 'PATHAN & SRAVANA',
    color: '#4A148C',
    scoreType: 'soul',
  },
  SEVA: {
    label: 'SEVA',
    color: '#00695C',
    scoreType: null, // no scoring
  },
  COLLEGE: {
    label: 'COLLEGE',
    color: '#1565C0',
    scoreType: 'soul',
  },
};

/**
 * Activity types:
 * 
 * PILL-BUTTON activity:
 *  - options: array of { label, value } — tap to select, tap again to deselect
 *  - maxPoints: max points per day
 *  - Weekly max = maxPoints × 7
 *
 * CUSTOM-INPUT activity:
 *  - inputType: 'hours' | 'minutes'
 *  - weeklyTarget: target value to achieve full marks (e.g., 5 hrs)
 *  - weeklyMaxMarks: marks awarded for meeting the weekly target
 *  - quickOptions: quick-select buttons
 *  - unit: display unit
 *  - Formula: weeklyMarks = min(weeklyMaxMarks, (weeklySum / weeklyTarget) * weeklyMaxMarks)
 */
export const ACTIVITIES = [
  // ─── NIDRA (Body) ────────────────────────────────────────
  {
    id: 'toBed',
    section: 'NIDRA',
    label: 'To Bed',
    maxPoints: 25,
    options: [
      { label: '≤ 9:15 PM', value: 25 },
      { label: '≤ 9:45 PM', value: 20 },
      { label: '≤ 10:00 PM', value: 15 },
      { label: '≤ 10:15 PM', value: 10 },
      { label: '≤ 10:30 PM', value: 5 },
      { label: '> 10:30 PM', value: 0 },
    ],
  },
  {
    id: 'wakeUp',
    section: 'NIDRA',
    label: 'Wake Up',
    maxPoints: 25,
    options: [
      { label: '≤ 3:30 AM', value: 25 },
      { label: '≤ 3:40 AM', value: 20 },
      { label: '≤ 3:50 AM', value: 15 },
      { label: '≤ 4:00 AM', value: 10 },
      { label: '≤ 4:10 AM', value: 5 },
      { label: '> 4:10 AM', value: 0 },
    ],
  },
  {
    id: 'daySleep',
    section: 'NIDRA',
    label: 'Day Sleep',
    maxPoints: 25,
    options: [
      { label: '≤ 30 min', value: 25 },
      { label: '≤ 60 min', value: 20 },
      { label: '≤ 70 min', value: 15 },
      { label: '≤ 80 min', value: 10 },
      { label: '≤ 90 min', value: 5 },
      { label: '> 90 min', value: 0 },
    ],
  },

  // ─── JAPA (Soul) ─────────────────────────────────────────
  {
    id: 'japa',
    section: 'JAPA',
    label: 'Japa Completion',
    maxPoints: 25,
    options: [
      { label: 'By 10 AM', value: 25 },
      { label: 'By 1 PM', value: 20 },
      { label: 'By 3 PM', value: 15 },
      { label: 'By 6 PM', value: 10 },
      { label: 'By 9 PM', value: 5 },
      { label: 'After 9 PM', value: 0 },
    ],
  },

  // ─── PATHAN & SRAVANA (Soul) ──────────────────────────────
  {
    id: 'spBook',
    section: 'PATHAN',
    label: 'SP Book Reading',
    inputType: 'hours',
    weeklyTarget: 5,        // 5 hours weekly
    weeklyMaxMarks: 70,     // 70 marks for full 5 hrs
    unit: 'hrs',
    step: 0.5,
    quickOptions: [0.5, 1, 1.5, 2],
    info: "Śrīla Prabhupāda's books. Enter hours read each day. Weekly target: 5 hrs → 70 marks.",
  },
  {
    id: 'morningClass',
    section: 'PATHAN',
    label: 'Morning Class',
    maxPoints: 5,
    options: [
      { label: 'On Time', value: 5 },
      { label: 'Late', value: 2 },
      { label: 'Absent', value: 0 },
    ],
  },
  {
    id: 'lectureHearing',
    section: 'PATHAN',
    label: 'Prescribed Lecture Hearing',
    inputType: 'hours',
    weeklyTarget: 2,        // 2 hours weekly
    weeklyMaxMarks: 35,     // 35 marks for full 2 hrs
    unit: 'hrs',
    step: 0.25,
    quickOptions: [0.25, 0.5, 1],
    info: 'Prescribed lectures — SP / SM / RSP. Enter hours heard each day. Weekly target: 2 hrs → 35 marks.',
  },
  {
    id: 'mangalArti',
    section: 'PATHAN',
    label: 'Sikshashtakam & Mangal Arti',
    maxPoints: 5,
    options: [
      { label: 'Yes', value: 5 },
      { label: 'No', value: 0 },
    ],
  },

  // ─── COLLEGE Studies & Cleanliness (Soul) ─────────────────
  {
    id: 'studySlot',
    section: 'COLLEGE',
    label: 'Completing Study Slot',
    inputType: 'hours',
    weeklyTarget: 10,       // 10 hours weekly
    weeklyMaxMarks: 50,     // 50 marks for full 10 hrs
    unit: 'hrs',
    step: 0.5,
    quickOptions: [1, 2, 3, 4],
    info: 'College/academic study. Enter hours studied each day. Weekly target: 10 hrs → 50 marks.',
  },
  {
    id: 'collegeClasses',
    section: 'COLLEGE',
    label: 'Attending College Classes',
    maxPoints: 4,
    options: [
      { label: 'Attentive', value: 4 },
      { label: 'Present', value: 2 },
      { label: 'Bunked', value: 0 },
    ],
  },
  {
    id: 'fillCard',
    section: 'COLLEGE',
    label: 'Filling Sadhna Card',
    maxPoints: 5,
    options: [
      { label: 'Yes', value: 5 },
      { label: 'No', value: 0 },
    ],
  },
  {
    id: 'cleanliness',
    section: 'COLLEGE',
    label: 'Cleanliness',
    maxPoints: 5,
    options: [
      { label: 'Yes', value: 5 },
      { label: 'No', value: 0 },
    ],
    info: 'Fresh dhoti/kurta, bath after clearing or more than one hour rest.',
  },
  {
    id: 'shlokaRecitation',
    section: 'COLLEGE',
    label: 'Shloka Recitation',
    inputType: 'minutes',
    weeklyTarget: 210,      // 30 min/day × 7 = 210 min weekly
    weeklyMaxMarks: 30,     // 30 marks for full 210 min
    unit: 'min',
    step: 5,
    quickOptions: [10, 15, 20, 30],
    info: 'Daily shloka practice. Enter minutes each day. Weekly target: 210 min (30 min/day) → 30 marks.',
  },
];

// ─── SEVA Activities (minutes/day, unscored) ──────────────
export const SEVA_ACTIVITIES = [
  { id: 'prasadamServing', label: 'Prasādam Serving' },
  { id: 'cleaningSeva', label: 'Cleaning Sevā' },
  { id: 'templeDeptServices', label: 'Temple Dept Services' },
  { id: 'followUpPreaching', label: 'Follow-up / Preaching / MMC' },
  { id: 'bhajanSandhya', label: 'Bhajan Sandhyā / Vaiṣṇava Songs' },
];

// ─── Scoring constants (dynamically computed) ─────────────

/**
 * Compute the weekly max points for a given score type ('body' or 'soul').
 * - Pill activities: maxPoints × 7
 * - Custom-input activities: weeklyMaxMarks
 */
function computeWeeklyMax(scoreType) {
  return ACTIVITIES.reduce((sum, a) => {
    const section = SECTIONS[a.section];
    if (section.scoreType !== scoreType) return sum;
    if (a.inputType) return sum + a.weeklyMaxMarks;
    return sum + (a.maxPoints * 7);
  }, 0);
}

export const MAX_BODY_WEEKLY = computeWeeklyMax('body'); // 525
export const MAX_SOUL_WEEKLY = computeWeeklyMax('soul'); // 528

// ─── Grade Ladder ─────────────────────────────────────────
export const GRADES = [
  { label: 'High Honors', threshold: 100 },
  { label: 'Honors', threshold: 95 },
  { label: 'Distinction', threshold: 90 },
  { label: 'First Class', threshold: 85 },
  { label: 'Pass', threshold: 80 },
];

/**
 * Compute grade from a percentage (0–100).
 * Returns the highest grade whose threshold is met, or null.
 */
export function getGrade(pct) {
  for (const grade of GRADES) {
    if (pct >= grade.threshold) return grade.label;
  }
  return pct > 0 ? 'Below Pass' : '—';
}

/**
 * Get activities filtered by section key.
 */
export function getActivitiesBySection(sectionKey) {
  return ACTIVITIES.filter(a => a.section === sectionKey);
}

/**
 * Compute weekly marks for a custom-input activity.
 * Formula: min(weeklyMaxMarks, (weeklySum / weeklyTarget) × weeklyMaxMarks)
 */
export function computeCustomMarks(activity, weeklySum) {
  if (!activity.inputType || !activity.weeklyTarget) return 0;
  const raw = (weeklySum / activity.weeklyTarget) * activity.weeklyMaxMarks;
  return Math.min(activity.weeklyMaxMarks, Math.round(raw * 10) / 10);
}

/**
 * Get weekly max for a single activity.
 */
export function getActivityWeeklyMax(activity) {
  if (activity.inputType) return activity.weeklyMaxMarks;
  return activity.maxPoints * 7;
}

/**
 * Create empty week data structure.
 */
export function createEmptyWeekData() {
  const data = {};
  DAYS.forEach(day => {
    data[day] = {};
    ACTIVITIES.forEach(a => {
      // Custom-input activities default to 0, pill activities to null
      data[day][a.id] = a.inputType ? 0 : null;
    });
    SEVA_ACTIVITIES.forEach(s => {
      data[day][s.id] = 0;
    });
  });
  return data;
}
