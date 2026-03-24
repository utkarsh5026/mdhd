import { createContext, useContext, useMemo } from 'react';

import type { CodeSnippet, ImageSnippet } from '@/services/markdown/snippets';
import { extractSnippets, groupSnippets } from '@/services/markdown/snippets';
import type { MarkdownSection } from '@/services/section/parsing';

interface ExportSnippetsContextValue {
  codeSnippets: CodeSnippet[];
  imageSnippets: ImageSnippet[];
}

const ExportSnippetsContext = createContext<ExportSnippetsContextValue>({
  codeSnippets: [],
  imageSnippets: [],
});

export const ExportSnippetsProvider: React.FC<{
  sections: MarkdownSection[];
  children: React.ReactNode;
}> = ({ sections, children }) => {
  const value = useMemo(() => {
    const snippets = extractSnippets(sections);
    const groups = groupSnippets(snippets);
    return { codeSnippets: groups.code, imageSnippets: groups.image };
  }, [sections]);

  return <ExportSnippetsContext.Provider value={value}>{children}</ExportSnippetsContext.Provider>;
};

export const useExportSnippets = () => useContext(ExportSnippetsContext);
