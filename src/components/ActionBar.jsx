import React from 'react';

const STATUS_ICONS = {
  idle: '🔄',
  syncing: '🔄',
  synced: '✅',
  error: '⚠️',
  'not-configured': '⚙',
};

export default function ActionBar({
  onSyncSheets,
  onExportCsv,
  onToggleGrid,
  gridVisible = false,
  syncStatus = 'idle',
}) {
  const statusIcon = STATUS_ICONS[syncStatus] ?? '🔄';
  const isSyncing = syncStatus === 'syncing';

  return (
    <>
      {/* ── Main bar ── */}
      <div className="action-bar">
        {/* Sync button */}
        <button
          className="action-btn action-btn--primary"
          onClick={onSyncSheets}
          disabled={isSyncing}
        >
          <span
            className={isSyncing ? 'action-icon-spin' : undefined}
            aria-hidden
          >
            {statusIcon}
          </span>{' '}
          Sync to Sheets
        </button>

        {/* Export CSV */}
        <button className="action-btn" onClick={onExportCsv}>
          📤 Export CSV
        </button>

        {/* Grid toggle — visible only ≥ 640px (hidden on mobile via CSS) */}
        <button
          className={
            'action-btn' + (gridVisible ? ' action-btn--active' : '')
          }
          onClick={onToggleGrid}
        >
          📊 Grid
        </button>
      </div>

      {/* ── Floating grid toggle — visible only < 640px ── */}
      <button
        className={
          'grid-toggle-fab' + (gridVisible ? ' action-btn--active' : '')
        }
        onClick={onToggleGrid}
        aria-label="Toggle week grid"
      >
        📊
      </button>
    </>
  );
}
