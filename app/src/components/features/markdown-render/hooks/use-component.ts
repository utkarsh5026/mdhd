import { useCallback } from "react";
import type {
  ComponentSelection,
  ComponentType,
} from "@/components/features/markdown-render/types";

export const useComponentExtract = (
  componentType: ComponentType,
  contentRef: React.RefObject<HTMLDivElement | null>
) => {
  /**
   * Extract meaningful content from the wrapped component
   * Different strategies for different component types
   */
  const extractContent = useCallback((): string => {
    if (!contentRef.current) return "";

    switch (componentType) {
      case "code": {
        // For code blocks, prioritize <code> elements, then <pre>, then text
        const codeElement = contentRef.current.querySelector("code");
        if (codeElement) {
          return codeElement.textContent || "";
        }
        const preElement = contentRef.current.querySelector("pre");
        if (preElement) {
          return preElement.textContent || "";
        }
        return contentRef.current.textContent || "";
      }

      case "table": {
        // For tables, create a structured text representation
        const table = contentRef.current.querySelector("table");
        if (table) {
          const rows = Array.from(table.querySelectorAll("tr"));
          return rows
            .map((row) => {
              const cells = Array.from(row.querySelectorAll("td, th"));
              return cells
                .map((cell) => cell.textContent?.trim() || "")
                .filter(Boolean)
                .join(" | ");
            })
            .filter(Boolean)
            .join("\n");
        }
        return contentRef.current.textContent || "";
      }

      case "blockquote": {
        // For blockquotes, get the inner text without quote markers
        const text = contentRef.current.textContent || "";
        return text.replace(/^[">]*\s*/, "").trim();
      }

      case "list": {
        // For lists, create a numbered/bulleted text representation
        const listItems = Array.from(contentRef.current.querySelectorAll("li"));
        return listItems
          .map((li, index) => {
            const text = li.textContent?.trim() || "";
            const isOrdered = li.closest("ol") !== null;
            const prefix = isOrdered ? `${index + 1}. ` : "• ";
            return prefix + text;
          })
          .join("\n");
      }

      case "heading": {
        // For headings, get clean text without hash markers
        const text = contentRef.current.textContent || "";
        return text.replace(/^#+\s*/, "").trim();
      }

      default:
        // For everything else, just get the text content
        return contentRef.current.textContent || "";
    }
  }, [componentType, contentRef]);

  return { extractContent };
};

export const useComponentTitle = (
  content: string,
  componentType: ComponentType,
  metadata: ComponentSelection["metadata"]
) => {
  /**
   * Generate a meaningful title for the component
   * Creates human-readable descriptions based on content and type
   */
  const generateTitle = useCallback(() => {
    const preview = content.slice(0, 60).trim();

    switch (componentType) {
      case "code": {
        const lang = metadata?.language ? ` (${metadata.language})` : "";
        const lines = content.split("\n").length;
        const lineText = lines === 1 ? "line" : "lines";
        return `Code Block${lang} - ${lines} ${lineText}`;
      }

      case "table": {
        const rows = content.split("\n").length;
        const rowText = rows === 1 ? "row" : "rows";
        return `Table with ${rows} ${rowText}`;
      }

      case "heading": {
        const level = metadata?.level || 1;
        return `H${level}: ${preview}`;
      }

      case "blockquote":
        return `Quote: ${preview}`;

      case "list": {
        const items = content.split("\n").length;
        const itemText = items === 1 ? "item" : "items";
        return `List with ${items} ${itemText}`;
      }

      case "image": {
        const alt = metadata?.alt || "Image";
        return `Image: ${alt}`;
      }

      default:
        return `${componentType}: ${preview}`;
    }
  }, [componentType, metadata, content]);

  return { generateTitle };
};
