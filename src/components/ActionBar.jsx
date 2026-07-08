import React from 'react';

const STATUS_ICONS = {
  idle: '🔄',
  syncing: '🔄',
  synced: '✅',
  error: '⚠️',
  'not-configured': '⚙',
};

const LOAD_STATUS_MSG = {
  loading: '☁️ Loading from cloud...',
  loaded: '✅ Data restored from cloud!',
  'not-found': '📭 No cloud backup for this week',
  error: '⚠️ Failed to load from cloud',
};

export default function ActionBar({
  onSyncSheets,
  onExportCsv,
  onToggleGrid,
  onLoadFromCloud,
  gridVisible = false,
  syncStatus = 'idle',
  loadStatus = 'idle',
}) {
  const statusIcon = STATUS_ICONS[syncStatus] ?? '🔄';
  const isSyncing = syncStatus === 'syncing';
  const isLoading = loadStatus === 'loading';
  const loadMsg = LOAD_STATUS_MSG[loadStatus];

  return (
    <>
      {/* ── Load status feedback ── */}
      {loadMsg && (
        <div className="action-status-msg" key={loadStatus}>
          {loadMsg}
        </div>
      )}

      {/* ── Main bar ── */}
      <div className="action-bar">
        {/* Sync button */}
        <button
          className="action-btn action-btn--primary"
          onClick={onSyncSheets}
          disabled={isSyncing || isLoading}
        >
          <span
            className={isSyncing ? 'action-icon-spin' : undefined}
            aria-hidden
          >
            {statusIcon}
          </span>{' '}
          Sync to Sheets
        </button>

        {/* Load from Cloud */}
        <button
          className="action-btn"
          onClick={onLoadFromCloud}
          disabled={isSyncing || isLoading}
        >
          {isLoading ? '⏳' : '☁️'} Load from Cloud
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
