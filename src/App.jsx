import { useState, useCallback, useEffect } from 'react';
import useSadhanaStore from './hooks/useSadhanaStore';
import {
  ACTIVITIES,
  SEVA_ACTIVITIES,
  DAYS,
  MAX_BODY_WEEKLY,
  MAX_SOUL_WEEKLY,
  getActivitiesBySection,
} from './data/activities';
import Header from './components/Header';
import DayTabs from './components/DayTabs';
import SectionTabs from './components/SectionTabs';
import ActivityCard from './components/ActivityCard';
import SevaInput from './components/SevaInput';
import ScorePanel from './components/ScorePanel';
import WeekGrid from './components/WeekGrid';
import ActionBar from './components/ActionBar';
import { exportCsv } from './utils/csvExport';
import { syncToSheets, loadFromSheets, isWeekDataEmpty } from './utils/sheetsSync';

export default function App() {
  const store = useSadhanaStore();
  const [gridVisible, setGridVisible] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [loadStatus, setLoadStatus] = useState('idle'); // idle | loading | loaded | error | not-found
  const [showCloudPrompt, setShowCloudPrompt] = useState(false);

  // ─── Auto-prompt: detect empty state with configured URL ──
  useEffect(() => {
    if (store.sheetsUrl && isWeekDataEmpty(store.weekData)) {
      setShowCloudPrompt(true);
    }
  }, []); // Only on mount

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
  }, [store.weekData, store.scores, store.devoteeName, store.weekStart]);

  // ─── Sync to Sheets (with blank guard) ───────────────
  const handleSyncSheets = useCallback(async () => {
    // Fix 1: Blank sync guard
    if (isWeekDataEmpty(store.weekData)) {
      const confirmed = window.confirm(
        'This week has no data entered. Syncing will overwrite any existing data in the sheet for this week.\n\nAre you sure you want to sync empty data?'
      );
      if (!confirmed) return;
    }

    setSyncStatus('syncing');
    const result = await syncToSheets(
      store.sheetsUrl,
      store.weekData,
      store.scores,
      store.devoteeName,
      store.weekStart
    );
    setSyncStatus(result);
    if (result === 'synced') {
      store.setLastSyncTime(new Date());
    }
    if (result === 'synced' || result === 'error') {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [store.sheetsUrl, store.weekData, store.scores, store.devoteeName, store.weekStart]);

  // ─── Load from Cloud ─────────────────────────────────
  const handleLoadFromCloud = useCallback(async () => {
    setLoadStatus('loading');
    setShowCloudPrompt(false);
    const result = await loadFromSheets(store.sheetsUrl, store.weekStart);

    if (result.status === 'ok' && result.weekData) {
      store.loadCloudData(result.weekData, result.devoteeName);
      setLoadStatus('loaded');
      setTimeout(() => setLoadStatus('idle'), 3000);
    } else if (result.status === 'not-found') {
      setLoadStatus('not-found');
      setTimeout(() => setLoadStatus('idle'), 3000);
    } else {
      setLoadStatus('error');
      setTimeout(() => setLoadStatus('idle'), 3000);
    }
  }, [store.sheetsUrl, store.weekStart, store]);

  const handleDismissPrompt = useCallback(() => {
    setShowCloudPrompt(false);
  }, []);

  const handleToggleGrid = useCallback(() => {
    setGridVisible(prev => !prev);
  }, []);

  // ─── Current section activities ──────────────────────
  const currentActivities = getActivitiesBySection(store.activeSection);
  const isSeva = store.activeSection === 'SEVA';
  const dayData = store.weekData[store.activeDay] || {};

  // ─── Weekly seva totals per activity ─────────────────
  const sevaWeeklyTotals = {};
  SEVA_ACTIVITIES.forEach(s => {
    let total = 0;
    DAYS.forEach(day => {
      total += store.weekData[day]?.[s.id] || 0;
    });
    sevaWeeklyTotals[s.id] = total;
  });

  return (
    <>
      {/* ── Cloud restore prompt ── */}
      {showCloudPrompt && (
        <div className="cloud-prompt">
          <div className="cloud-prompt-inner">
            <span className="cloud-prompt-icon">☁️</span>
            <span className="cloud-prompt-text">
              No local data found. Load from cloud?
            </span>
            <button
              className="cloud-prompt-btn cloud-prompt-btn--load"
              onClick={handleLoadFromCloud}
            >
              Load from Cloud
            </button>
            <button
              className="cloud-prompt-btn cloud-prompt-btn--dismiss"
              onClick={handleDismissPrompt}
            >
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

      {/* ── Activity Content ── */}
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

      {/* ── Score Panel ── */}
      <ScorePanel
        bodyPoints={store.scores.bodyTotal}
        soulPoints={store.scores.soulTotal}
        bodyMax={MAX_BODY_WEEKLY}
        soulMax={MAX_SOUL_WEEKLY}
      />

      {/* ── Action Bar ── */}
      <ActionBar
        onSyncSheets={handleSyncSheets}
        onExportCsv={handleExportCsv}
        onToggleGrid={handleToggleGrid}
        onLoadFromCloud={handleLoadFromCloud}
        gridVisible={gridVisible}
        syncStatus={syncStatus}
        loadStatus={loadStatus}
      />

      {/* ── Week Grid ── */}
      <WeekGrid
        weekData={store.weekData}
        activities={ACTIVITIES}
        sevaActivities={SEVA_ACTIVITIES}
        days={DAYS}
        visible={gridVisible}
      />
    </>
  );
}
