import React, { useEffect, useRef, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCodeThemeStore } from '@/components/features/settings/store/code-theme';
import { useCodeDisplaySettingsStore } from '@/components/features/settings/store/code-display-settings';
import { Button } from '@/components/ui/button';
import { useCodeDetection } from '../../hooks/use-code-detection';
import CodeMirrorDisplay from './codemirror-display';
import { getThemeBackground } from '@/components/features/settings/store/codemirror-themes';

interface CodeRenderProps extends React.ComponentPropsWithoutRef<'code'> {
  inline?: boolean;
}

const getHeadingCodeStyle = (headingLevel: number | null) => {
  if (!headingLevel) return 'text-sm sm:text-base';
  const sizes = {
    1: 'text-xl sm:text-3xl',
    2: 'text-lg sm:text-2xl',
    3: 'text-base sm:text-xl',
  };
  return `${sizes[headingLevel as keyof typeof sizes]
    } mx-1 sm:mx-2 px-2 py-1 bg-primary/10 rounded-xl sm:rounded-2xl`;
};

const CodeRender: React.FC<CodeRenderProps> = ({ inline, className, children }) => {
  const [copied, setCopied] = React.useState(false);

  const match = /language-(\w+)/.exec(className ?? '');
  const language = match ? match[1] : '';
  const { selectedTheme } = useCodeThemeStore();
  const { settings: displaySettings } = useCodeDisplaySettingsStore();

  const codeRef = useRef<HTMLDivElement>(null);

  const { isInTableCell, headingLevel, inList, isInParagraph, detectCodeInContext } =
    useCodeDetection(codeRef, 3);

  useEffect(() => {
    detectCodeInContext();
  }, [detectCodeInContext]);

  const codeContent = useMemo(() => {
    return typeof children === 'string'
      ? children.replace(/\n$/, '') // Remove trailing newline
      : React.Children.toArray(children).join('');
  }, [children]);

  const isCompactCode =
    typeof codeContent === 'string' && !codeContent.includes('\n') && codeContent.length < 25;


  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const showSimpleCode = isInTableCell || inList || isInParagraph || (!inline && isCompactCode);

  if (showSimpleCode) {
    return (
      <span ref={codeRef}>
        <code
          className={cn(
            'px-2 py-1 text-primary font-cascadia-code wrap-break-word  bg-card/50 rounded-full shadow-sm',
            getHeadingCodeStyle(headingLevel)
          )}
        >
          {codeContent}
        </code>
      </span>
    );
  }

  const backgroundColor = getThemeBackground(selectedTheme);

  return (
    <div
      ref={codeRef}
      className="my-8 relative font-fira-code no-swipe shadow-background/50 rounded-2xl border-none"
    >
      {/* Copy Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={copyToClipboard}
        className="absolute top-2 right-2 z-10 gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-xl cursor-pointer h-8 px-3"
      >
        <div className="relative">
          <Copy
            className={cn(
              'w-4 h-4 transition-all duration-300 text-muted-foreground',
              copied ? 'opacity-0 scale-0 rotate-90' : 'opacity-100 scale-100 rotate-0'
            )}
          />
          <Check
            className={cn(
              'absolute inset-0 w-4 h-4 transition-all duration-300',
              copied
                ? 'opacity-100 scale-100 rotate-0 text-green-600'
                : 'opacity-0 scale-0 -rotate-90'
            )}
          />
        </div>
      </Button>

      {/* Code Content */}
      <div className="rounded-2xl overflow-hidden p-2" style={{ backgroundColor }}>
        <CodeMirrorDisplay
          code={codeContent}
          language={language}
          themeKey={selectedTheme}
          showLineNumbers={displaySettings.showLineNumbers}
          enableCodeFolding={displaySettings.enableCodeFolding}
          enableWordWrap={displaySettings.enableWordWrap}
          className="rounded-2xl"
        />
      </div>
    </div>
  );
};



export default CodeRender;
