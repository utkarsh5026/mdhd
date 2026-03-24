import { Loader2, Palette, RotateCcw } from 'lucide-react';
import React, { lazy, memo, Suspense } from 'react';

import { Button } from '@/components/ui/button';

import { useMarkdownStyleStore } from '../store/markdown-style-store';

const HeadingStyleSettings = lazy(() => import('./heading-style'));
const BlockquoteStyleSettings = lazy(() => import('./blockquote-style'));
const ListStyleSettings = lazy(() => import('./list-style'));
const CodeBlockStyleSettings = lazy(() => import('./code-block-style'));
const InlineCodeStyleSettings = lazy(() => import('./inline-code-style'));
const CodeDisplaySelector = lazy(
  () => import('@/components/features/settings/components/code-display-selector')
);
const CodeThemeSelector = lazy(
  () => import('@/components/features/settings/components/code-theme-selector')
);
const FontFamilySelector = lazy(
  () => import('@/components/features/settings/components/font-family-selector')
);

const SectionLoader = () => (
  <div className="flex items-center justify-center py-6">
    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  </div>
);

const GroupLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2 pt-2 pb-1">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
      {label}
    </span>
    <div className="h-px flex-1 bg-border/15" />
  </div>
);

const MarkdownStylePanel: React.FC = memo(() => {
  const resetSettings = useMarkdownStyleStore((s) => s.resetSettings);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-2xl">
              <Palette className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">Markdown Style</div>
              <div className="text-[10px] text-muted-foreground">Element appearance</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={resetSettings}
            title="Reset all styles to default"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs">
        <GroupLabel label="Typography" />

        <Suspense fallback={<SectionLoader />}>
          <div className="[&_h3]:text-sm [&_p]:text-xs [&_.text-base]:text-sm [&_.text-sm]:text-xs">
            <FontFamilySelector />
          </div>
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <HeadingStyleSettings />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <BlockquoteStyleSettings />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <ListStyleSettings />
        </Suspense>

        <GroupLabel label="Code" />

        <Suspense fallback={<SectionLoader />}>
          <CodeBlockStyleSettings />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <InlineCodeStyleSettings />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <div className="space-y-5 [&_h3]:text-sm [&_p]:text-xs [&_.text-base]:text-sm [&_.text-sm]:text-xs">
            <CodeDisplaySelector />
            <CodeThemeSelector />
          </div>
        </Suspense>
      </div>
    </div>
  );
});

MarkdownStylePanel.displayName = 'MarkdownStylePanel';
export default MarkdownStylePanel;
