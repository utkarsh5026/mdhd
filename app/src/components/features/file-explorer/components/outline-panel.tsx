import React, { memo } from 'react';

import { cn } from '@/lib/utils';

import { SidebarToc } from './sidebar-toc';

interface OutlinePanelProps {
  className?: string;
}

const OutlinePanel: React.FC<OutlinePanelProps> = memo(({ className }) => {
  return (
    <div className={cn('flex flex-col flex-1 overflow-hidden', className)}>
      <div className="px-3 py-1.5 border-b border-border/30">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
          Outline
        </span>
      </div>
      <SidebarToc className="flex-1" />
    </div>
  );
});

OutlinePanel.displayName = 'OutlinePanel';
export default OutlinePanel;
