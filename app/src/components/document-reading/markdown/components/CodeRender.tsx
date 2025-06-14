import React, { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Copy, ChevronDown, ChevronRight, Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import getTopicIcon from "@/components/shared/icons/topicIcon";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCodeThemeStore, type ThemeKey } from "@/stores/ui/code-theme";
import { Button } from "@/components/ui/button";

interface CodeRenderProps extends React.ComponentPropsWithoutRef<"code"> {
  inline?: boolean;
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
 * CodeRender Component
 *
 * Renders code blocks and inline code with syntax highlighting and copy functionality.
 */
const CodeRender: React.FC<CodeRenderProps> = ({
  inline,
  className,
  children,
  ...props
}) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const match = /language-(\w+)/.exec(className ?? "");
  const language = match ? match[1] : "";

  const {
    selectedTheme,
    setTheme,
    getCurrentThemeStyle,
    getCurrentThemeName,
    getThemesByCategory,
  } = useCodeThemeStore();

  const codeRef = React.useRef<HTMLDivElement>(null);
  const [isInTableCell, setIsInTableCell] = useState(false);
  const [headingLevel, setHeadingLevel] = useState<number | null>(null);

  console.log(headingLevel);

  useEffect(() => {
    if (codeRef.current) {
      let parent = codeRef.current.parentElement;
      let cnt = 0;
      while (parent) {
        const tagName = parent.tagName.toLowerCase().trim();
        if (tagName === "td") {
          setIsInTableCell(true);
          return;
        }

        if (tagName === "h1" || tagName === "h2" || tagName === "h3") {
          setHeadingLevel(parseInt(tagName.slice(1)));
          return;
        }

        if (cnt === 3) break;
        parent = parent.parentElement;
        cnt++;
      }
      setIsInTableCell(false);
    }
  }, []);

  const codeContent =
    typeof children === "string"
      ? children.replace(/\n$/, "")
      : React.Children.toArray(children).join("");

  const isCompactCode =
    typeof codeContent === "string" &&
    !codeContent.includes("\n") &&
    codeContent.length < 25;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showSimpleCode = isInTableCell || (!inline && isCompactCode);

  return showSimpleCode ? (
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
  ) : (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div ref={codeRef} className="my-8 relative font-fira-code no-swipe">
        <div className="bg-[#1c1c1c] text-gray-400 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold border-b border-[#222222] flex justify-between items-center rounded-t-2xl sm:rounded-t-2xl">
          <span className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <span className="flex-shrink-0">
              {getTopicIcon(language || "code")}
            </span>
            <span className="truncate text-xs sm:text-sm">
              {language || "code"}
            </span>
          </span>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 sm:p-1 rounded hover:bg-[#252525] transition-colors flex items-center gap-1 min-h-[44px] sm:min-h-auto"
                  aria-label="Select theme"
                >
                  <Palette size={18} className="text-gray-500 sm:w-4 sm:h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={8}
                className="w-52 sm:w-48 max-h-64 overflow-y-auto bg-card rounded-xl sm:rounded-2xl font-fira-code mr-2 sm:mr-0"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground px-3 py-2">
                  Current: {getCurrentThemeName()}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(getThemesByCategory()).map(
                  ([category, themes]) => (
                    <React.Fragment key={category}>
                      <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
                        {category}
                      </DropdownMenuLabel>
                      {Object.entries(themes).map(([themeKey, theme]) => (
                        <DropdownMenuItem
                          key={themeKey}
                          onClick={() => setTheme(themeKey as ThemeKey)}
                          className={cn(
                            "cursor-pointer text-sm py-2.5 sm:py-2",
                            selectedTheme === themeKey &&
                              "bg-accent text-accent-foreground"
                          )}
                        >
                          {theme.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </React.Fragment>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className={cn(
                " p-2  transition-all duration-300 ease-in-out rounded-2xl",
                "hover:bg-background/50 backdrop-blur-sm border-none"
              )}
              aria-label={copied ? "Copied!" : "Copy code"}
            >
              <div className="relative text-xs sm:text-sm">
                <Copy
                  size={16}
                  className={cn(
                    "transition-all duration-300 ease-in-out",
                    copied
                      ? "opacity-0 scale-0 rotate-90"
                      : "opacity-100 scale-100 rotate-0 text-gray-300 hover:text-white"
                  )}
                />
                <Check
                  size={16}
                  className={cn(
                    "absolute inset-0 transition-all duration-300 ease-in-out text-green-400",
                    copied
                      ? "opacity-100 scale-100 rotate-0"
                      : "opacity-0 scale-0 -rotate-90"
                  )}
                />
              </div>
            </Button>

            <CollapsibleTrigger asChild>
              <button
                className="p-2 sm:p-1 rounded hover:bg-[#252525] transition-colors min-h-[44px] sm:min-h-auto"
                aria-label={isOpen ? "Collapse code" : "Expand code"}
              >
                {isOpen ? (
                  <ChevronDown
                    size={18}
                    className="text-gray-500 sm:w-4 sm:h-4"
                  />
                ) : (
                  <ChevronRight
                    size={18}
                    className="text-gray-500 sm:w-4 sm:h-4"
                  />
                )}
              </button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent className="data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
          <div className="relative">
            <ScrollArea className="rounded-b-2xl sm:shadow-md sm:shadow-background/50">
              <SyntaxHighlighter
                language={language || "text"}
                customStyle={{
                  margin: 0,
                  padding: window.innerWidth < 640 ? "0.75rem" : "1rem",
                  paddingTop: window.innerWidth < 640 ? "3rem" : "3.5rem",
                  backgroundColor: "transparent",
                  fontSize: window.innerWidth < 640 ? "0.8rem" : "0.875rem",
                  lineHeight: window.innerWidth < 640 ? 1.5 : 1.6,
                  minWidth: "100%",
                  width: "max-content",
                }}
                useInlineStyles={true}
                codeTagProps={{
                  style: {
                    backgroundColor: "transparent",
                    fontFamily: "Source Code Pro, monospace",
                    whiteSpace: "pre",
                    fontSize: "inherit",
                  },
                }}
                {...props}
                style={getCurrentThemeStyle()}
              >
                {typeof children === "string"
                  ? children.replace(/\n$/, "")
                  : React.Children.toArray(children).join("")}
              </SyntaxHighlighter>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default CodeRender;
