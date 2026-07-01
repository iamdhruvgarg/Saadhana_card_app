import { useState } from 'react';
import { SECTIONS } from '../data/activities';

/**
 * ActivityCard — renders a single activity with pill-buttons or custom-input,
 * plus an optional per-day note box.
 *
 * Props:
 *  - activity: activity definition object
 *  - selectedValue: current value for this day
 *  - onSelect: (activityId, value) => void — for pill buttons
 *  - onCustomChange: (activityId, value) => void — for custom inputs
 *  - weeklyInfo: { weeklySum, marks, maxMarks, target } — for custom inputs
 *  - note: current note string for this day
 *  - onNoteChange: (activityId, noteText) => void
 */
export default function ActivityCard({
  activity,
  selectedValue,
  onSelect,
  onCustomChange,
  weeklyInfo,
  note,
  onNoteChange,
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const sectionColor = SECTIONS[activity.section]?.color || '#666';
  const isCustom = !!activity.inputType;
  const hasNote = note && note.trim().length > 0;

  // Note box (shared between both modes)
  const noteBox = (
    <>
      <button
        className={`note-toggle-btn ${hasNote ? 'note-toggle-btn--has-note' : ''}`}
        onClick={() => setShowNote(v => !v)}
        type="button"
        title={hasNote ? 'View/edit note' : 'Add a note'}
      >
        📝 {hasNote ? '' : ''}
      </button>
      {showNote && (
        <div className="note-box">
          <textarea
            className="note-textarea"
            value={note || ''}
            onChange={(e) => onNoteChange(activity.id, e.target.value)}
            placeholder="Add a note for today..."
            rows={2}
          />
        </div>
      )}
    </>
  );

  // ─── Custom Input Mode ───────────────────────────────
  if (isCustom) {
    const rawValue = Number(selectedValue) || 0;
    const wk = weeklyInfo || { weeklySum: 0, marks: 0, maxMarks: activity.weeklyMaxMarks, target: activity.weeklyTarget };
    const pct = wk.target > 0 ? Math.min(100, (wk.weeklySum / wk.target) * 100) : 0;

    return (
      <div className="activity-card">
        <div className="activity-card-header">
          <span className="activity-card-label">
            {activity.label}
            {activity.info && (
              <button
                className="info-btn"
                onClick={() => setShowInfo(v => !v)}
                type="button"
                aria-label="Info"
              >
                ⓘ
              </button>
            )}
          </span>
          <div className="activity-card-actions">
            <span className="activity-card-points" style={{ color: sectionColor }}>
              {Math.round(wk.marks * 10) / 10} / {wk.maxMarks}
            </span>
            {noteBox}
          </div>
        </div>

        {showInfo && activity.info && (
          <div className="info-tooltip">{activity.info}</div>
        )}

        {showNote && (
          <div className="note-box">
            <textarea
              className="note-textarea"
              value={note || ''}
              onChange={(e) => onNoteChange(activity.id, e.target.value)}
              placeholder="Add a note for today..."
              rows={2}
            />
          </div>
        )}

        <div className="custom-input-row">
          <div className="custom-input-wrap">
            <input
              type="number"
              className="custom-input"
              value={rawValue || ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onCustomChange(activity.id, isNaN(v) ? 0 : Math.max(0, v));
              }}
              min="0"
              step={activity.step || 0.5}
              placeholder="0"
            />
            <span className="custom-input-unit">{activity.unit}</span>
          </div>

          <div className="seva-quick-pills">
            {(activity.quickOptions || []).map(opt => (
              <button
                key={opt}
                type="button"
                className={`pill-btn pill-btn--quick ${rawValue === opt ? 'pill-btn--selected' : ''}`}
                style={rawValue === opt ? { backgroundColor: sectionColor, borderColor: sectionColor, color: '#fff' } : {}}
                onClick={() => {
                  const newVal = rawValue === opt ? 0 : opt;
                  onCustomChange(activity.id, newVal);
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly progress bar */}
        <div className="weekly-progress">
          <div className="weekly-progress-bar">
            <div
              className="weekly-progress-fill"
              style={{
                width: `${Math.min(100, pct)}%`,
                backgroundColor: sectionColor,
              }}
            />
          </div>
          <span className="weekly-progress-text">
            {Math.round(wk.weeklySum * 100) / 100} / {wk.target} {activity.unit} this week
          </span>
        </div>
      </div>
    );
  }

  // ─── Pill Button Mode ────────────────────────────────
  return (
    <div className="activity-card">
      <div className="activity-card-header">
        <span className="activity-card-label">
          {activity.label}
          {activity.info && (
            <button
              className="info-btn"
              onClick={() => setShowInfo(v => !v)}
              type="button"
              aria-label="Info"
            >
              ⓘ
            </button>
          )}
        </span>
        <div className="activity-card-actions">
          <span className="activity-card-points" style={{ color: sectionColor }}>
            {selectedValue !== null && selectedValue !== undefined ? selectedValue : '—'} / {activity.maxPoints}
          </span>
          <button
            className={`note-toggle-btn ${hasNote ? 'note-toggle-btn--has-note' : ''}`}
            onClick={() => setShowNote(v => !v)}
            type="button"
            title={hasNote ? 'View/edit note' : 'Add a note'}
          >
            📝
          </button>
        </div>
      </div>

      {showInfo && activity.info && (
        <div className="info-tooltip">{activity.info}</div>
      )}

      {showNote && (
        <div className="note-box">
          <textarea
            className="note-textarea"
            value={note || ''}
            onChange={(e) => onNoteChange(activity.id, e.target.value)}
            placeholder="Add a note for today..."
            rows={2}
          />
        </div>
      )}

      <div className="activity-card-pills">
        {activity.options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <button
              key={opt.label}
              className={`pill-btn ${isSelected ? 'pill-btn--selected' : ''}`}
              style={isSelected ? {
                backgroundColor: sectionColor,
                borderColor: sectionColor,
                color: '#fff',
              } : {}}
              onClick={() => onSelect(activity.id, opt.value)}
              type="button"
              aria-pressed={isSelected}
            >
              <span className="pill-btn-label">{opt.label}</span>
              <span className="pill-btn-value">{opt.value} pt{opt.value !== 1 ? 's' : ''}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
