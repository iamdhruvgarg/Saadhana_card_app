import React from 'react';

function cellClass(value, maxPoints) {
  if (value === null || value === undefined) return 'week-grid-cell week-grid-cell--empty';
  if (value === 0) return 'week-grid-cell week-grid-cell--zero';
  if (value >= maxPoints) return 'week-grid-cell week-grid-cell--full';
  return 'week-grid-cell week-grid-cell--partial';
}

export default function WeekGrid({
  weekData = {},
  activities = [],
  sevaActivities = [],
  days = [],
  visible = true,
}) {
  if (!visible) return null;

  // Helper to safely read a cell value
  const cell = (day, id) =>
    weekData[day] != null ? weekData[day][id] ?? null : null;

  return (
    <div className="week-grid">
      <table className="week-grid-table">
        <thead>
          <tr>
            <th className="week-grid-header">Activity</th>
            {days.map((d) => (
              <th key={d} className="week-grid-header">
                {d}
              </th>
            ))}
            <th className="week-grid-header">Total</th>
          </tr>
        </thead>

        <tbody>
          {/* ── Scored activities ── */}
          {activities.map((act) => {
            let rowTotal = 0;
            return (
              <tr key={act.id}>
                <td className="week-grid-cell">{act.label}</td>
                {days.map((d) => {
                  const v = cell(d, act.id);
                  if (v !== null) rowTotal += v;
                  return (
                    <td key={d} className={cellClass(v, act.maxPoints)}>
                      {v !== null ? v : '—'}
                    </td>
                  );
                })}
                <td className="week-grid-cell">{rowTotal}</td>
              </tr>
            );
          })}

          {/* ── SEVA rows (unscored, minutes) ── */}
          {sevaActivities.map((seva) => {
            let rowTotal = 0;
            return (
              <tr key={seva.id}>
                <td className="week-grid-cell week-grid-cell--seva">
                  {seva.label}
                </td>
                {days.map((d) => {
                  const v = cell(d, seva.id);
                  const mins = v ?? 0;
                  rowTotal += mins;
                  return (
                    <td key={d} className="week-grid-cell week-grid-cell--seva">
                      {mins > 0 ? `${mins}m` : '—'}
                    </td>
                  );
                })}
                <td className="week-grid-cell week-grid-cell--seva">
                  {rowTotal > 0 ? `${rowTotal}m` : '—'}
                </td>
              </tr>
            );
          })}

          {/* ── Column totals ── */}
          <tr>
            <td className="week-grid-header">Day Total</td>
            {days.map((d) => {
              let colTotal = 0;
              activities.forEach((act) => {
                const v = cell(d, act.id);
                if (v !== null) colTotal += v;
              });
              return (
                <td key={d} className="week-grid-header">
                  {colTotal}
                </td>
              );
            })}
            <td className="week-grid-header">
              {/* Grand total */}
              {activities.reduce((sum, act) => {
                days.forEach((d) => {
                  const v = cell(d, act.id);
                  if (v !== null) sum += v;
                });
                return sum;
              }, 0)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
