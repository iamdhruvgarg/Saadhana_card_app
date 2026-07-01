import { GRADES, getGrade, MAX_BODY_WEEKLY, MAX_SOUL_WEEKLY } from '../data/activities';
import { PadmaSvg } from './VishnuIcons';

const RADIUS = 65;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const VIEW_SIZE = (RADIUS + STROKE) * 2;

function Ring({ pct, color, label }) {
  const offset = CIRCUMFERENCE * (1 - Math.min(pct, 100) / 100);

  return (
    <div className="score-ring">
      <svg
        width={VIEW_SIZE}
        height={VIEW_SIZE}
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      >
        <circle
          cx={VIEW_SIZE / 2}
          cy={VIEW_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(212,160,23,0.15)"
          strokeWidth={STROKE}
        />
        <circle
          cx={VIEW_SIZE / 2}
          cy={VIEW_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize="20"
          fontWeight="800"
          fontFamily="Inter, system-ui, sans-serif"
          fill={color}
        >
          {Math.round(pct)}%
        </text>
      </svg>
      <span className="score-ring-label" style={{ color }}>{label}</span>
    </div>
  );
}

export default function ScorePanel({
  bodyPoints = 0,
  soulPoints = 0,
  bodyMax = MAX_BODY_WEEKLY,
  soulMax = MAX_SOUL_WEEKLY,
}) {
  const bodyPct = bodyMax > 0 ? (bodyPoints / bodyMax) * 100 : 0;
  const soulPct = soulMax > 0 ? (soulPoints / soulMax) * 100 : 0;
  const totalPct = (bodyPct + soulPct) / 2;
  const currentGrade = getGrade(totalPct);

  return (
    <div className="score-panel">
      {/* ── Rings ── */}
      <div className="score-rings">
        <Ring pct={bodyPct} color="#2B5EA7" label="Body" />
        <Ring pct={soulPct} color="#E91E63" label="Soul" />
      </div>

      {/* ── Combined total with lotus watermark ── */}
      <div className="score-total" style={{ position: 'relative' }}>
        <div className="score-lotus-watermark">
          <PadmaSvg size={100} />
        </div>
        <div className="score-total-pct">{Math.round(totalPct)}%</div>
        <div className="score-total-label">Combined Score</div>
        <div className="score-raw">
          Body: {Math.round(bodyPoints * 10) / 10}/{bodyMax} · Soul: {Math.round(soulPoints * 10) / 10}/{soulMax}
        </div>
      </div>

      {/* ── Grade ladder ── */}
      <div className="grade-ladder">
        {GRADES.map((g) => (
          <span
            key={g.label}
            className={
              'grade-item' +
              (g.label === currentGrade ? ' grade-item--active' : '')
            }
          >
            {g.label} ({g.threshold}%+)
          </span>
        ))}
      </div>

      {/* ── Scoring Formulas ── */}
      <div className="score-formulas">
        <div className="score-formulas-title">
          How scores are calculated
        </div>
        <div className="formula-row">
          <span className="formula-label" style={{ color: '#2B5EA7' }}>Body Score</span>
          <span className="formula-eq">= NIDRA points / {bodyMax} × 100</span>
          <span className="formula-result" style={{ color: '#2B5EA7' }}>{bodyPct.toFixed(1)}%</span>
        </div>
        <div className="formula-row">
          <span className="formula-label" style={{ color: '#E91E63' }}>Soul Score</span>
          <span className="formula-eq">= (JAPA + PATHAN + COLLEGE) / {soulMax} × 100</span>
          <span className="formula-result" style={{ color: '#E91E63' }}>{soulPct.toFixed(1)}%</span>
        </div>
        <div className="formula-row formula-row--total">
          <span className="formula-label">Total Score</span>
          <span className="formula-eq">= (Body% + Soul%) / 2</span>
          <span className="formula-result">{totalPct.toFixed(1)}%</span>
        </div>
        <div className="formula-note">
          Grade thresholds: Pass ≥ 80% · First Class ≥ 85% · Distinction ≥ 90% · Honors ≥ 95% · High Honors = 100%
        </div>
      </div>
    </div>
  );
}
