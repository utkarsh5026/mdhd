import { toPng } from 'html-to-image';
import { Check, Copy } from 'lucide-react';
import React, { useMemo, useRef } from 'react';

import {
  download,
  getNearestHeading,
  toFilename,
} from '@/components/features/markdown-render/utils/file';
import { useCodeDisplaySettingsStore } from '@/components/features/settings/store/code-display-settings';
import { useCodeThemeStore } from '@/components/features/settings/store/code-theme';
import { getThemeBackground } from '@/components/features/settings/store/codemirror-themes';
import { useReadingSettingsStore } from '@/components/features/settings/store/reading-settings-store';
import { Button } from '@/components/ui/button';
import ExportContextMenu from '@/components/ui/export-context-menu';
import { cn } from '@/lib/utils';

import type { TextSizeScale } from '../../utils/text-size-classes';
import CodeMirrorDisplay from './codemirror-display';

const CODE_FONT_SIZES: Record<TextSizeScale, string> = {
  xs: '0.75rem',
  sm: '0.8rem',
  base: '0.875rem',
  lg: '1rem',
  xl: '1.125rem',
};

const LANGUAGE_TO_EXT: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  ruby: 'rb',
  shell: 'sh',
  bash: 'sh',
  text: 'txt',
  plaintext: 'txt',
};

/**
 * CodeRender — renders fenced code blocks with CodeMirror.
 *
 * Inline code detection is handled at the markdown-render level so this
 * component only mounts for actual block-level code. No DOM traversal needed.
 */
const CodeRender: React.FC<React.ComponentPropsWithoutRef<'code'>> = ({ className, children }) => {
  const [copied, setCopied] = React.useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const codeBlockRef = useRef<HTMLDivElement>(null);

  const match = /language-(\w+)/.exec(className ?? '');
  const language = match ? match[1] : '';
  const { selectedTheme } = useCodeThemeStore();
  const { settings: displaySettings } = useCodeDisplaySettingsStore();
  const textSizeScale = useReadingSettingsStore((s) => s.settings.textSizeScale);

  const codeContent = useMemo(() => {
    return typeof children === 'string'
      ? children.replace(/\n$/, '')
      : React.Children.toArray(children).join('');
  }, [children]);

  const ext = LANGUAGE_TO_EXT[language.toLowerCase()] ?? (language || 'txt');

  const exportItems = [
    {
      label: 'Download as file',
      description: `.${ext} file`,
      onSelect: () => {
        const blob = new Blob([codeContent], { type: 'text/plain;charset=utf-8;' });
        download(
          URL.createObjectURL(blob),
          toFilename(getNearestHeading(wrapperRef.current), ext, 'code'),
          true
        );
      },
    },
    {
      label: 'Image',
      description: 'PNG · 2× resolution',
      onSelect: async () => {
        const el = codeBlockRef.current;
        if (!el) return;
        try {
          const dataUrl = await toPng(el, { pixelRatio: 2 });
          download(dataUrl, toFilename(getNearestHeading(wrapperRef.current), 'png', 'code'));
        } catch (err) {
          console.error('[CodeRender] image export failed', err);
        }
      },
    },
    {
      label: 'Copy with line numbers',
      description: 'Numbered lines',
      onSelect: async () => {
        const lines = codeContent.split('\n');
        const pad = lines.length.toString().length;
        const numbered = lines
          .map((line, i) => `${String(i + 1).padStart(pad, ' ')}  ${line}`)
          .join('\n');
        try {
          await navigator.clipboard.writeText(numbered);
        } catch (err) {
          console.error('[CodeRender] copy with line numbers failed', err);
        }
      },
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const backgroundColor = getThemeBackground(selectedTheme);

  return (
    <ExportContextMenu title={language ? `${language} block` : 'Code block'} items={exportItems}>
      <div
        ref={wrapperRef}
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
        <div
          ref={codeBlockRef}
          className="rounded-2xl overflow-hidden p-2"
          style={{ backgroundColor }}
        >
          <CodeMirrorDisplay
            code={codeContent}
            language={language}
            themeKey={selectedTheme}
            showLineNumbers={displaySettings.showLineNumbers}
            enableCodeFolding={displaySettings.enableCodeFolding}
            enableWordWrap={displaySettings.enableWordWrap}
            fontSize={CODE_FONT_SIZES[textSizeScale]}
            className="rounded-2xl"
          />
        </div>
      </div>
    </ExportContextMenu>
  );
};

export default CodeRender;
