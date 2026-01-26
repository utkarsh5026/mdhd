import { Button } from '@/components/ui/button';
import { Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClipboardEvent } from 'react';
import styles from './markdown-editor.module.css';

interface MarkdownEditorProps {
  markdownInput: string;
  setMarkdownInput: (value: string) => void;
  handleStartReading: () => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  markdownInput,
  setMarkdownInput,
  handleStartReading,
}) => {
  const hasContent = markdownInput.trim().length > 0;

  const handleClear = () => {
    setMarkdownInput('');
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    setMarkdownInput(pastedText);
  };

  return (
    <div className={`space-y-4 ${styles.container}`}>
      <div className="relative">
        <textarea
          value={markdownInput}
          readOnly={hasContent}
          onPaste={handlePaste}
          onChange={(e) => !hasContent && setMarkdownInput(e.target.value)}
          placeholder="Paste your markdown here..."
          className={cn(
            'w-full h-80 p-5 rounded-3xl border border-border/50 resize-none',
            'bg-card/50 backdrop-blur-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
            'text-sm leading-relaxed placeholder:text-muted-foreground/60',
            'transition-all duration-200',
            hasContent && 'cursor-default'
          )}
        />
      </div>

      {hasContent && (
        <div className={`flex items-center justify-between gap-2 ${styles.actions}`}>
          <Button
            type="button"
            onClick={handleClear}
            className="gap-2 rounded-full z-50 bg-red-600/10 hover:bg-red-600/20 text-red-600 hover:text-red-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
          <span className="text-xs text-muted-foreground">
            {markdownInput.split(/\s+/).filter(Boolean).length} words
          </span>
          <Button
            type="button"
            onClick={handleStartReading}
            className="gap-2 rounded-full z-50 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary/70 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            Start Reading
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
