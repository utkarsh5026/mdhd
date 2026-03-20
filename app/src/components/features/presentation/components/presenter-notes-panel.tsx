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
        'border-t border-foreground/6 bg-background/90 backdrop-blur-xl',
        'animate-in slide-in-from-bottom-2 fade-in duration-300'
      )}
    >
      <div className="max-w-3xl mx-auto px-10 py-5 max-h-48 overflow-y-auto">
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50 mb-3 block">
          Speaker Notes
        </span>
        {notes ? (
          <div className="prose prose-sm max-w-none text-foreground/60 prose-p:text-sm prose-p:leading-relaxed prose-strong:text-foreground/70">
            <CustomMarkdownRenderer markdown={notes} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/35 italic">
            No notes for this slide. Add notes with {'<!-- notes -->'} in your markdown.
          </p>
        )}
      </div>
    </div>
  );
});

PresenterNotesPanel.displayName = 'PresenterNotesPanel';

export default PresenterNotesPanel;
