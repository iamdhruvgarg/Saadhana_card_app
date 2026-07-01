/* ═══════════════════════════════════════════════════════════
   Vishnu Sacred Icons — Inline SVG React Components
   Shankha · Chakra · Gada · Padma
   ═══════════════════════════════════════════════════════════ */

/**
 * ShankhaSvg — Golden Conch Shell with spiral detail
 */
export function ShankhaSvg({ size = 32, className = '' }) {
  const id = 'shankha-grad-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Shankha (Conch Shell)"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A017" />
          <stop offset="50%" stopColor="#F5D060" />
          <stop offset="100%" stopColor="#D4A017" />
        </linearGradient>
        <linearGradient id={id + '-h'} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5D060" />
          <stop offset="100%" stopColor="#FFCC02" />
        </linearGradient>
      </defs>
      {/* Main conch body */}
      <ellipse cx="32" cy="34" rx="16" ry="22" fill={`url(#${id})`} />
      {/* Conch opening */}
      <ellipse cx="30" cy="36" rx="9" ry="14" fill={`url(#${id}-h)`} opacity="0.5" />
      {/* Spiral grooves */}
      <path
        d="M26 20 C28 24, 36 26, 38 22"
        stroke="#B8860B"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M24 28 C27 33, 38 34, 40 28"
        stroke="#B8860B"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M24 36 C27 41, 38 42, 40 36"
        stroke="#B8860B"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M26 44 C28 48, 36 48, 38 44"
        stroke="#B8860B"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      {/* Top apex of conch — pointed tip */}
      <path
        d="M32 12 C28 14, 26 18, 28 20 C30 16, 34 16, 36 20 C38 18, 36 14, 32 12Z"
        fill={`url(#${id})`}
        stroke="#B8860B"
        strokeWidth="0.5"
      />
      {/* Mouthpiece at bottom */}
      <ellipse cx="32" cy="56" rx="6" ry="3" fill="#B8860B" opacity="0.7" />
      {/* Highlight */}
      <ellipse cx="38" cy="28" rx="3" ry="6" fill="#FFF8DC" opacity="0.3" />
    </svg>
  );
}

/**
 * ChakraSvg — Sudarshana Disc with radiating spokes
 */
export function ChakraSvg({ size = 32, className = '' }) {
  const id = 'chakra-grad-' + Math.random().toString(36).slice(2, 8);
  const spokes = 16;
  const spokeElements = [];

  for (let i = 0; i < spokes; i++) {
    const angle = (360 / spokes) * i;
    spokeElements.push(
      <line
        key={i}
        x1="32"
        y1="32"
        x2="32"
        y2="6"
        stroke="#D4A017"
        strokeWidth="1.6"
        strokeLinecap="round"
        transform={`rotate(${angle}, 32, 32)`}
      />
    );
  }

  // Outer serrated edge (blade tips)
  const bladeElements = [];
  const bladeCount = 24;
  for (let i = 0; i < bladeCount; i++) {
    const angle = (360 / bladeCount) * i;
    const radians = (angle * Math.PI) / 180;
    const outerR = 30;
    const tipR = 31.5;
    const x = 32 + tipR * Math.sin(radians);
    const y = 32 - tipR * Math.cos(radians);
    bladeElements.push(
      <circle key={'b' + i} cx={x} cy={y} r="1.8" fill="#E87A1F" opacity="0.8" />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Sudarshana Chakra (Disc)"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A017" />
          <stop offset="50%" stopColor="#F5D060" />
          <stop offset="100%" stopColor="#E87A1F" />
        </linearGradient>
        <radialGradient id={id + '-r'} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFCC02" />
          <stop offset="60%" stopColor="#D4A017" />
          <stop offset="100%" stopColor="#E87A1F" />
        </radialGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="32" cy="32" r="28" stroke={`url(#${id})`} strokeWidth="3" fill="none" />
      {/* Blade tips */}
      {bladeElements}
      {/* Inner ring */}
      <circle cx="32" cy="32" r="22" stroke="#D4A017" strokeWidth="1.5" fill="none" />
      {/* Spokes */}
      {spokeElements}
      {/* Inner filled disc */}
      <circle cx="32" cy="32" r="8" fill={`url(#${id}-r)`} />
      {/* Center hub */}
      <circle cx="32" cy="32" r="3.5" fill="#FFF8DC" opacity="0.8" />
      <circle cx="32" cy="32" r="2" fill="#D4A017" />
      {/* Inner decorative ring */}
      <circle cx="32" cy="32" r="15" stroke="#F5D060" strokeWidth="0.8" fill="none" opacity="0.6" />
    </svg>
  );
}

/**
 * GadaSvg — Ornamental Mace/Club
 */
export function GadaSvg({ size = 32, className = '' }) {
  const id = 'gada-grad-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Gada (Mace)"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5D060" />
          <stop offset="50%" stopColor="#D4A017" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <radialGradient id={id + '-h'} cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#F5D060" />
          <stop offset="100%" stopColor="#D4A017" />
        </radialGradient>
      </defs>
      {/* Mace handle (shaft) */}
      <rect x="29" y="24" width="6" height="34" rx="2.5" fill={`url(#${id})`} />
      {/* Handle grip bands */}
      <rect x="28.5" y="40" width="7" height="2" rx="1" fill="#B8860B" opacity="0.7" />
      <rect x="28.5" y="45" width="7" height="2" rx="1" fill="#B8860B" opacity="0.7" />
      <rect x="28.5" y="50" width="7" height="2" rx="1" fill="#B8860B" opacity="0.7" />
      {/* Pommel at bottom */}
      <ellipse cx="32" cy="58" rx="5" ry="3" fill="#B8860B" />
      {/* Mace head — ornamental bulb */}
      <circle cx="32" cy="16" r="12" fill={`url(#${id}-h)`} />
      {/* Mace head crown ridges */}
      <path
        d="M22 14 C24 8, 28 5, 32 4 C36 5, 40 8, 42 14"
        stroke="#B8860B"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Decorative facets on head */}
      <ellipse cx="27" cy="14" rx="2.5" ry="4" fill="#FFF8DC" opacity="0.25" />
      <ellipse cx="37" cy="14" rx="2.5" ry="4" fill="#FFF8DC" opacity="0.15" />
      {/* Top spike */}
      <path d="M32 4 L30 8 L34 8 Z" fill="#D4A017" />
      {/* Ring at head-shaft junction */}
      <ellipse cx="32" cy="24" rx="6" ry="2.5" fill="#B8860B" opacity="0.8" />
      {/* Highlight on head */}
      <circle cx="29" cy="12" r="3" fill="#FFF8DC" opacity="0.2" />
      {/* Side protrusions */}
      <circle cx="20" cy="16" r="3" fill="#D4A017" opacity="0.7" />
      <circle cx="44" cy="16" r="3" fill="#D4A017" opacity="0.7" />
    </svg>
  );
}

/**
 * PadmaSvg — Open Lotus Flower with multiple petals
 */
export function PadmaSvg({ size = 32, className = '' }) {
  const id = 'padma-grad-' + Math.random().toString(36).slice(2, 8);
  const petalCount = 8;
  const petalElements = [];

  for (let i = 0; i < petalCount; i++) {
    const angle = (360 / petalCount) * i;
    petalElements.push(
      <ellipse
        key={'outer-' + i}
        cx="32"
        cy="14"
        rx="6"
        ry="14"
        fill={`url(#${id})`}
        transform={`rotate(${angle}, 32, 32)`}
        opacity="0.9"
      />
    );
  }

  // Inner petals (smaller, offset)
  const innerPetals = [];
  const innerCount = 8;
  for (let i = 0; i < innerCount; i++) {
    const angle = (360 / innerCount) * i + 22.5;
    innerPetals.push(
      <ellipse
        key={'inner-' + i}
        cx="32"
        cy="18"
        rx="4.5"
        ry="10"
        fill={`url(#${id}-i)`}
        transform={`rotate(${angle}, 32, 32)`}
        opacity="0.85"
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Padma (Lotus Flower)"
    >
      <defs>
        <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#F8BBD0" />
          <stop offset="100%" stopColor="#E91E63" />
        </linearGradient>
        <linearGradient id={id + '-i'} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FCE4EC" />
          <stop offset="100%" stopColor="#F06292" />
        </linearGradient>
        <radialGradient id={id + '-c'} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFCC02" />
          <stop offset="100%" stopColor="#D4A017" />
        </radialGradient>
      </defs>
      {/* Outer petals */}
      {petalElements}
      {/* Inner petals */}
      {innerPetals}
      {/* Golden center (pericarp) */}
      <circle cx="32" cy="32" r="7" fill={`url(#${id}-c)`} />
      {/* Center dots — seed pods */}
      <circle cx="32" cy="30" r="1" fill="#B8860B" opacity="0.7" />
      <circle cx="30" cy="33" r="1" fill="#B8860B" opacity="0.7" />
      <circle cx="34" cy="33" r="1" fill="#B8860B" opacity="0.7" />
      <circle cx="32" cy="35" r="0.8" fill="#B8860B" opacity="0.5" />
      {/* Petal vein lines on a couple of petals for detail */}
      <line x1="32" y1="8" x2="32" y2="20" stroke="#C2185B" strokeWidth="0.5" opacity="0.3" />
      <line x1="32" y1="44" x2="32" y2="56" stroke="#C2185B" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}
