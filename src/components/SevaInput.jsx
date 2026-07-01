import { useState } from 'react';

/**
 * SevaInput — renders a single SEVA activity with number input + quick-select pills + note.
 * 
 * Props:
 *  - seva: { id, label }
 *  - minutes: current value (number)
 *  - onMinutesChange: (sevaId, minutes) => void
 *  - weeklyTotal: total minutes for this seva across the week
 *  - note: current note string
 *  - onNoteChange: (sevaId, noteText) => void
 */
const QUICK_OPTIONS = [15, 30, 45, 60];

export default function SevaInput({ seva, minutes, onMinutesChange, weeklyTotal, note, onNoteChange }) {
  const [showNote, setShowNote] = useState(false);
  const hasNote = note && note.trim().length > 0;

  const handleQuickSelect = (val) => {
    const newVal = minutes === val ? 0 : val;
    onMinutesChange(seva.id, newVal);
  };

  return (
    <div className="seva-card">
      <div className="seva-card-header">
        <span className="seva-card-label">{seva.label}</span>
        <div className="activity-card-actions">
          <span className="seva-card-weekly">{weeklyTotal} min/week</span>
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

      {showNote && (
        <div className="note-box">
          <textarea
            className="note-textarea"
            value={note || ''}
            onChange={(e) => onNoteChange(seva.id, e.target.value)}
            placeholder="Add a note for today..."
            rows={2}
          />
        </div>
      )}

      <div className="seva-card-controls">
        <div className="seva-input-wrap">
          <input
            type="number"
            className="seva-input"
            value={minutes || ''}
            onChange={(e) => {
              const num = parseInt(e.target.value, 10);
              onMinutesChange(seva.id, isNaN(num) ? 0 : Math.max(0, num));
            }}
            min="0"
            max="480"
            placeholder="0"
            data-seva-id={seva.id}
          />
          <span className="seva-input-suffix">min</span>
        </div>
        <div className="seva-quick-pills">
          {QUICK_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`pill-btn pill-btn--seva ${minutes === opt ? 'pill-btn--selected pill-btn--seva-selected' : ''}`}
              onClick={() => handleQuickSelect(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
