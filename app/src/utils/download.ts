/**
 * Download as File Functionality
 *
 * Creates a text file with the code content and triggers download.
 * File extension is determined by the detected language.
 */
export const downloadAsFile = (codeContent: string, language: string) => {
  try {
    const getFileExtension = (lang: string) => {
      const extensions: Record<string, string> = {
        javascript: "js",
        typescript: "ts",
        python: "py",
        java: "java",
        cpp: "cpp",
        c: "c",
        csharp: "cs",
        php: "php",
        ruby: "rb",
        go: "go",
        rust: "rs",
        swift: "swift",
        kotlin: "kt",
        dart: "dart",
        html: "html",
        css: "css",
        scss: "scss",
        shell: "sh",
        bash: "sh",
        powershell: "ps1",
        sql: "sql",
        json: "json",
        yaml: "yml",
        xml: "xml",
        markdown: "md",
      };
      return extensions[lang] || "txt";
    };

    const extension = getFileExtension(language);
    const blob = new Blob([codeContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `code-snippet-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to download file:", err);
  }
};

/**
 * Download as Image Functionality
 *
 * Converts the code display to a canvas and downloads it as PNG.
 * Handles horizontal overflow by temporarily expanding the container.
 */
export const downloadAsImage = async (
  element: HTMLElement,
  language: string
) => {
  try {
    const html2canvas = (await import("html2canvas")).default;

    if (!element) return;

    // Find all scrollable elements that might constrain the content
    const scrollElements = element.querySelectorAll(
      "[data-radix-scroll-area-viewport], .overflow-hidden, .overflow-auto, .overflow-x-auto"
    );
    const preElements = element.querySelectorAll("pre, code");

    // Store original styles for restoration
    const originalStyles = new Map();

    // Function to store and modify element styles
    const prepareElementForCapture = (el: Element) => {
      const htmlEl = el as HTMLElement;

      // Store original styles
      originalStyles.set(htmlEl, {
        maxHeight: htmlEl.style.maxHeight,
        maxWidth: htmlEl.style.maxWidth,
        overflow: htmlEl.style.overflow,
        overflowX: htmlEl.style.overflowX,
        overflowY: htmlEl.style.overflowY,
        width: htmlEl.style.width,
        height: htmlEl.style.height,
        whiteSpace: htmlEl.style.whiteSpace,
      });

      // Apply capture-friendly styles
      htmlEl.style.maxHeight = "none";
      htmlEl.style.maxWidth = "none";
      htmlEl.style.overflow = "visible";
      htmlEl.style.overflowX = "visible";
      htmlEl.style.overflowY = "visible";

      // For pre/code elements, ensure full width display
      if (
        htmlEl.tagName.toLowerCase() === "pre" ||
        htmlEl.tagName.toLowerCase() === "code"
      ) {
        htmlEl.style.width = "max-content";
        htmlEl.style.whiteSpace = "pre";
      }
    };

    // Function to restore original styles
    const restoreElementStyles = (el: Element) => {
      const htmlEl = el as HTMLElement;
      const originalStyle = originalStyles.get(htmlEl);
      if (originalStyle) {
        Object.assign(htmlEl.style, originalStyle);
      }
    };

    try {
      // Prepare all relevant elements for capture
      scrollElements.forEach(prepareElementForCapture);
      preElements.forEach(prepareElementForCapture);

      // Also prepare the main dialog element
      prepareElementForCapture(element);

      // Wait for layout to settle
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Get the full dimensions after expanding
      const rect = element.getBoundingClientRect();
      let fullWidth = rect.width;
      let fullHeight = rect.height;

      // Check if any child elements are wider
      preElements.forEach((pre) => {
        const preRect = pre.getBoundingClientRect();
        fullWidth = Math.max(fullWidth, preRect.width + 48); // Add padding
        fullHeight = Math.max(fullHeight, preRect.height + 96); // Add padding
      });

      // Capture with full dimensions
      const canvas = await html2canvas(element, {
        backgroundColor: "#1a1a1a",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        width: Math.ceil(fullWidth),
        height: Math.ceil(fullHeight),
        scrollX: 0,
        scrollY: 0,
      });

      // Convert and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `code-${language || "snippet"}-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    } finally {
      // Always restore original styles
      scrollElements.forEach(restoreElementStyles);
      preElements.forEach(restoreElementStyles);
      restoreElementStyles(element);
    }
  } catch (err) {
    console.error("Failed to download image:", err);
  }
};
