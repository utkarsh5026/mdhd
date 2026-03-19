import { ArrowLeft, Layers, X } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  extractSnippets,
  groupSnippets,
  type Snippet,
  type SnippetType,
} from '@/services/markdown/snippets';
import type { MarkdownSection } from '@/services/section/parsing';

import { type ActiveTab, SnippetDetail, SnippetRow, TAB_CONFIG, TypeTabs } from './snippets-sheet';

interface SnippetsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: MarkdownSection[];
  onNavigateToSection: (sectionIndex: number) => void;
}

const SnippetsSheet: React.FC<SnippetsSheetProps> = ({
  open,
  onOpenChange,
  sections,
  onNavigateToSection,
}) => {
  const [shouldRender, setShouldRender] = useState(open);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => {
        setShouldRender(false);
        setSelectedSnippet(null);
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const snippets = useMemo(() => extractSnippets(sections), [sections]);
  const groups = useMemo(() => groupSnippets(snippets), [snippets]);

  const firstTabWithContent = (Object.keys(groups) as SnippetType[]).find(
    (t) => groups[t].length > 0
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>(firstTabWithContent ?? 'code');

  useEffect(() => {
    const first = (Object.keys(groups) as SnippetType[]).find((t) => groups[t].length > 0);
    if (first) setActiveTab(first);
  }, [groups]);

  const activeSnippets: Snippet[] = groups[activeTab] ?? [];
  const totalCount = snippets.length;

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  const handleBack = useCallback(() => setSelectedSnippet(null), []);

  const handleNavigate = useCallback(
    (sectionIndex: number) => {
      onNavigateToSection(sectionIndex);
      onOpenChange(false);
    },
    [onNavigateToSection, onOpenChange]
  );

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 ease-in-out',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full sm:max-w-md overflow-hidden',
          'bg-background shadow-2xl shadow-black/30 border-l border-border/50',
          'transform transition-transform duration-300 ease-out will-change-transform',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full w-full min-w-0 overflow-x-hidden">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="border-b border-border/20 px-4 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedSnippet ? (
                  <button
                    onClick={handleBack}
                    className={cn(
                      'flex items-center gap-1 text-[13px]',
                      'text-muted-foreground hover:text-foreground',
                      'transition-colors duration-150'
                    )}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                ) : (
                  <>
                    <span className="text-[13px] font-medium text-foreground">Snippets</span>
                    {totalCount > 0 && (
                      <span className="text-[11px] text-muted-foreground/40">{totalCount}</span>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors"
                aria-label="Close snippets"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {selectedSnippet ? (
            <div className="flex-1 overflow-hidden min-w-0">
              <SnippetDetail snippet={selectedSnippet} onNavigate={handleNavigate} />
            </div>
          ) : totalCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <Layers className="w-5 h-5 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground/40 leading-relaxed max-w-50">
                No code blocks, images, videos, or links found in this document.
              </p>
            </div>
          ) : (
            <>
              <TypeTabs groups={groups} active={activeTab} onChange={setActiveTab} />
              <div className="flex-1 overflow-hidden relative min-w-0">
                <ScrollArea className="h-full **:data-[slot=scroll-area-viewport]:overflow-x-hidden! [&_[data-slot=scroll-area-viewport]>div]:block!">
                  {activeSnippets.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No {TAB_CONFIG[activeTab].label.toLowerCase()} in this document.
                    </div>
                  ) : (
                    <div className="py-0.5 overflow-hidden divide-y divide-border/10">
                      {activeSnippets.map((snippet) => (
                        <SnippetRow
                          key={snippet.id}
                          snippet={snippet}
                          onClick={setSelectedSnippet}
                          onNavigate={handleNavigate}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(SnippetsSheet);
