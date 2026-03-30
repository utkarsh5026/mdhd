import { Check, Copy, Link2, Loader2 } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import AdaptiveModal from '@/components/ui/adaptive-modal';
import { Button } from '@/components/ui/button';
import { shareFile } from '@/services/share';

import { type Tab } from '../../store/types';

interface ShareModalProps {
  tab: Tab | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareModal: React.FC<ShareModalProps> = memo(({ tab, open, onOpenChange }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !tab) return;

    setShareUrl('');
    setCopied(false);
    setShareLoading(true);

    shareFile(tab.title, tab.sourcePath ?? tab.title, tab.content)
      .then(({ url }) => setShareUrl(url))
      .catch(() => {
        toast.error('Failed to create share link');
        onOpenChange(false);
      })
      .finally(() => setShareLoading(false));
  }, [open, tab, onOpenChange]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  return (
    <AdaptiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <Link2 className="size-4 text-muted-foreground" />
          Share Document
        </span>
      }
      description="Anyone with this link can view the document."
    >
      {shareLoading ? (
        <div className="flex items-center gap-2 h-9 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Generating link…
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 h-9 flex items-center px-3 rounded-md border border-border bg-muted/30 font-mono text-xs text-muted-foreground truncate">
            {shareUrl}
          </div>
          <Button
            size="sm"
            variant={copied ? 'secondary' : 'outline'}
            onClick={handleCopy}
            disabled={!shareUrl}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      )}
    </AdaptiveModal>
  );
});

ShareModal.displayName = 'ShareModal';
export default ShareModal;
