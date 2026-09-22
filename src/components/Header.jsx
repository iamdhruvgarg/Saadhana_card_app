import { ShankhaSvg, ChakraSvg, GadaSvg, PadmaSvg } from './VishnuIcons';

export default function Header({
  devoteeName,
  onNameChange,
  weekStart,
  onPrevWeek,
  onNextWeek,
  user,
}) {
  const formattedDate = weekStart
    ? weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <header className="header">
      {/* ── User avatar ── */}
      {user && (
        <div className="header-user-row">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="header-user-avatar" referrerPolicy="no-referrer" />
          ) : (
            <div className="header-user-avatar header-user-avatar--placeholder">
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </div>
          )}
          <span className="header-user-name">
            {user.displayName || user.email}
          </span>
        </div>
      )}

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
    </header>
  );
}
