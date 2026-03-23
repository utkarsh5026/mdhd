import { ArrowLeft, ChevronDown, Code, Image, Layers, Link, Play } from 'lucide-react';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  type ActiveTab,
  SectionDivider,
  SnippetDetail,
  SnippetRow,
} from '@/components/features/content-reading/components/snippets/snippets-sheet';
import { useReadingActionsById } from '@/components/features/content-reading/hooks/use-reading-selectors';
import { useActiveTabSections } from '@/components/features/tabs/hooks/use-active-tab-sections';
import {
  ListPopover,
  ListPopoverContent,
  ListPopoverItem,
  ListPopoverTrigger,
} from '@/components/ui/list-popover';
import { cn } from '@/lib/utils';
import {
  extractSnippets,
  groupSnippets,
  type Snippet,
  type SnippetType,
} from '@/services/markdown/snippets';

const TYPE_CONFIG: Record<SnippetType, { label: string; Icon: React.FC<{ className?: string }> }> =
  {
    code: { label: 'Code', Icon: Code },
    image: { label: 'Images', Icon: Image },
    video: { label: 'Videos', Icon: Play },
    link: { label: 'Links', Icon: Link },
  };

interface SnippetsPanelProps {
  className?: string;
}

const SnippetsPanel: React.FC<SnippetsPanelProps> = memo(({ className }) => {
  const { sections, tabId, hasActiveTab } = useActiveTabSections();
  const { changeSection } = useReadingActionsById(tabId ?? '');

  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);

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

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedSnippet(null);
  }, [tabId]);

  const activeSnippets = useMemo(() => groups[activeTab] ?? [], [groups, activeTab]);
  const totalCount = snippets.length;

  const sectionGroups = useMemo(() => {
    const result: { sectionIndex: number; sectionTitle: string; items: Snippet[] }[] = [];
    for (const snippet of activeSnippets) {
      const last = result[result.length - 1];
      if (last && last.sectionIndex === snippet.sectionIndex) {
        last.items.push(snippet);
      } else {
        result.push({
          sectionIndex: snippet.sectionIndex,
          sectionTitle: snippet.sectionTitle,
          items: [snippet],
        });
      }
    }
    return result;
  }, [activeSnippets]);

  const handleNavigate = useCallback(
    (sectionIndex: number) => {
      changeSection(sectionIndex);
    },
    [changeSection]
  );

  const handleBack = useCallback(() => setSelectedSnippet(null), []);

  if (!hasActiveTab) {
    return (
      <div className={cn('flex flex-col flex-1 overflow-hidden', className)}>
        <div className="px-3 py-1.5 border-b border-border/30">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
            Snippets
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4">
          <Layers className="w-4 h-4 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground/40 text-center">No document open</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col flex-1 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-border/30 flex items-center gap-2">
        {selectedSnippet ? (
          <button
            onClick={handleBack}
            className={cn(
              'flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider',
              'text-muted-foreground/50 hover:text-foreground/70',
              'transition-colors duration-150 select-none'
            )}
          >
            <ArrowLeft className="w-3 h-3" />
            Snippets
          </button>
        ) : (
          <>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
              Snippets
            </span>
            {totalCount > 0 && (
              <span className="text-[10px] text-muted-foreground/30 tabular-nums">
                {totalCount}
              </span>
            )}
          </>
        )}
      </div>

      {selectedSnippet ? (
        <div>
          <SnippetDetail snippet={selectedSnippet} onNavigate={handleNavigate} />
        </div>
      ) : totalCount === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4">
          <Layers className="w-4 h-4 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground/40 text-center leading-relaxed">
            No code blocks, images, videos, or links found.
          </p>
        </div>
      ) : (
        <>
          {/* Type filter dropdown */}
          <div className="px-3 py-1.5 border-b border-border/30 shrink-0">
            <ListPopover>
              <ListPopoverTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-1.5 text-[11px] font-medium',
                    'text-muted-foreground hover:text-foreground transition-colors'
                  )}
                >
                  {(() => {
                    const { Icon, label } = TYPE_CONFIG[activeTab];
                    return (
                      <>
                        <Icon className="w-3 h-3" />
                        {label}
                        <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                          {groups[activeTab].length}
                        </span>
                      </>
                    );
                  })()}
                  <ChevronDown className="w-3 h-3 text-muted-foreground/40" />
                </button>
              </ListPopoverTrigger>
              <ListPopoverContent align="start">
                {(Object.keys(TYPE_CONFIG) as SnippetType[])
                  .filter((t) => groups[t].length > 0)
                  .map((type) => {
                    const { Icon, label } = TYPE_CONFIG[type];
                    return (
                      <ListPopoverItem
                        key={type}
                        isActive={activeTab === type}
                        icon={<Icon className="w-3.5 h-3.5" />}
                        suffix={
                          <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                            {groups[type].length}
                          </span>
                        }
                        onClick={() => setActiveTab(type)}
                      >
                        {label}
                      </ListPopoverItem>
                    );
                  })}
              </ListPopoverContent>
            </ListPopover>
          </div>

          {activeSnippets.length === 0 ? (
            <div className="p-4 text-center text-[11px] text-muted-foreground/40">
              No items in this category.
            </div>
          ) : (
            <div className="py-0.5">
              {sectionGroups.map((group) => (
                <div key={group.sectionIndex}>
                  <SectionDivider
                    sectionTitle={group.sectionTitle}
                    sectionIndex={group.sectionIndex}
                    count={group.items.length}
                    onNavigate={handleNavigate}
                  />
                  <div className="divide-y divide-border/10">
                    {group.items.map((snippet) => (
                      <SnippetRow key={snippet.id} snippet={snippet} onClick={setSelectedSnippet} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});

SnippetsPanel.displayName = 'SnippetsPanel';
export default SnippetsPanel;
