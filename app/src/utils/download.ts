/**
 * Download as File Functionality
 *
 * Creates a text file with the code content and triggers download.
 * File extension is determined by the detected language.
 */
const downloadAsFile = (codeContent: string, language: string) => {
  try {
    const getFileExtension = (lang: string) => {
      const extensions: Record<string, string> = {
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        java: 'java',
        cpp: 'cpp',
        c: 'c',
        csharp: 'cs',
        php: 'php',
        ruby: 'rb',
        go: 'go',
        rust: 'rs',
        swift: 'swift',
        kotlin: 'kt',
        dart: 'dart',
        html: 'html',
        css: 'css',
        scss: 'scss',
        shell: 'sh',
        bash: 'sh',
        powershell: 'ps1',
        sql: 'sql',
        json: 'json',
        yaml: 'yml',
        xml: 'xml',
        markdown: 'md',
      };
      return extensions[lang] || 'txt';
    };

    const extension = getFileExtension(language);
    const blob = new Blob([codeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `code-snippet-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download file:', err);
  }
};

/**
 * Download as Image Functionality
 *
 * Converts the code display to a canvas and downloads it as PNG.
 * Handles horizontal overflow by temporarily expanding the container.
 */
const downloadAsImage = async (element: HTMLElement, language: string) => {
  try {
    // Dynamic import to avoid bundling html2canvas unless needed
    const html2canvas = (await import('html2canvas')).default;

    if (!element) return;

    // Find the scrollable container and the pre element inside
    const scrollArea = element.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    const preElement = element.querySelector('pre') as HTMLElement;

    if (!scrollArea || !preElement) {
      console.error('Could not find scroll area or pre element');
      return;
    }

    // Store original styles to restore later
    const originalStyles = {
      scrollArea: {
        maxHeight: scrollArea.style.maxHeight,
        overflow: scrollArea.style.overflow,
        overflowX: scrollArea.style.overflowX,
        overflowY: scrollArea.style.overflowY,
      },
      preElement: {
        maxWidth: preElement.style.maxWidth,
        width: preElement.style.width,
        whiteSpace: preElement.style.whiteSpace,
      },
    };

    // Temporarily modify styles to show full content
    // Remove height constraints and scrolling
    scrollArea.style.maxHeight = 'none';
    scrollArea.style.overflow = 'visible';
    scrollArea.style.overflowX = 'visible';
    scrollArea.style.overflowY = 'visible';

    // Ensure pre element shows full width
    preElement.style.maxWidth = 'none';
    preElement.style.width = 'max-content';
    preElement.style.whiteSpace = 'pre';

    // Wait for layout to settle
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get the actual dimensions of the content
    const rect = preElement.getBoundingClientRect();
    const contentWidth = Math.max(rect.width, preElement.scrollWidth);
    const contentHeight = Math.max(rect.height, preElement.scrollHeight);

    // Configure canvas options for full content capture
    const canvas = await html2canvas(element, {
      backgroundColor: '#1a1a1a', // Dark background
      scale: 2, // Higher resolution for crisp images
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: Math.ceil(contentWidth + 48), // Add padding (24px * 2)
      height: Math.ceil(contentHeight + 96), // Add padding for header/footer
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.ceil(contentWidth + 48),
      windowHeight: Math.ceil(contentHeight + 96),
    });

    // Restore original styles
    Object.assign(scrollArea.style, originalStyles.scrollArea);
    Object.assign(preElement.style, originalStyles.preElement);

    // Convert canvas to blob and trigger download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code-${language || 'snippet'}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  } catch (err) {
    console.error('Failed to download image:', err);
  }
};

export { downloadAsFile, downloadAsImage };
