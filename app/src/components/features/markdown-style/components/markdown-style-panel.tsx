import { Loader2 } from 'lucide-react';
import React, { lazy, memo, Suspense } from 'react';

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

const SectionLoader = () => (
  <div className="flex items-center justify-center py-6">
    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  </div>
);

const Divider: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2 py-1">
    <div className="h-px flex-1 bg-border/30" />
    <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
      {label}
    </span>
    <div className="h-px flex-1 bg-border/30" />
  </div>
);

const MarkdownStylePanel: React.FC = memo(() => {
  return (
    <div className="h-full flex flex-col font-cascadia-code">
      <div className="px-3 pt-3 pb-2 border-b border-border/50 shrink-0">
        <div className="text-xs font-semibold text-foreground">Style</div>
        <div className="text-[10px] text-muted-foreground">
          Customize markdown element appearance
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-xs">
        <Suspense fallback={<SectionLoader />}>
          <HeadingStyleSettings />
        </Suspense>

        <Divider label="Blockquote" />

        <Suspense fallback={<SectionLoader />}>
          <BlockquoteStyleSettings />
        </Suspense>

        <Divider label="Lists" />

        <Suspense fallback={<SectionLoader />}>
          <ListStyleSettings />
        </Suspense>

        <Divider label="Code" />

        <Suspense fallback={<SectionLoader />}>
          <CodeBlockStyleSettings />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <InlineCodeStyleSettings />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <div className="space-y-5 [&_h3]:text-sm [&_p]:text-xs [&_.text-base]:text-sm [&_.text-sm]:text-xs">
            <CodeDisplaySelector />
            <div className="border-t border-border/20 pt-4">
              <CodeThemeSelector />
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  );
});

MarkdownStylePanel.displayName = 'MarkdownStylePanel';
export default MarkdownStylePanel;
