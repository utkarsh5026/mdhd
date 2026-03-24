import { toPng } from 'html-to-image';
import { Check, Copy } from 'lucide-react';
import React, { useMemo, useRef } from 'react';

import { CodeImageExportDialog } from '@/components/features/image-export';
import { useExportSnippets } from '@/components/features/image-export/context/export-snippets-context';
import { LanguageIcon } from '@/components/features/image-export/utils/language-icons';
import { useMarkdownStyleStore } from '@/components/features/markdown-style/store/markdown-style-store';
import {
  getThemeBackground,
  useCodeDisplaySettingsStore,
  useCodeThemeStore,
  useReadingSettingsStore,
} from '@/components/features/settings';
import type { CodeDisplaySettings } from '@/components/features/settings/store/code-display-settings';
import type { ThemeKey } from '@/components/features/settings/store/code-theme';
import { BottomSheet, BottomSheetContent, BottomSheetTitle } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import ExportContextMenu from '@/components/ui/export-context-menu';
import { useCopyToClipboard, useToggle } from '@/hooks';
import { cn } from '@/lib/utils';
import { download, getNearestHeading, toFilename } from '@/utils/download';
import { tryAsync } from '@/utils/functions/error';

import type { TextSizeScale } from '../../utils/text-size-classes';
import CodeMirrorDisplay from './codemirror-display';

const CODE_BLOCK_CONTAINER_CLASSES = {
  rounded: { wrapper: 'rounded-2xl', inner: 'rounded-2xl' },
  sharp: { wrapper: 'rounded-none', inner: 'rounded-none' },
  bordered: { wrapper: 'rounded-xl border border-border/40', inner: 'rounded-xl' },
} as const;

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

interface CodeFullscreenSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  language: string;
  title: string;
  backgroundColor: string;
  displaySettings: CodeDisplaySettings;
  themeKey: ThemeKey;
}

const CodeFullscreenSheet: React.FC<CodeFullscreenSheetProps> = ({
  open,
  onOpenChange,
  code,
  language,
  title,
  backgroundColor,
  displaySettings,
  themeKey,
}) => {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent>
        <BottomSheetTitle>{title}</BottomSheetTitle>

        {language && (
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground mt-1">
            <LanguageIcon language={language} className="w-4 h-4" />
            <span className="text-sm font-medium lowercase tracking-wide">{language}</span>
          </div>
        )}

        <div
          className="mt-4 overflow-x-auto rounded-2xl border border-border/40 font-fira-code max-w-3xl mx-auto"
          style={{ backgroundColor }}
        >
          <div className="p-5">
            <CodeMirrorDisplay
              code={code}
              language={language}
              themeKey={themeKey}
              showLineNumbers={displaySettings.showLineNumbers}
              enableCodeFolding={displaySettings.enableCodeFolding}
              enableWordWrap
              fontSize="0.95rem"
              className="rounded-xl"
            />
          </div>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
};

/**
 * CodeRender — renders fenced code blocks with CodeMirror.
 *
 * Inline code detection is handled at the markdown-render level so this
 * component only mounts for actual block-level code. No DOM traversal needed.
 */
const CodeRender: React.FC<React.ComponentPropsWithoutRef<'code'>> = ({ className, children }) => {
  const { copiedText: copiedCode, copy } = useCopyToClipboard();
  const { state: imageDialogOpen, setTrue: openImageDialog, set: setImageDialogOpen } = useToggle();
  const { state: sheetOpen, setTrue: openSheet, set: setSheetOpen } = useToggle();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const codeBlockRef = useRef<HTMLDivElement>(null);

  const match = /language-(\w+)/.exec(className ?? '');
  const language = match ? match[1] : '';
  const { selectedTheme } = useCodeThemeStore();
  const { settings: displaySettings } = useCodeDisplaySettingsStore();
  const textSizeScale = useReadingSettingsStore((s) => s.settings.textSizeScale);
  const codeBlockContainerStyle = useMarkdownStyleStore((s) => s.settings.codeBlockContainerStyle);
  const { codeSnippets } = useExportSnippets();
  const containerClasses = CODE_BLOCK_CONTAINER_CLASSES[codeBlockContainerStyle];

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

        const dataUrl = await tryAsync(() => toPng(el, { pixelRatio: 2 }), null);
        if (dataUrl)
          download(dataUrl, toFilename(getNearestHeading(wrapperRef.current), 'png', 'code'));
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
        await copy(numbered);
      },
    },
    {
      label: 'Customize image',
      description: 'Carbon-style export',
      onSelect: openImageDialog,
    },
  ];

  const copyToClipboard = () => copy(codeContent);

  const backgroundColor = getThemeBackground(selectedTheme);

  return (
    <>
      <ExportContextMenu title={language ? `${language} block` : 'Code block'} items={exportItems}>
        <div
          ref={wrapperRef}
          className={cn(
            'my-8 relative font-fira-code no-swipe shadow-background/50 border-none',
            containerClasses.wrapper
          )}
        >
          {/* Language Label */}
          {displaySettings.showLanguageLabel && language && (
            <div className="absolute top-2 left-3 z-10 flex items-center gap-1.5 text-muted-foreground/70 select-none">
              <LanguageIcon language={language} className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium lowercase tracking-wide">{language}</span>
            </div>
          )}

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
                  copiedCode !== null
                    ? 'opacity-0 scale-0 rotate-90'
                    : 'opacity-100 scale-100 rotate-0'
                )}
              />
              <Check
                className={cn(
                  'absolute inset-0 w-4 h-4 transition-all duration-300',
                  copiedCode !== null
                    ? 'opacity-100 scale-100 rotate-0 text-green-600'
                    : 'opacity-0 scale-0 -rotate-90'
                )}
              />
            </div>
          </Button>

          {/* Code Content */}
          <div
            ref={codeBlockRef}
            className={cn('overflow-hidden p-4 cursor-zoom-in', containerClasses.inner)}
            style={{ backgroundColor }}
            onClick={openSheet}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') openSheet();
            }}
          >
            <CodeMirrorDisplay
              code={codeContent}
              language={language}
              themeKey={selectedTheme}
              showLineNumbers={displaySettings.showLineNumbers}
              enableCodeFolding={displaySettings.enableCodeFolding}
              enableWordWrap={displaySettings.enableWordWrap}
              fontSize={CODE_FONT_SIZES[textSizeScale]}
              className={containerClasses.inner}
            />
          </div>
        </div>
      </ExportContextMenu>

      {imageDialogOpen && (
        <CodeImageExportDialog
          open={imageDialogOpen}
          onOpenChange={setImageDialogOpen}
          code={codeContent}
          language={language}
          codeSnippets={codeSnippets}
        />
      )}

      <CodeFullscreenSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        code={codeContent}
        language={language}
        title={getNearestHeading(wrapperRef.current) || 'Code block'}
        backgroundColor={backgroundColor}
        displaySettings={displaySettings}
        themeKey={selectedTheme}
      />
    </>
  );
};

export default CodeRender;
