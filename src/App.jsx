import { useState, useCallback, useMemo } from 'react';
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
import { loadFromSheets } from './utils/sheetsSync';
import { signOut } from './firebase/auth';
import { useRef, useEffect } from 'react';

export default function App({ user }) {
  const store = useSadhanaStore(user.uid);
  const [gridVisible, setGridVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('sadhana');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

  const handleSignOut = useCallback(async () => {
    setMenuOpen(false);
    await signOut();
  }, []);

  const handleToggleGrid = useCallback(() => {
    setGridVisible(prev => !prev);
    setMenuOpen(false);
  }, []);

  // ─── Google Sheets Migration ─────────────────────────
  const handleMigrateSheets = useCallback(async () => {
    const url = localStorage.getItem('migration-sheets-url') || prompt(
      'Enter your Apps Script URL to pull this week\'s data from Google Sheets:\n\n(It will be saved to Firebase automatically)'
    );
    if (!url) return;
    
    localStorage.setItem('migration-sheets-url', url);
    setMenuOpen(false);
    setIsMigrating(true);

    try {
      const result = await loadFromSheets(url, store.weekStart);
      if (result.status === 'ok') {
        if (result.weekData) store.loadCloudData(result.weekData, result.devoteeName);
        if (result.vaniProgress) store.loadVaniCloud(result.vaniProgress);
        alert('✅ Successfully pulled data from Google Sheets! It is now saved in your Firebase account.');
      } else if (result.status === 'not-found') {
        alert('📭 No data found in Google Sheets for this specific week.');
      } else {
        alert('⚠️ Error loading from Sheets: ' + result.message);
      }
    } catch (err) {
      alert('⚠️ Error: ' + err.message);
    }
    
    setIsMigrating(false);
  }, [store.weekStart, store]);

  // Current section activities
  const currentActivities = getActivitiesBySection(store.activeSection);
  const isSeva = store.activeSection === 'SEVA';
  const dayData = store.weekData[store.activeDay] || {};

  const sevaWeeklyTotals = useMemo(() => {
    const totals = {};
    SEVA_ACTIVITIES.forEach(s => {
      let total = 0;
      DAYS.forEach(day => { total += store.weekData[day]?.[s.id] || 0; });
      totals[s.id] = total;
    });
    return totals;
  }, [store.weekData]);

  return (
    <>
      <Header
        devoteeName={store.devoteeName}
        onNameChange={store.setName}
        weekStart={store.weekStart}
        onPrevWeek={store.prevWeek}
        onNextWeek={store.nextWeek}
        user={user}
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
              <button className="dropdown-item" onClick={handleMigrateSheets} disabled={isMigrating}>
                {isMigrating ? '⏳ Pulling...' : '☁️ Pull from Google Sheets'}
              </button>
              <button className="dropdown-item" onClick={handleExportCsv}>
                📤 Export CSV
              </button>
              <button className="dropdown-item" onClick={handleToggleGrid}>
                📊 {gridVisible ? 'Hide' : 'Show'} Week Grid
              </button>
              <div className="dropdown-divider" />
              <div className="dropdown-info">
                ☁️ Auto-sync: On (Firestore)
              </div>
              <div className="dropdown-info">
                👤 {user.email}
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item dropdown-item--danger" onClick={handleSignOut}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

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
