import React, { useEffect, useState, useRef, useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
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
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCodeThemeStore, type ThemeKey } from "@/stores/ui/code-theme";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { downloadAsFile, downloadAsImage } from "@/utils/download";

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
  props?: React.ComponentPropsWithoutRef<typeof SyntaxHighlighter>;
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
  props,
}) => {
  const { getCurrentThemeStyle, getCurrentThemeName } = useCodeThemeStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] xl:max-w-[90vw] xl:w-[90vw] 2xl:max-w-[85vw] 2xl:w-[85vw] h-[90vh] p-0 font-fira-code rounded-2xl border-none">
        <DialogHeader className="px-6 py-4 border-b bg-card/50 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="flex items-center gap-2 text-lg">
                {(() => {
                  const IconComponent = getIconForTech(language || "code");
                  return <IconComponent className="w-5 h-5" />;
                })()}
                <span>Code Preview</span>
              </DialogTitle>
            </div>

            {/* Dialog Actions */}
            <div className="flex items-center gap-2">
              <ThemeSelector />
              <Separator orientation="vertical" className="h-6" />

              {/* Download as Image */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownloadAsImage}
                disabled={downloading === "image"}
                className="gap-2 cursor-pointer"
              >
                {downloading === "image" ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Image className="w-4 h-4" />
                )}
                Image
              </Button>

              {/* Download as File */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownloadAsFile}
                disabled={downloading === "file"}
                className="gap-2 cursor-pointer"
              >
                {downloading === "file" ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                File
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Dialog Code Display */}
        <ScrollArea className="flex-1 overflow-y-auto p-4 rounded-2xl border-2 m-4 border-border">
          <CodeDisplay
            isDialog
            ref={dialogCodeRef}
            themeStyle={getCurrentThemeStyle()}
            language={language}
            codeContent={codeContent}
            props={{ ...props }}
          />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 backdrop-blur-sm rounded-b-2xl border-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="font-medium">
                  {codeContent.split("\n").length}
                </span>
                <span>lines</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-medium">{codeContent.length}</span>
                <span>characters</span>
              </span>
              <span className="flex items-center gap-2">
                <span>Theme:</span>
                <span className="font-medium">{getCurrentThemeName()}</span>
              </span>
              <span className="hidden lg:flex items-center gap-2">
                <span>Font:</span>
                <span className="font-medium">Source Code Pro</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onCopy}
                size="sm"
                className="gap-2"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy All"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
      <DialogOverlay />
    </Dialog>
  );
};

/**
 * Enhanced CodeRender Component with Dialog View
 *
 * This component provides a comprehensive code rendering solution with:
 * - Syntax highlighting using Prism
 * - Theme customization with real-time preview
 * - Copy functionality with visual feedback
 * - Collapsible code blocks for space efficiency
 * - Full-screen dialog view for better code inspection
 * - Download capabilities (as image or code file)
 * - Responsive design for mobile and desktop
 * - Smart detection of inline vs block code
 */
const CodeRender: React.FC<CodeRenderProps> = ({
  inline,
  className,
  children,
  ...props
}) => {
  // Core state management
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState<"image" | "file" | null>(null);

  const match = /language-(\w+)/.exec(className ?? "");
  const language = match ? match[1] : "";
  const { getCurrentThemeStyle } = useCodeThemeStore();

  const codeRef = useRef<HTMLDivElement>(null);
  const dialogCodeRef = useRef<HTMLDivElement | null>(null);

  const [isInTableCell, setIsInTableCell] = useState(false);
  const [headingLevel, setHeadingLevel] = useState<number | null>(null);

  /**
   * Context Detection Logic
   *
   * This effect analyzes the component's DOM position to determine
   * if it's inside a table cell or heading, which affects rendering style.
   * We traverse up to 3 parent elements to find context clues.
   */
  useEffect(() => {
    if (codeRef.current) {
      let parent = codeRef.current.parentElement;
      let cnt = 0;

      while (parent && cnt < 3) {
        const tagName = parent.tagName.toLowerCase().trim();

        // Check if code is inside a table cell
        if (tagName === "td") {
          setIsInTableCell(true);
          return;
        }

        // Check if code is inside a heading
        if (tagName === "h1" || tagName === "h2" || tagName === "h3") {
          setHeadingLevel(parseInt(tagName.slice(1)));
          return;
        }

        parent = parent.parentElement;
        cnt++;
      }
      setIsInTableCell(false);
    }
  }, []);

  const codeContent = useMemo(() => {
    return typeof children === "string"
      ? children.replace(/\n$/, "") // Remove trailing newline
      : React.Children.toArray(children).join("");
  }, [children]);

  // Determine if code should be rendered in compact mode
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
      downloadAsImage(dialogCodeRef.current, language);
    }
    setDownloading(null);
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

  const showSimpleCode = isInTableCell || (!inline && isCompactCode);

  if (showSimpleCode) {
    return (
      <span ref={codeRef}>
        <code
          className={cn(
            "px-2 py-1 text-primary font-cascadia-code break-words",
            getHeadingCodeStyle(headingLevel)
          )}
        >
          {codeContent}
        </code>
      </span>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        ref={codeRef}
        className="my-8 relative font-fira-code no-swipe shadow-md shadow-background/50 rounded-2xl border-2"
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
            {/* Theme Selector */}
            <ThemeSelector size="small" />

            {/* Copy Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 px-2 transition-all duration-300"
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
              className="h-8 px-2"
              aria-label="Open in dialog"
              onClick={() => setDialogOpen(true)}
            >
              <Maximize2 size={14} />
            </Button>

            {/* Collapse Toggle */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
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
          <CodeDisplay
            language={language}
            codeContent={codeContent}
            themeStyle={getCurrentThemeStyle()}
            props={{ ...props }}
          />
        </CollapsibleContent>
      </div>

      {/* Code Preview Dialog */}
      <CodePreviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        language={language}
        codeContent={codeContent}
        onDownloadAsImage={handleDownloadAsImage}
        onDownloadAsFile={handleDownloadAsFile}
        downloading={downloading}
        onCopy={copyToClipboard}
        copied={copied}
        dialogCodeRef={dialogCodeRef}
        props={props}
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
            "transition-colors",
            size === "small" ? "h-8 px-3" : "p-2 h-10 w-10"
          )}
          aria-label="Select theme"
        >
          <Palette className={cn(size === "small" ? "w-3 h-3" : "w-4 h-4")} />
          {size === "small" && (
            <span className="ml-1 text-xs sm:block hidden">Theme</span>
          )}
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

interface CodeDisplayProps {
  isDialog?: boolean;
  ref?: React.RefObject<HTMLDivElement | null>;
  language: string;
  codeContent: string;
  props?: React.ComponentPropsWithoutRef<typeof SyntaxHighlighter>;
  themeStyle: Record<string, React.CSSProperties>;
}

const CodeDisplay = ({
  isDialog = false,
  ref,
  language,
  codeContent,
  props,
  themeStyle,
}: CodeDisplayProps) => {
  return (
    <div
      ref={ref}
      className={cn(isDialog && "relative code-capture-container")}
    >
      <ScrollArea
        className={cn(
          "rounded-b-2xl border-none",
          isDialog &&
            "max-h-[70vh] lg:max-h-[75vh] xl:max-h-[80vh] code-scroll-area"
        )}
      >
        <SyntaxHighlighter
          language={language ?? "text"}
          customStyle={{
            margin: 0,
            padding: isDialog
              ? window.innerWidth >= 1536
                ? "3rem"
                : window.innerWidth >= 1280
                ? "2.5rem"
                : window.innerWidth >= 1024
                ? "2rem"
                : "1.5rem"
              : window.innerWidth < 640
              ? "0.75rem"
              : "1rem",
            fontSize: isDialog
              ? window.innerWidth >= 1536
                ? "1.1rem"
                : window.innerWidth >= 1280
                ? "1.05rem"
                : window.innerWidth >= 1024
                ? "1rem"
                : "0.95rem"
              : window.innerWidth < 640
              ? "0.8rem"
              : "0.875rem",
            lineHeight: isDialog
              ? window.innerWidth >= 1024
                ? 1.8
                : 1.7
              : window.innerWidth < 640
              ? 1.5
              : 1.6,
            minWidth: "100%",
            width: "max-content",
            backgroundColor: "transparent",
            border: "none",
            // These properties help with image capture
            maxWidth: "none",
            whiteSpace: "pre",
            wordWrap: "normal",
            overflow: "visible",
          }}
          useInlineStyles={true}
          codeTagProps={{
            style: {
              backgroundColor: "transparent",
              fontFamily: "Source Code Pro, monospace",
              whiteSpace: "pre",
              fontSize: "inherit",
              overflow: "visible",
              maxWidth: "none",
            },
          }}
          {...props}
          style={{
            ...themeStyle,
            'code[class*="language-"]': {
              ...themeStyle['code[class*="language-"]'],
              backgroundColor: "transparent",
              background: "transparent",
              overflow: "visible",
              maxWidth: "none",
            },
            'pre[class*="language-"]': {
              ...themeStyle['pre[class*="language-"]'],
              backgroundColor: "transparent",
              background: "transparent",
              overflow: "visible",
              maxWidth: "none",
            },
          }}
        >
          {String(codeContent)}
        </SyntaxHighlighter>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default CodeRender;
