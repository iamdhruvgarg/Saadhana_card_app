import { useState, useCallback, useEffect, useRef } from 'react';
import useSadhanaStore from './hooks/useSadhanaStore';
import {
  ACTIVITIES,
  SEVA_ACTIVITIES,
  DAYS,
  MAX_BODY_WEEKLY,
  MAX_SOUL_WEEKLY,
  getActivitiesBySection,
} from './data/activities';
import { VANI_LEVELS } from './data/vaniSyllabus';
import Header from './components/Header';
import DayTabs from './components/DayTabs';
import SectionTabs from './components/SectionTabs';
import ActivityCard from './components/ActivityCard';
import SevaInput from './components/SevaInput';
import ScorePanel from './components/ScorePanel';
import WeekGrid from './components/WeekGrid';
import VaniTracker from './components/VaniTracker';
import { exportCsv } from './utils/csvExport';
import { syncToSheets, loadFromSheets, isWeekDataEmpty } from './utils/sheetsSync';

// Auto-sync debounce: sync 30 seconds after last data change
const AUTO_SYNC_DELAY = 30000;

export default function App() {
  const store = useSadhanaStore();
  const [gridVisible, setGridVisible] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [loadStatus, setLoadStatus] = useState('idle');
  const [showCloudPrompt, setShowCloudPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState('sadhana'); // 'sadhana' | 'vani'
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const autoSyncTimer = useRef(null);

  // ─── Close dropdown on outside click ─────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ─── Auto-prompt on empty state ──────────────────────
  useEffect(() => {
    if (store.sheetsUrl && isWeekDataEmpty(store.weekData)) {
      setShowCloudPrompt(true);
    }
  }, []);

  // ─── Auto-sync: debounced after data changes ─────────
  const doAutoSync = useCallback(async () => {
    if (!store.sheetsUrl || syncStatus === 'syncing') return;
    setSyncStatus('syncing');
    const result = await syncToSheets(
      store.sheetsUrl,
      store.weekData,
      store.scores,
      store.devoteeName,
      store.weekStart,
      store.vaniProgress
    );
    setSyncStatus(result);
    if (result === 'synced') {
      store.setLastSyncTime(new Date());
    }
    setTimeout(() => setSyncStatus('idle'), 3000);
  }, [store.sheetsUrl, store.weekData, store.scores, store.devoteeName, store.weekStart, store.vaniProgress, syncStatus]);

  // Trigger auto-sync timer on data changes
  useEffect(() => {
    if (!store.sheetsUrl) return;
    if (autoSyncTimer.current) clearTimeout(autoSyncTimer.current);
    autoSyncTimer.current = setTimeout(() => {
      doAutoSync();
    }, AUTO_SYNC_DELAY);
    return () => {
      if (autoSyncTimer.current) clearTimeout(autoSyncTimer.current);
    };
  }, [store.weekData, store.vaniProgress]);

  // ─── Actions ─────────────────────────────────────────
  const handleSelectActivity = useCallback((activityId, value) => {
    store.setActivity(store.activeDay, activityId, value);
  }, [store]);

  const handleCustomChange = useCallback((activityId, value) => {
    store.setCustomValue(store.activeDay, activityId, value);
  }, [store]);

  const handleSetSeva = useCallback((sevaId, minutes) => {
    store.setSeva(store.activeDay, sevaId, minutes);
  }, [store]);

  const handleNoteChange = useCallback((activityId, noteText) => {
    store.setNote(store.activeDay, activityId, noteText);
  }, [store]);

  const handleExportCsv = useCallback(() => {
    exportCsv(store.weekData, store.scores, store.devoteeName, store.weekStart);
    setMenuOpen(false);
  }, [store.weekData, store.scores, store.devoteeName, store.weekStart]);

  // ─── Manual Sync ─────────────────────────────────────
  const handleSyncSheets = useCallback(async () => {
    if (isWeekDataEmpty(store.weekData) && Object.keys(store.vaniProgress).length === 0) {
      const confirmed = window.confirm(
        'No data entered. Syncing will overwrite any existing data in the sheet.\n\nAre you sure?'
      );
      if (!confirmed) return;
    }
    setMenuOpen(false);
    setSyncStatus('syncing');
    const result = await syncToSheets(
      store.sheetsUrl,
      store.weekData,
      store.scores,
      store.devoteeName,
      store.weekStart,
      store.vaniProgress
    );
    setSyncStatus(result);
    if (result === 'synced') {
      store.setLastSyncTime(new Date());
    }
    if (result === 'synced' || result === 'error') {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [store.sheetsUrl, store.weekData, store.scores, store.devoteeName, store.weekStart, store.vaniProgress]);

  // ─── Load from Cloud ─────────────────────────────────
  const handleLoadFromCloud = useCallback(async () => {
    setLoadStatus('loading');
    setShowCloudPrompt(false);
    setMenuOpen(false);
    const result = await loadFromSheets(store.sheetsUrl, store.weekStart);

    if (result.status === 'ok') {
      if (result.weekData) store.loadCloudData(result.weekData, result.devoteeName);
      if (result.vaniProgress) store.loadVaniCloud(result.vaniProgress);
      setLoadStatus('loaded');
    } else if (result.status === 'not-found') {
      setLoadStatus('not-found');
    } else {
      setLoadStatus('error');
    }
    setTimeout(() => setLoadStatus('idle'), 3000);
  }, [store.sheetsUrl, store.weekStart, store]);

  const handleDismissPrompt = useCallback(() => setShowCloudPrompt(false), []);
  const handleToggleGrid = useCallback(() => { setGridVisible(prev => !prev); setMenuOpen(false); }, []);

  // ─── Current section activities ──────────────────────
  const currentActivities = getActivitiesBySection(store.activeSection);
  const isSeva = store.activeSection === 'SEVA';
  const dayData = store.weekData[store.activeDay] || {};

  const sevaWeeklyTotals = {};
  SEVA_ACTIVITIES.forEach(s => {
    let total = 0;
    DAYS.forEach(day => { total += store.weekData[day]?.[s.id] || 0; });
    sevaWeeklyTotals[s.id] = total;
  });

  // ─── Load status message ─────────────────────────────
  const LOAD_STATUS_MSG = {
    loading: '☁️ Loading from cloud...',
    loaded: '✅ Data restored from cloud!',
    'not-found': '📭 No cloud backup for this week',
    error: '⚠️ Failed to load from cloud',
  };

  return (
    <>
      {/* ── Cloud restore prompt ── */}
      {showCloudPrompt && (
        <div className="cloud-prompt">
          <div className="cloud-prompt-inner">
            <span className="cloud-prompt-icon">☁️</span>
            <span className="cloud-prompt-text">No local data found. Load from cloud?</span>
            <button className="cloud-prompt-btn cloud-prompt-btn--load" onClick={handleLoadFromCloud}>
              Load from Cloud
            </button>
            <button className="cloud-prompt-btn cloud-prompt-btn--dismiss" onClick={handleDismissPrompt}>
              Start Fresh
            </button>
          </div>
        </div>
      )}

      <Header
        devoteeName={store.devoteeName}
        onNameChange={store.setName}
        weekStart={store.weekStart}
        onPrevWeek={store.prevWeek}
        onNextWeek={store.nextWeek}
        sheetsUrl={store.sheetsUrl}
        onSheetsUrlChange={store.setSheetsUrl}
        syncStatus={syncStatus}
        lastSyncTime={store.lastSyncTime}
      />

      {/* ── Top-Level Tab Switcher ── */}
      <div className="top-tabs">
        <button
          className={`top-tab ${activeTab === 'sadhana' ? 'top-tab--active' : ''}`}
          onClick={() => setActiveTab('sadhana')}
        >
          🙏 Sadhana Card
        </button>
        <button
          className={`top-tab ${activeTab === 'vani' ? 'top-tab--active' : ''}`}
          onClick={() => setActiveTab('vani')}
        >
          🎧 Vani Syllabus
        </button>

        {/* ── Dropdown Menu ── */}
        <div className="dropdown-menu-wrap" ref={menuRef}>
          <button
            className="dropdown-menu-btn"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="More options"
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={handleSyncSheets} disabled={syncStatus === 'syncing'}>
                {syncStatus === 'syncing' ? '🔄 Syncing...' : '🔄 Sync to Sheets'}
              </button>
              <button className="dropdown-item" onClick={handleLoadFromCloud} disabled={loadStatus === 'loading'}>
                {loadStatus === 'loading' ? '⏳ Loading...' : '☁️ Load from Cloud'}
              </button>
              <button className="dropdown-item" onClick={handleExportCsv}>
                📤 Export CSV
              </button>
              <button className="dropdown-item" onClick={handleToggleGrid}>
                📊 {gridVisible ? 'Hide' : 'Show'} Week Grid
              </button>
              <div className="dropdown-divider" />
              <div className="dropdown-info">
                Auto-sync: {store.sheetsUrl ? '✅ On' : '❌ Off (no URL)'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Load status feedback ── */}
      {LOAD_STATUS_MSG[loadStatus] && (
        <div className="action-status-msg">{LOAD_STATUS_MSG[loadStatus]}</div>
      )}

      {/* ── Sadhana Card Tab ── */}
      {activeTab === 'sadhana' && (
        <>
          <DayTabs
            days={store.dayInfos}
            activeDay={store.activeDay}
            onDayChange={store.setDay}
          />
          <SectionTabs
            sections={store.sectionInfos}
            activeSection={store.activeSection}
            onSectionChange={store.setSection}
          />
          <div className="section-divider" />
          <div className="activity-cards">
            {isSeva ? (
              SEVA_ACTIVITIES.map(seva => (
                <SevaInput
                  key={seva.id}
                  seva={seva}
                  minutes={dayData[seva.id] || 0}
                  onMinutesChange={handleSetSeva}
                  weeklyTotal={sevaWeeklyTotals[seva.id]}
                  note={dayData[seva.id + '_note'] || ''}
                  onNoteChange={handleNoteChange}
                />
              ))
            ) : (
              currentActivities.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  selectedValue={dayData[activity.id] ?? null}
                  onSelect={handleSelectActivity}
                  onCustomChange={handleCustomChange}
                  weeklyInfo={store.scores.activityWeeklyMarks?.[activity.id]}
                  note={dayData[activity.id + '_note'] || ''}
                  onNoteChange={handleNoteChange}
                />
              ))
            )}
          </div>
          <div className="section-divider" />
          <ScorePanel
            bodyPoints={store.scores.bodyTotal}
            soulPoints={store.scores.soulTotal}
            bodyMax={MAX_BODY_WEEKLY}
            soulMax={MAX_SOUL_WEEKLY}
          />
          <WeekGrid
            weekData={store.weekData}
            activities={ACTIVITIES}
            sevaActivities={SEVA_ACTIVITIES}
            days={DAYS}
            visible={gridVisible}
          />
        </>
      )}

      {/* ── Vani Syllabus Tab ── */}
      {activeTab === 'vani' && (
        <VaniTracker
          levels={VANI_LEVELS}
          progress={store.vaniProgress}
          onToggleHeard={store.toggleVaniHeard}
          onSetRemark={store.setVaniRemark}
        />
      )}
    </>
  );
}
