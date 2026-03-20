import { ArrowLeft, Code, Image, Layers, Link, Play } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import SideSheet, { SideSheetBody, SideSheetHeader } from '@/components/ui/side-sheet';
import { cn } from '@/lib/utils';
import {
  extractSnippets,
  groupSnippets,
  type Snippet,
  type SnippetGroups,
  type SnippetType,
} from '@/services/markdown/snippets';
import type { MarkdownSection } from '@/services/section/parsing';

import { type ActiveTab, SectionDivider, SnippetDetail, SnippetRow } from './snippets-sheet';

const TAB_CONFIG: Record<SnippetType, { label: string; Icon: React.FC<{ className?: string }> }> = {
  code: { label: 'Code', Icon: Code },
  image: { label: 'Images', Icon: Image },
  video: { label: 'Videos', Icon: Play },
  link: { label: 'Links', Icon: Link },
};

interface TypeTabsProps {
  groups: SnippetGroups;
  active: ActiveTab;
  onChange: (t: ActiveTab) => void;
}

export const TypeTabs: React.FC<TypeTabsProps> = ({ groups, active, onChange }) => {
  const visibleTabs = (Object.keys(TAB_CONFIG) as SnippetType[]).filter(
    (t) => groups[t].length > 0
  );

  return (
    <div className="flex gap-1 px-3 py-2.5 border-b border-border/10 overflow-x-auto shrink-0 font-cascadia-code">
      {visibleTabs.map((type) => {
        const { label, Icon } = TAB_CONFIG[type];
        const count = groups[type].length;
        const isActive = active === type;
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs whitespace-nowrap',
              'transition-all duration-200 font-medium border border-border/50',
              isActive
                ? 'text-foreground bg-background/10 shadow-sm shadow-foreground/5'
                : 'text-muted-foreground/50 hover:text-muted-foreground/70 hover:bg-accent/25'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span
              className={cn(
                'text-[10px] tabular-nums ml-0.5 px-1.5 py-px rounded-full',
                isActive ? 'text-foreground/50 bg-foreground/5' : 'text-muted-foreground/30'
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

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
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);

  useEffect(() => {
    if (!open) setSelectedSnippet(null);
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

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  const handleBack = useCallback(() => setSelectedSnippet(null), []);

  const handleNavigate = useCallback(
    (sectionIndex: number) => {
      onNavigateToSection(sectionIndex);
      onOpenChange(false);
    },
    [onNavigateToSection, onOpenChange]
  );

  return (
    <SideSheet open={open} onOpenChange={onOpenChange} size="md">
      <SideSheetHeader onClose={handleClose}>
        {selectedSnippet ? (
          <button
            onClick={handleBack}
            className={cn(
              'flex items-center gap-1 text-[13px] font-cascadia-code',
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
      </SideSheetHeader>

      {selectedSnippet ? (
        <SideSheetBody className="font-cascadia-code">
          <SnippetDetail snippet={selectedSnippet} onNavigate={handleNavigate} />
        </SideSheetBody>
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
          <SideSheetBody>
            <ScrollArea className="h-full **:data-[slot=scroll-area-viewport]:overflow-x-hidden! [&_[data-slot=scroll-area-viewport]>div]:block! font-cascadia-code">
              {activeSnippets.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No {TAB_CONFIG[activeTab].label.toLowerCase()} in this document.
                </div>
              ) : (
                <div className="py-0.5 overflow-hidden">
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
                          <SnippetRow
                            key={snippet.id}
                            snippet={snippet}
                            onClick={setSelectedSnippet}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SideSheetBody>
        </>
      )}
    </SideSheet>
  );
};

export default memo(SnippetsSheet);
