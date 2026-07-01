import { DAYS, ACTIVITIES, SEVA_ACTIVITIES } from '../data/activities';

/**
 * Export the current week's data as a CSV file.
 * Columns: Day, then each of the 13 scored activities, then 5 SEVA activities,
 * then Body Score, Soul Score, Total Score.
 */
export function exportCsv(weekData, scores, devoteeName, weekStart) {
  const headers = [
    'Day',
    ...ACTIVITIES.map(a => a.label),
    ...SEVA_ACTIVITIES.map(s => `${s.label} (min)`),
    'Body Score',
    'Soul Score',
    'Day Total',
  ];

  const rows = DAYS.map(day => {
    const dayData = weekData[day] || {};
    const ds = scores.dailyScores[day] || {};
    
    return [
      day,
      ...ACTIVITIES.map(a => {
        const val = dayData[a.id];
        return val !== null && val !== undefined ? val : '';
      }),
      ...SEVA_ACTIVITIES.map(s => dayData[s.id] || 0),
      ds.body || 0,
      ds.soul || 0,
      ds.total || 0,
    ];
  });

  // Totals row
  const totalsRow = [
    'TOTAL',
    ...ACTIVITIES.map(a => {
      let sum = 0;
      DAYS.forEach(day => {
        const val = weekData[day]?.[a.id];
        if (val !== null && val !== undefined) sum += val;
      });
      return sum;
    }),
    ...SEVA_ACTIVITIES.map(s => {
      let sum = 0;
      DAYS.forEach(day => {
        sum += weekData[day]?.[s.id] || 0;
      });
      return sum;
    }),
    scores.bodyTotal,
    scores.soulTotal,
    scores.bodyTotal + scores.soulTotal,
  ];

  // Grade row
  const gradeRow = [
    'GRADE',
    `Body: ${scores.bodyPct.toFixed(1)}%`,
    `Soul: ${scores.soulPct.toFixed(1)}%`,
    `Total: ${scores.totalPct.toFixed(1)}%`,
    scores.grade,
    ...Array(headers.length - 5).fill(''),
  ];

  const allRows = [headers, ...rows, totalsRow, gradeRow];
  
  const csvContent = allRows
    .map(row => row.map(cell => {
      const str = String(cell);
      // Escape cells containing commas, quotes, or newlines
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(','))
    .join('\n');

  // Format date for filename
  const d = new Date(weekStart);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const safeName = (devoteeName || 'devotee').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `sadhana-${safeName}-${dateStr}.csv`;

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
