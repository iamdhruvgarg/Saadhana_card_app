function DayTabs({ days, activeDay, onDayChange }) {
  return (
    <div className="day-tabs">
      {days.map((day) => (
        <button
          key={day.key}
          className={
            'day-tab' + (activeDay === day.key ? ' day-tab--active' : '')
          }
          onClick={() => onDayChange(day.key)}
        >
          <span className="day-tab-label">{day.key}</span>
          <span className="day-tab-date">{day.date}</span>
          <div className="day-tab-progress-track">
            <div
              className="day-tab-progress"
              style={{ width: `${(day.progress || 0) * 100}%` }}
            />
          </div>
        </button>
      ))}
    </div>
  );
}

export default DayTabs;
