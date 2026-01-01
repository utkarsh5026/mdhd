import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Copy,
  ChevronDown,
  ChevronRight,
  Palette,
  Check,
  Maximize2,
  Image,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import getIconForTech from "@/components/shared/icons/";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  useCodeThemeStore,
  type ThemeKey,
} from "@/components/features/settings/store/code-theme";
import { useCodeDisplaySettingsStore } from "@/components/features/settings/store/code-display-settings";
import { Button } from "@/components/ui/button";
import { downloadAsFile, downloadAsImage } from "@/utils/download";
import { Badge } from "@/components/ui/badge";
import { useCodeDetection } from "../../hooks/use-code-detection";
import { useSetDialogOpen } from "@/components/features/content-reading/store/use-reading-store";
import CodeMirrorDisplay from "./codemirror-display";
import { getThemeBackground } from "@/components/features/settings/store/codemirror-themes";

interface CodeRenderProps extends React.ComponentPropsWithoutRef<"code"> {
  inline?: boolean;
}

interface CodePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: string;
  codeContent: string;
  onDownloadAsImage: () => void;
  onDownloadAsFile: () => void;
  downloading: "image" | "file" | null;
  onCopy: () => void;
  copied: boolean;
  dialogCodeRef: React.RefObject<HTMLDivElement | null>;
  themeKey: ThemeKey;
  showLineNumbers: boolean;
  enableCodeFolding: boolean;
  enableWordWrap: boolean;
}

const getHeadingCodeStyle = (headingLevel: number | null) => {
  if (!headingLevel) return "text-sm sm:text-base";
  const sizes = {
    1: "text-xl sm:text-3xl",
    2: "text-lg sm:text-2xl",
    3: "text-base sm:text-xl",
  };
  return `${
    sizes[headingLevel as keyof typeof sizes]
  } mx-1 sm:mx-2 px-2 py-1 bg-primary/10 rounded-xl sm:rounded-2xl`;
};

/**
 * Code Preview Dialog Component
 *
 * A full-screen dialog for better code inspection with download capabilities
 * and theme customization.
 */
const CodePreviewDialog: React.FC<CodePreviewDialogProps> = ({
  open,
  onOpenChange,
  language,
  codeContent,
  onDownloadAsImage,
  onDownloadAsFile,
  downloading,
  onCopy,
  copied,
  dialogCodeRef,
  themeKey,
  showLineNumbers,
  enableCodeFolding,
  enableWordWrap,
}) => {
  const backgroundColor = getThemeBackground(themeKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] sm:max-w-[95vw] sm:w-[95vw] xl:max-w-[90vw] xl:w-[90vw] 2xl:max-w-[85vw] 2xl:w-[85vw] h-[95vh] sm:h-[90vh] p-0 font-cascadia-code rounded-2xl sm:rounded-3xl border-none shadow-2xl shadow-black/20 overflow-y-auto">
        <DialogHeader className="relative px-3 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-6 border-b border-border/50 bg-gradient-to-r from-card/80 via-card/60 to-card/40 backdrop-blur-xl rounded-t-2xl sm:rounded-t-3xl">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-t-2xl sm:rounded-t-3xl" />

          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center flex-1 min-w-0">
              {/* Mobile: Smaller icon, Desktop: Original size */}
              <div className="relative flex-shrink-0">
                {/* Icon with subtle glow effect */}
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                <div className="relative p-2 sm:p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl sm:rounded-2xl border border-primary/20 backdrop-blur-sm">
                  {(() => {
                    const IconComponent = getIconForTech(language || "code");
                    return (
                      <IconComponent className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                    );
                  })()}
                </div>
              </div>

              <div className="ml-3 sm:ml-4 space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent truncate">
                  Code Preview
                </DialogTitle>
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Badge
                    variant="outline"
                    className="text-xs px-1.5 py-0.5 sm:px-2 bg-primary/10 text-primary border-none flex-shrink-0 rounded-2xl hidden sm:block"
                  >
                    {language || "plaintext"}
                  </Badge>
                  <span className="hidden xs:inline">•</span>
                  <span className="hidden xs:inline truncate">
                    {codeContent.split("\n").length} lines
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons - More compact on mobile */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0 mr-10 sm:mr-12">
              <div className="flex items-center gap-0.5 sm:gap-2 p-1 bg-card/50 rounded-xl sm:rounded-2xl border border-border/50 backdrop-blur-sm">
                {/* Theme Selector - Hidden on very small screens */}
                <div className="hidden xs:block">
                  <ThemeSelector />
                </div>

                {/* Copy Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCopy}
                  className="gap-1 sm:gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-xl sm:rounded-2xl cursor-pointer h-8 px-2 sm:px-3"
                >
                  <div className="relative">
                    <Copy
                      className={cn(
                        "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300",
                        copied
                          ? "opacity-0 scale-0 rotate-90"
                          : "opacity-100 scale-100 rotate-0"
                      )}
                    />
                    <Check
                      className={cn(
                        "absolute inset-0 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300",
                        copied
                          ? "opacity-100 scale-100 rotate-0 text-green-600"
                          : "opacity-0 scale-0 -rotate-90"
                      )}
                    />
                  </div>
                  <span className="hidden md:inline">Copy</span>
                </Button>

                {/* Download as Image Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDownloadAsImage}
                  disabled={downloading === "image"}
                  className="gap-1 sm:gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-xl sm:rounded-2xl cursor-pointer h-8 px-2 sm:px-3"
                >
                  {downloading === "image" ? (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden md:inline">Image</span>
                </Button>

                {/* Download as File Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDownloadAsFile}
                  disabled={downloading === "file"}
                  className="gap-1 sm:gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-200 cursor-pointer rounded-xl sm:rounded-2xl h-8 px-2 sm:px-3"
                >
                  {downloading === "file" ? (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden md:inline">File</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-3 sm:p-4 lg:p-6 relative overflow-hidden">
          <div
            className="rounded-xl sm:rounded-2xl overflow-hidden h-full"
            style={{ backgroundColor }}
          >
            <ScrollArea className="h-full max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)] lg:max-h-[calc(90vh-180px)]">
              <CodeMirrorDisplay
                ref={dialogCodeRef}
                code={codeContent}
                language={language}
                themeKey={themeKey}
                isDialog
                showLineNumbers={showLineNumbers}
                enableCodeFolding={enableCodeFolding}
                enableWordWrap={enableWordWrap}
                className="rounded-xl sm:rounded-2xl"
              />
              <ScrollBar orientation="horizontal" className="bg-muted/50" />
              <ScrollBar orientation="vertical" className="bg-muted/50" />
            </ScrollArea>
          </div>
        </div>
      </DialogContent>

      <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
    </Dialog>
  );
};

/**
 * Enhanced CodeRender Component with Dialog View
 *
 * This component provides a comprehensive code rendering solution with:
 * - Syntax highlighting using CodeMirror 6
 * - Theme customization with real-time preview
 * - Copy functionality with visual feedback
 * - Collapsible code blocks for space efficiency
 * - Full-screen dialog view for better code inspection
 * - Download capabilities (as image or code file)
 * - Responsive design for mobile and desktop
 * - Smart detection of inline vs block code
 * - Line numbers and code folding
 */
const CodeRender: React.FC<CodeRenderProps> = ({
  inline,
  className,
  children,
}) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState<"image" | "file" | null>(null);
  const setGlobalDialogOpen = useSetDialogOpen();

  const match = /language-(\w+)/.exec(className ?? "");
  const language = match ? match[1] : "";
  const { selectedTheme } = useCodeThemeStore();
  const { settings: displaySettings } = useCodeDisplaySettingsStore();

  const codeRef = useRef<HTMLDivElement>(null);
  const dialogCodeRef = useRef<HTMLDivElement | null>(null);

  const {
    isInTableCell,
    headingLevel,
    inList,
    isInParagraph,
    detectCodeInContext,
  } = useCodeDetection(codeRef, 3);

  useEffect(() => {
    detectCodeInContext();
  }, [detectCodeInContext]);

  const codeContent = useMemo(() => {
    return typeof children === "string"
      ? children.replace(/\n$/, "") // Remove trailing newline
      : React.Children.toArray(children).join("");
  }, [children]);

  const isCompactCode =
    typeof codeContent === "string" &&
    !codeContent.includes("\n") &&
    codeContent.length < 25;

  /**
   * Copy to Clipboard Functionality
   *
   * Copies the code content to user's clipboard and provides
   * visual feedback with a temporary success state.
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  /**
   * Download as Image Functionality
   *
   * Converts the code display to a canvas and downloads it as PNG.
   * Handles horizontal overflow by temporarily expanding the container.
   */
  const handleDownloadAsImage = () => {
    setDownloading("image");
    if (dialogCodeRef.current) {
      downloadAsImage(dialogCodeRef.current, language).then(() => {
        setDownloading(null);
      });
    } else {
      setDownloading(null);
    }
  };

  /**
   * Download as File Functionality
   *
   * Creates a text file with the code content and triggers download.
   * File extension is determined by the detected language.
   */
  const handleDownloadAsFile = () => {
    setDownloading("file");
    downloadAsFile(codeContent, language);
    setDownloading(null);
  };

  /**
   * Handle Dialog Open/Close
   *
   * Updates both local and global dialog state to hide navigation controls
   * when the code preview dialog is open.
   */
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    setGlobalDialogOpen(open);
  };

  const showSimpleCode =
    isInTableCell || inList || isInParagraph || (!inline && isCompactCode);

  if (showSimpleCode) {
    return (
      <span ref={codeRef}>
        <code
          className={cn(
            "px-2 py-1 text-primary font-cascadia-code break-words  bg-card/50 rounded-full shadow-sm",
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        ref={codeRef}
        className="my-8 relative font-fira-code no-swipe shadow-background/50 rounded-2xl border-none"
      >
        {/* Code Block Header */}
        <div className="bg-card text-muted-foreground px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold border-b border-border flex justify-between items-center rounded-t-2xl">
          {/* Language indicator with icon */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <span className="flex-shrink-0">
              {(() => {
                const IconComponent = getIconForTech(language || "code");
                return <IconComponent className="w-4 h-4" />;
              })()}
            </span>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Copy Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 px-2 transition-all duration-300 cursor-pointer"
              aria-label={copied ? "Copied!" : "Copy code"}
            >
              <div className="relative">
                <Copy
                  size={14}
                  className={cn(
                    "transition-all duration-300",
                    copied
                      ? "opacity-0 scale-0 rotate-90"
                      : "opacity-100 scale-100 rotate-0"
                  )}
                />
                <Check
                  size={14}
                  className={cn(
                    "absolute inset-0 transition-all duration-300 text-green-400",
                    copied
                      ? "opacity-100 scale-100 rotate-0"
                      : "opacity-0 scale-0 -rotate-90"
                  )}
                />
              </div>
            </Button>

            {/* Expand to Dialog Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 cursor-pointer"
              aria-label="Open in dialog"
              onClick={() => handleDialogOpenChange(true)}
            >
              <Maximize2 size={14} />
            </Button>

            {/* Collapse Toggle */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 cursor-pointer"
                aria-label={isOpen ? "Collapse code" : "Expand code"}
              >
                {isOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Collapsible Code Content */}
        <CollapsibleContent className="data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
          <div
            className="rounded-b-2xl overflow-hidden"
            style={{ backgroundColor }}
          >
            <CodeMirrorDisplay
              code={codeContent}
              language={language}
              themeKey={selectedTheme}
              showLineNumbers={displaySettings.showLineNumbers}
              enableCodeFolding={displaySettings.enableCodeFolding}
              enableWordWrap={displaySettings.enableWordWrap}
              className="rounded-b-2xl"
            />
          </div>
        </CollapsibleContent>
      </div>

      {/* Code Preview Dialog */}
      <CodePreviewDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        language={language}
        codeContent={codeContent}
        onDownloadAsImage={handleDownloadAsImage}
        onDownloadAsFile={handleDownloadAsFile}
        downloading={downloading}
        onCopy={copyToClipboard}
        copied={copied}
        dialogCodeRef={dialogCodeRef}
        themeKey={selectedTheme}
        showLineNumbers={displaySettings.showLineNumbers}
        enableCodeFolding={displaySettings.enableCodeFolding}
        enableWordWrap={displaySettings.enableWordWrap}
      />
    </Collapsible>
  );
};

/**
 * Theme Selector Component
 *
 * Reusable dropdown component for theme selection with
 * organized categories and current theme indication.
 */
const ThemeSelector = ({
  size = "default",
}: {
  size?: "default" | "small";
}) => {
  const { selectedTheme, setTheme, getCurrentThemeName, getThemesByCategory } =
    useCodeThemeStore();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === "small" ? "sm" : "icon"}
          className={cn(
            "transition-colors cursor-pointer",
            size === "small" ? "h-8 px-3" : "p-2 h-10 w-10"
          )}
          aria-label="Select theme"
        >
          <Palette className={cn(size === "small" ? "w-3 h-3" : "w-4 h-4")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-52 max-h-64 overflow-y-auto bg-card rounded-2xl font-fira-code"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground px-3 py-2">
          Current: {getCurrentThemeName()}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(getThemesByCategory()).map(([category, themes]) => (
          <React.Fragment key={category}>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
              {category}
            </DropdownMenuLabel>
            {Object.entries(themes).map(([themeKey, theme]) => (
              <DropdownMenuItem
                key={themeKey}
                onClick={() => setTheme(themeKey as ThemeKey)}
                className={cn(
                  "cursor-pointer text-sm py-2.5",
                  selectedTheme === themeKey &&
                    "bg-accent text-accent-foreground"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{theme.name}</span>
                  {selectedTheme === themeKey && (
                    <Check className="w-3 h-3 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CodeRender;
