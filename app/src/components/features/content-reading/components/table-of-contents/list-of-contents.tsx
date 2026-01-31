import { cn } from '@/lib/utils';
import { memo } from 'react';

type Section = { id: number; title: string; level?: 0 | 1 | 2 | 3 | 4 | 5 | 6 };

interface ListOfContentsProps {
  sections: Section[];
  currentIndex: number;
  readSections: Set<number>;
  showProgress: boolean;
  handleSelectCard: (index: number) => void;
}

interface SectionButtonProps {
  section: Section;
  idx: number;
  isActive: boolean;
  isRead: boolean;
  showProgress: boolean;
  handleSelectCard: (index: number) => void;
}

const SectionButton = memo<SectionButtonProps>(
  ({ section, idx, isActive, isRead, showProgress, handleSelectCard }) => {
    const displayTitle = normalizeTitle(section.title);
    const level = section.level ?? 0;
    const paddingLeft = getLevelPadding(level);

    return (
      <button
        style={{ paddingLeft: `${paddingLeft}px` }}
        className={cn(
          'w-full text-left px-3 py-2 rounded text-sm',
          'flex items-center gap-2',
          isActive && 'bg-primary/10 text-primary font-medium',
          !isActive && isRead && showProgress && 'text-muted-foreground',
          !isActive && !isRead && 'text-foreground hover:bg-secondary/50'
        )}
        onClick={() => handleSelectCard(idx)}
      >
        <span className="text-xs text-muted-foreground">{idx + 1}.</span>
        <span className="line-clamp-2">{displayTitle}</span>
      </button>
    );
  },
  (prev, nxt) => {
    return (
      prev.isActive === nxt.isActive &&
      prev.isRead === nxt.isRead &&
      prev.showProgress === nxt.showProgress &&
      prev.section === nxt.section &&
      prev.idx === nxt.idx &&
      prev.handleSelectCard === nxt.handleSelectCard
    );
  }
);

SectionButton.displayName = 'SectionButton';

const ListOfContents: React.FC<ListOfContentsProps> = ({
  sections,
  currentIndex,
  readSections,
  showProgress,
  handleSelectCard,
}) => {
  return (
    <div className="p-2">
      {sections.length > 0 ? (
        <div className="space-y-1">
          {sections.map((section, idx) => (
            <SectionButton
              key={section.id}
              section={section}
              idx={idx}
              isActive={idx === currentIndex}
              isRead={readSections.has(section.id)}
              showProgress={showProgress}
              handleSelectCard={handleSelectCard}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">No sections found</div>
      )}
    </div>
  );
};

export default memo(ListOfContents, (prev, nxt) => {
  return (
    prev.currentIndex === nxt.currentIndex &&
    prev.showProgress === nxt.showProgress &&
    areSectionsEqual(prev.sections, nxt.sections) &&
    areSetsEqual(prev.readSections, nxt.readSections) &&
    prev.handleSelectCard === nxt.handleSelectCard
  );
});

const normalizeTitle = (title: string) => title.replace(/^\d+(\.\d+)*\s*\.?\s*/, '').trim();
const getLevelPadding = (level: number) => level * 12 + 12;

const areSetsEqual = (a: Set<number>, b: Set<number>) => {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
};

const areSectionsEqual = (a: Section[], b: Section[]) => {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].title !== b[i].title || a[i].level !== b[i].level) {
      return false;
    }
  }
  return true;
};
