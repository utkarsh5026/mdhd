import { cn } from '@/lib/utils';

interface ListOfContentsProps {
  sections: { id: number; title: string; level?: number }[];
  currentIndex: number;
  readSections: Set<number>;
  showProgress: boolean;
  handleSelectCard: (index: number) => void;
}

const ListOfContents: React.FC<ListOfContentsProps> = ({
  sections,
  currentIndex,
  readSections,
  showProgress,
  handleSelectCard,
}) => {
  const normalizeTitle = (title: string) => {
    return title.replace(/^\d+(\.\d+)*\s*\.?\s*/, '').trim();
  };

  const getLevelPadding = (level: number) => {
    return level * 16;
  };

  return (
    <div className="p-2">
      {sections.length > 0 ? (
        <div className="space-y-1">
          {sections.map((section, idx) => {
            const displayTitle = normalizeTitle(section.title);
            const isActive = idx === currentIndex;
            const isRead = readSections.has(section.id);
            const level = section.level ?? 0;

            return (
              <button
                key={section.id}
                style={{ paddingLeft: `${getLevelPadding(level) + 12}px` }}
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
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No sections found
        </div>
      )}
    </div>
  );
};

export default ListOfContents;
