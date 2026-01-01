import { ChevronRight, Search, Hash, FileText, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

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
  const normalizeTitle = useCallback((title: string) => {
    return title.replace(/^\d+(\.\d+)*\s*\.?\s*/, '').trim();
  }, []);

  const getLevelIcon = useCallback((level: number) => {
    switch (level) {
      case 0:
        return <FileText className="w-3 h-3" />;
      case 1:
        return <Hash className="w-3 h-3" />;
      case 2:
        return <List className="w-2.5 h-2.5" />;
      default:
        return <Hash className="w-3 h-3" />;
    }
  }, []);

  const getLevelPadding = useCallback((level: number) => {
    switch (level) {
      case 0:
        return 'ml-0';
      case 1:
        return 'ml-4';
      case 2:
        return 'ml-8';
      default:
        return 'ml-0';
    }
  }, []);

  const getButtonClass = useCallback(
    (isActive: boolean, isRead: boolean, showProgress: boolean) => {
      const baseClasses = 'transition-all duration-300 ease-out';

      if (isActive) {
        return cn(
          baseClasses,
          'bg-gradient-to-r from-primary/15 to-primary/5',
          'text-primary font-medium',
          'border-l-2 border-primary',
          'shadow-sm'
        );
      }

      if (isRead && showProgress) {
        return cn(
          baseClasses,
          'bg-gradient-to-r from-green-500/10 to-green-500/5',
          'text-foreground/90',
          'border-l-2 border-green-500/30'
        );
      }

      return cn(
        baseClasses,
        'hover:bg-gradient-to-r hover:from-secondary/20 hover:to-secondary/5',
        'text-muted-foreground hover:text-foreground',
        'border-l-2 border-transparent hover:border-secondary/50'
      );
    },
    []
  );

  const getCircleClass = useCallback(
    (isActive: boolean, isRead: boolean, showProgress: boolean, level: number) => {
      const sizeClass = level === 2 ? 'min-w-5 h-5' : 'min-w-6 h-6';

      if (isActive) {
        return cn(
          sizeClass,
          'bg-gradient-to-br from-primary/30 to-primary/10',
          'text-primary border-2 border-primary/30',
          'shadow-sm'
        );
      }

      if (isRead && showProgress) {
        return cn(
          sizeClass,
          'bg-gradient-to-br from-green-500/20 to-green-500/10',
          'text-green-600 border-2 border-green-500/30'
        );
      }

      return cn(
        sizeClass,
        'bg-gradient-to-br from-secondary/20 to-secondary/10',
        'text-muted-foreground border-2 border-secondary/20',
        'hover:border-secondary/40 hover:bg-secondary/20'
      );
    },
    []
  );

  const renderStatusIndicator = useCallback(
    (isActive: boolean, isRead: boolean, showProgress: boolean) => {
      if (isActive) {
        return (
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          </div>
        );
      }

      if (isRead && showProgress) {
        return (
          <div className="ml-auto h-2 w-2 rounded-full bg-green-500/60 flex-shrink-0 shadow-sm" />
        );
      }

      return null;
    },
    []
  );

  const getTextSize = useCallback((level: number) => {
    switch (level) {
      case 0:
        return 'text-sm font-medium';
      case 1:
        return 'text-sm';
      case 2:
        return 'text-xs';
      default:
        return 'text-sm';
    }
  }, []);

  return (
    <div className="p-3">
      {sections.length > 0 ? (
        <div className="space-y-1">
          {sections.map((section, idx) => {
            const displayTitle = normalizeTitle(section.title);
            const isActive = idx === currentIndex;
            const isRead = readSections.has(section.id);
            const level = section.level ?? 0;

            return (
              <div key={section.id} className={cn('relative', getLevelPadding(level))}>
                <button
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-2xl',
                    'flex items-center gap-3 group relative overflow-hidden',
                    getButtonClass(isActive, isRead, showProgress)
                  )}
                  onClick={() => {
                    handleSelectCard(idx);
                  }}
                >
                  {/* Level indicator line for hierarchy */}
                  {level > 0 && (
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-border/30" />
                  )}

                  {/* Icon and number container */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-full flex-shrink-0 transition-all duration-300',
                        getCircleClass(isActive, isRead, showProgress, level)
                      )}
                    >
                      <span className={cn('font-medium', level === 2 ? 'text-xs' : 'text-xs')}>
                        {idx + 1}
                      </span>
                    </div>

                    {/* Level icon */}
                    <div
                      className={cn(
                        'opacity-60 transition-opacity duration-300',
                        isActive && 'opacity-100'
                      )}
                    >
                      {getLevelIcon(level)}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'line-clamp-2 text-left leading-relaxed transition-all duration-300',
                        getTextSize(level),
                        isActive && 'font-medium'
                      )}
                    >
                      {displayTitle}
                    </span>
                  </div>

                  {/* Status indicator */}
                  {renderStatusIndicator(isActive, isRead, showProgress)}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
            <Search className="w-6 h-6 opacity-40" />
          </div>
          <p className="text-sm font-medium mb-1">No sections found</p>
          <p className="text-xs opacity-70">Try adding some headings to your document</p>
        </div>
      )}
    </div>
  );
};

export default ListOfContents;
