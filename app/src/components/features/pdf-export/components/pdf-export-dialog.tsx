import { FileText, Loader2 } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';

import { type PdfExportSettings, usePdfExport } from '../hooks/use-pdf-export';

export interface PdfExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sections: MarkdownSection[];
  metadata: MarkdownMetadata | null;
}

const PdfExportDialog: React.FC<PdfExportDialogProps> = memo(
  ({ open, onOpenChange, title, sections, metadata }) => {
    const { exportPdf, isExporting } = usePdfExport();

    const [settings, setSettings] = useState<PdfExportSettings>({
      includeTableOfContents: true,
      includeMetadata: true,
      pageSize: 'a4',
    });

    const handleExport = useCallback(() => {
      exportPdf(title, sections, metadata, settings);
    }, [exportPdf, title, sections, metadata, settings]);

    const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Export to PDF
            </DialogTitle>
            <DialogDescription>
              Export &ldquo;{title}&rdquo; as a print-optimized PDF. Uses your current reading font
              and settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Document info */}
            <div className="flex gap-4 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
              <span>{sections.length} sections</span>
              <span>{totalWords.toLocaleString()} words</span>
            </div>

            {/* Page Size */}
            <div className="flex items-center justify-between">
              <Label htmlFor="page-size" className="text-sm">
                Page size
              </Label>
              <Select
                value={settings.pageSize}
                onValueChange={(value: 'a4' | 'letter' | 'legal') =>
                  setSettings((s) => ({ ...s, pageSize: value }))
                }
              >
                <SelectTrigger id="page-size" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Include Table of Contents */}
            <div className="flex items-center justify-between">
              <Label htmlFor="include-toc" className="text-sm">
                Include table of contents
              </Label>
              <Switch
                id="include-toc"
                checked={settings.includeTableOfContents}
                onCheckedChange={(checked: boolean) =>
                  setSettings((s) => ({ ...s, includeTableOfContents: checked }))
                }
              />
            </div>

            {/* Include Metadata */}
            {metadata && (
              <div className="flex items-center justify-between">
                <Label htmlFor="include-metadata" className="text-sm">
                  Include document metadata
                </Label>
                <Switch
                  id="include-metadata"
                  checked={settings.includeMetadata}
                  onCheckedChange={(checked: boolean) =>
                    setSettings((s) => ({ ...s, includeMetadata: checked }))
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <FileText className="size-4" />
                  Export PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

PdfExportDialog.displayName = 'PdfExportDialog';

export default PdfExportDialog;
