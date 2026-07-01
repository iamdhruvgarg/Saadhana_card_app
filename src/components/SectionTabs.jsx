import { ShankhaSvg, ChakraSvg, GadaSvg, PadmaSvg } from './VishnuIcons';

const SECTION_ICONS = {
  NIDRA: ShankhaSvg,
  JAPA: ChakraSvg,
  PATHAN: GadaSvg,
  SEVA: PadmaSvg,
  COLLEGE: PadmaSvg,
};

function SectionTabs({ sections, activeSection, onSectionChange }) {
  return (
    <div className="section-tabs">
      {sections.map((section) => {
        const isActive = activeSection === section.key;
        const isSeva = section.key === 'SEVA';

        const badgeText = isSeva
          ? `${section.score} min`
          : `${section.score}/${section.maxScore}`;

        const IconComponent = SECTION_ICONS[section.key];

        return (
          <button
            key={section.key}
            className={
              'section-tab' + (isActive ? ' section-tab--active' : '')
            }
            style={
              isActive
                ? { borderBottomColor: section.color }
                : undefined
            }
            onClick={() => onSectionChange(section.key)}
          >
            {IconComponent && (
              <span className="section-tab-icon">
                <IconComponent size={18} />
              </span>
            )}
            <span className="section-tab-label">{section.label}</span>
            <span
              className="section-tab-badge"
              style={{ backgroundColor: section.color }}
            >
              {badgeText}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default SectionTabs;
