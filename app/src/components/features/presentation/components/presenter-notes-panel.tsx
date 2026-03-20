import { memo, useMemo } from 'react';

import CustomMarkdownRenderer from '@/components/features/markdown-render/components/markdown-render';
import { cn } from '@/lib/utils';
import type { MarkdownSection } from '@/services/section/parsing';

import { parsePresenterNotes } from '../utils/parse-notes';

interface PresenterNotesPanelProps {
  section: MarkdownSection;
  visible: boolean;
}

const PresenterNotesPanel: React.FC<PresenterNotesPanelProps> = memo(({ section, visible }) => {
  const { notes } = useMemo(() => parsePresenterNotes(section.content), [section.content]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'border-t border-border/30 bg-background/95 backdrop-blur-sm',
        'animate-in slide-in-from-bottom-2 fade-in duration-200'
      )}
    >
      <div className="max-w-3xl mx-auto px-8 py-5 max-h-48 overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Speaker Notes
          </span>
        </div>
        {notes ? (
          <div className="prose prose-sm prose-invert max-w-none text-muted-foreground prose-p:text-sm prose-p:leading-relaxed">
            <CustomMarkdownRenderer markdown={notes} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">
            No notes for this slide. Add notes with {'<!-- notes -->'} in your markdown.
          </p>
        )}
      </div>
    </div>
  );
});

PresenterNotesPanel.displayName = 'PresenterNotesPanel';

export default PresenterNotesPanel;
