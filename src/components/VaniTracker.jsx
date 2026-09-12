import { useState, useMemo } from 'react';

/**
 * VaniTracker — Lecture hearing tracker for the Working Vani Syllabus.
 *
 * Shows levels → folders → lectures in an accordion layout.
 * Each lecture has: serial #, name, duration, heard checkbox, remarks.
 */
export default function VaniTracker({
  levels = [],
  progress = {},
  onToggleHeard,
  onSetRemark,
}) {
  const [activeLevel, setActiveLevel] = useState(levels[0]?.id || '');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const currentLevel = levels.find(l => l.id === activeLevel);

  // Compute progress stats
  const levelStats = useMemo(() => {
    const stats = {};
    levels.forEach(level => {
      let total = 0;
      let heard = 0;
      function countFolder(folder) {
        folder.lectures.forEach(lec => {
          total++;
          if (progress[lec.id]?.heard) heard++;
        });
        if (folder.subfolders) folder.subfolders.forEach(countFolder);
      }
      level.folders.forEach(countFolder);
      stats[level.id] = { total, heard };
    });
    return stats;
  }, [levels, progress]);

  const folderStats = useMemo(() => {
    const stats = {};
    function computeFolder(folder) {
      let total = 0;
      let heard = 0;
      folder.lectures.forEach(lec => {
        total++;
        if (progress[lec.id]?.heard) heard++;
      });
      if (folder.subfolders) {
        folder.subfolders.forEach(sub => {
          computeFolder(sub);
          total += stats[sub.id]?.total || 0;
          heard += stats[sub.id]?.heard || 0;
        });
      }
      stats[folder.id] = { total, heard };
    }
    levels.forEach(level => level.folders.forEach(computeFolder));
    return stats;
  }, [levels, progress]);

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Filter lectures by search
  const filterLectures = (lectures) => {
    if (!searchQuery.trim()) return lectures;
    const q = searchQuery.toLowerCase();
    return lectures.filter(l => l.name.toLowerCase().includes(q));
  };

  function renderLectureTable(lectures) {
    const filtered = filterLectures(lectures);
    if (filtered.length === 0) {
      return <div className="vani-empty">No lectures match your search.</div>;
    }
    return (
      <div className="vani-table-wrap">
        <table className="vani-table">
          <thead>
            <tr>
              <th className="vani-th-sn">#</th>
              <th className="vani-th-name">Lecture Name</th>
              <th className="vani-th-dur">Duration</th>
              <th className="vani-th-heard">Heard</th>
              <th className="vani-th-remarks">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(lec => {
              const p = progress[lec.id] || {};
              return (
                <tr key={lec.id} className={p.heard ? 'vani-row--heard' : ''}>
                  <td className="vani-td-sn">{lec.sn}</td>
                  <td className="vani-td-name" title={lec.filename}>{lec.name}</td>
                  <td className="vani-td-dur">{lec.duration}</td>
                  <td className="vani-td-heard">
                    <label className="vani-checkbox-wrap">
                      <input
                        type="checkbox"
                        checked={!!p.heard}
                        onChange={() => onToggleHeard(lec.id)}
                        className="vani-checkbox"
                      />
                      <span className="vani-checkbox-custom" />
                    </label>
                  </td>
                  <td className="vani-td-remarks">
                    <input
                      type="text"
                      className="vani-remarks-input"
                      placeholder="Notes..."
                      value={p.remarks || ''}
                      onChange={(e) => onSetRemark(lec.id, e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderFolder(folder, depth = 0) {
    const isOpen = expandedFolders[folder.id];
    const fStats = folderStats[folder.id] || { total: 0, heard: 0 };
    const pct = fStats.total > 0 ? Math.round((fStats.heard / fStats.total) * 100) : 0;

    return (
      <div key={folder.id} className="vani-folder" style={{ marginLeft: depth * 12 }}>
        <button
          className={`vani-folder-header ${isOpen ? 'vani-folder-header--open' : ''}`}
          onClick={() => toggleFolder(folder.id)}
        >
          <span className="vani-folder-arrow">{isOpen ? '▼' : '▶'}</span>
          <span className="vani-folder-label">{folder.label}</span>
          <span className="vani-folder-stats">
            {fStats.heard}/{fStats.total}
          </span>
          <div className="vani-folder-progress-bar">
            <div
              className="vani-folder-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="vani-folder-pct">{pct}%</span>
        </button>

        {isOpen && (
          <div className="vani-folder-content">
            {folder.lectures.length > 0 && renderLectureTable(folder.lectures)}
            {folder.subfolders?.map(sub => renderFolder(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="vani-tracker">
      {/* ── Level Tabs ── */}
      <div className="vani-level-tabs">
        {levels.map(level => {
          const lStats = levelStats[level.id] || { total: 0, heard: 0 };
          const isActive = level.id === activeLevel;
          return (
            <button
              key={level.id}
              className={`vani-level-tab ${isActive ? 'vani-level-tab--active' : ''}`}
              onClick={() => setActiveLevel(level.id)}
            >
              <span className="vani-level-tab-label">{level.label}</span>
              <span className="vani-level-tab-count">
                {lStats.heard}/{lStats.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search ── */}
      <div className="vani-search-wrap">
        <input
          type="text"
          className="vani-search"
          placeholder="🔍 Search lectures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="vani-search-clear" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* ── Folders ── */}
      <div className="vani-folders">
        {currentLevel?.folders.map(folder => renderFolder(folder))}
      </div>
    </div>
  );
}
