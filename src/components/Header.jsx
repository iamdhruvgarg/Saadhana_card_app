import { useState } from 'react';
import { ShankhaSvg, ChakraSvg, GadaSvg, PadmaSvg } from './VishnuIcons';

function formatTimeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function Header({
  devoteeName,
  onNameChange,
  weekStart,
  onPrevWeek,
  onNextWeek,
  sheetsUrl,
  onSheetsUrlChange,
  syncStatus,
  lastSyncTime,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const formattedDate = weekStart
    ? weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <header className="header">
      {/* ── Sacred Images ── */}
      <div className="header-images">
        <div className="header-img-wrap">
          <img
            src="/images/radha-venimadhava.jpg"
            alt="Sri Sri Radha Venimadhava"
            className="header-img"
          />
          <span className="header-img-caption">Śrī Śrī Rādhā Venīmādhava</span>
        </div>
        <div className="header-img-wrap">
          <img
            src="/images/srila-prabhupada.jpg"
            alt="Śrīla Prabhupāda"
            className="header-img"
          />
          <span className="header-img-caption">Śrīla Prabhupāda</span>
        </div>
      </div>

      {/* ── Vishnu Sacred Icons ── */}
      <div className="vishnu-icons-row">
        <div className="vishnu-icon-wrap"><ShankhaSvg size={36} /></div>
        <div className="vishnu-icon-wrap"><ChakraSvg size={36} className="vishnu-chakra-spin" /></div>
        <div className="vishnu-icon-wrap"><GadaSvg size={36} /></div>
        <div className="vishnu-icon-wrap"><PadmaSvg size={36} /></div>
      </div>

      <div className="header-top">
        <div>
          <h1 className="header-title">
            Sadhana Card
            <div className="header-subtitle">
              for the pleasure of Sri Guru and Gauranga
            </div>
          </h1>
        </div>
        <button
          className="settings-btn"
          onClick={() => setSettingsOpen((prev) => !prev)}
          aria-label="Settings"
        >
          ⚙
        </button>
      </div>

      <p className="header-verse">
        yuktāhāra-vihārasya yukta ceṣṭasya karmasu / yukta svapnāva bodhasya yogo bhavati duḥkha hā — BG 6.17
      </p>

      <div className="header-name-row">
        <span className="header-name-label">Name:</span>
        <input
          className="header-name-input"
          type="text"
          value={devoteeName || ''}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter devotee name"
          aria-label="Devotee name"
        />
      </div>

      <nav className="week-nav">
        <button className="week-nav-btn" onClick={onPrevWeek} aria-label="Previous week">
          ←
        </button>
        <span className="week-nav-label">Week of {formattedDate}</span>
        <button className="week-nav-btn" onClick={onNextWeek} aria-label="Next week">
          →
        </button>
      </nav>

      {/* ── Sync Status ── */}
      {syncStatus && (
        <div className="header-sync-row">
          <span className={`sync-status-dot sync-status-dot--${syncStatus}`} />
          <span className="sync-status-text">
            {syncStatus === 'synced' ? `Synced ${lastSyncTime ? formatTimeAgo(lastSyncTime) : ''}` :
             syncStatus === 'syncing' ? 'Syncing...' :
             syncStatus === 'error' ? 'Sync failed' :
             'Not synced'}
          </span>
        </div>
      )}

      {settingsOpen && (
        <div className="settings-panel">
          <label>
            Apps Script Web App URL
            <input
              className="settings-input"
              type="url"
              value={sheetsUrl || ''}
              onChange={(e) => onSheetsUrlChange(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </label>
          <button
            className="settings-close"
            onClick={() => setSettingsOpen(false)}
          >
            Close settings
          </button>
        </div>
      )}
    </header>
  );
}
