# ImageRender Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance `ImageRender` with a shimmer skeleton loading state, fade-in animation, inline captions, and a bottom-sheet gallery view on click.

**Architecture:** All logic lives in `image-render.tsx` (rewritten) plus a sibling `image-render.module.css` for the shimmer keyframe. The component becomes a `<figure>` wrapping a native `<button>` (the click trigger), skeleton/error overlays, the `<img>`, an optional `<figcaption>`, and a Radix Dialog composed as a bottom sheet. The `index.tsx` call site is cleaned up to remove classes that now live inside the component, and `key={src}` is added to force full remounts on src changes.

**Tech Stack:** React 19, TypeScript 5.7, Tailwind CSS 4, Radix UI (`@radix-ui/react-dialog`), lucide-react (`ImageIcon`, `ImageOffIcon`, `XIcon`), Vitest + @testing-library/react, CSS Modules.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/src/components/features/markdown-render/components/renderers/image-render.module.css` | Shimmer keyframe animation |
| Rewrite | `app/src/components/features/markdown-render/components/renderers/image-render.tsx` | Full enhanced component |
| Modify | `app/src/components/features/markdown-render/components/renderers/index.tsx:80-86` | Remove stale `className`, add `key={src}` |
| Create | `app/src/components/features/markdown-render/components/renderers/image-render.test.tsx` | Component behaviour tests |

---

## Task 1: CSS Module

**Files:**
- Create: `app/src/components/features/markdown-render/components/renderers/image-render.module.css`

- [ ] **Step 1: Create the CSS module with the shimmer keyframe**

```css
/* image-render.module.css */
.shimmer {
  background: linear-gradient(
    90deg,
    transparent 25%,
    rgba(255, 255, 255, 0.06) 50%,
    transparent 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd app
git add src/components/features/markdown-render/components/renderers/image-render.module.css
git commit -m "style(image-render): add shimmer keyframe CSS module"
```

---

## Task 2: Write Failing Tests

**Files:**
- Create: `app/src/components/features/markdown-render/components/renderers/image-render.test.tsx`

> **Why tests first:** The component doesn't exist yet in its new form; writing tests first ensures every behaviour is intentionally specified and that the tests actually fail before implementation — no false positives.
>
> **Note on src-change test:** Component state resets are triggered by passing `key={src}` at the **call site** (`index.tsx`). In tests we simulate this by passing `key` explicitly on re-renders.

- [ ] **Step 1: Create the test file**

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import ImageRender from './image-render';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate the browser firing load on the hidden <img> inside ImageRender. */
function fireLoad(container: HTMLElement) {
  const img = container.querySelector('img');
  if (img) fireEvent.load(img);
}

/** Simulate the browser firing an error on the hidden <img> inside ImageRender. */
function fireImageError(container: HTMLElement) {
  const img = container.querySelector('img');
  if (img) fireEvent.error(img);
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('ImageRender — loading state', () => {
  it('shows the skeleton with alt text before the image loads', () => {
    render(<ImageRender src="arch.png" alt="System Architecture" />);
    expect(screen.getByText('System Architecture')).toBeInTheDocument();
  });

  it('hides the skeleton after the image loads', () => {
    const { container } = render(<ImageRender src="arch.png" alt="System Architecture" />);
    fireLoad(container);
    expect(screen.queryByText('System Architecture')).not.toBeInTheDocument();
  });

  it('image starts as opacity-0 before load', () => {
    const { container } = render(<ImageRender src="arch.png" alt="System Architecture" />);
    const img = container.querySelector('img');
    expect(img).toHaveClass('opacity-0');
  });

  it('shows the image with opacity-100 after load', () => {
    const { container } = render(<ImageRender src="arch.png" alt="System Architecture" />);
    fireLoad(container);
    const img = container.querySelector('img');
    expect(img).toHaveClass('opacity-100');
  });
});

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

describe('ImageRender — error state', () => {
  it('shows the error overlay when the image fails to load', () => {
    const { container } = render(<ImageRender src="broken.png" alt="Broken" />);
    fireImageError(container);
    expect(screen.getByText('Could not load image')).toBeInTheDocument();
  });

  it('hides the loading skeleton when the image errors', () => {
    const { container } = render(<ImageRender src="broken.png" alt="Broken" />);
    fireImageError(container);
    // skeleton alt-text label should be gone; only error message remains
    expect(screen.queryByText('Broken')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Caption
// ---------------------------------------------------------------------------

describe('ImageRender — caption', () => {
  it('renders a figcaption when title is provided', () => {
    render(<ImageRender src="arch.png" alt="Diagram" title="Figure 1: Architecture" />);
    expect(screen.getByText('Figure 1: Architecture')).toBeInTheDocument();
  });

  it('does not render a figcaption when title is absent', () => {
    render(<ImageRender src="arch.png" alt="Diagram" />);
    expect(document.querySelector('figcaption')).not.toBeInTheDocument();
  });

  it('does not render a figcaption when title is empty string', () => {
    render(<ImageRender src="arch.png" alt="Diagram" title="" />);
    expect(document.querySelector('figcaption')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Button / accessibility
// ---------------------------------------------------------------------------

describe('ImageRender — button trigger', () => {
  it('renders a button with the correct aria-label', () => {
    render(<ImageRender src="arch.png" alt="Architecture Diagram" />);
    expect(
      screen.getByRole('button', { name: 'View image: Architecture Diagram' })
    ).toBeInTheDocument();
  });

  it('falls back to "Image" in the aria-label when alt is absent', () => {
    render(<ImageRender src="arch.png" />);
    expect(screen.getByRole('button', { name: 'View image: Image' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Bottom sheet
// ---------------------------------------------------------------------------

describe('ImageRender — bottom sheet', () => {
  it('opens the bottom sheet when the button is clicked', () => {
    render(<ImageRender src="arch.png" alt="Architecture Diagram" />);
    fireEvent.click(screen.getByRole('button', { name: /View image/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows the alt text inside the bottom sheet', () => {
    render(<ImageRender src="arch.png" alt="Architecture Diagram" />);
    fireEvent.click(screen.getByRole('button', { name: /View image/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Architecture Diagram');
  });

  it('shows the caption inside the bottom sheet when title is provided', () => {
    render(
      <ImageRender src="arch.png" alt="Architecture Diagram" title="Figure 1: Architecture" />
    );
    fireEvent.click(screen.getByRole('button', { name: /View image/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Figure 1: Architecture');
  });

  it('closes the bottom sheet when the X button is clicked', () => {
    render(<ImageRender src="arch.png" alt="Architecture Diagram" />);
    fireEvent.click(screen.getByRole('button', { name: /View image/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// src change resets state (simulated via key change, matching call site behaviour)
// ---------------------------------------------------------------------------

describe('ImageRender — src change', () => {
  it('resets to loading state when the component is remounted with a new src', () => {
    // Simulate what index.tsx does: key={src} causes full remount on src change
    const { container, rerender } = render(
      <ImageRender key="first.png" src="first.png" alt="First" />
    );
    fireLoad(container);
    // After load, skeleton is gone
    expect(screen.queryByText('First')).not.toBeInTheDocument();

    // Remount with new key+src → component state resets → skeleton appears again
    rerender(<ImageRender key="second.png" src="second.png" alt="Second" />);
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to confirm they all fail**

```bash
cd app
npm run test:run -- src/components/features/markdown-render/components/renderers/image-render.test.tsx
```

Expected: All tests **FAIL** (component hasn't been rewritten yet).

- [ ] **Step 3: Commit the test file**

```bash
cd app
git add src/components/features/markdown-render/components/renderers/image-render.test.tsx
git commit -m "test(image-render): add failing tests for skeleton, fade-in, caption, and bottom sheet"
```

---

## Task 3: Implement the Component

**Files:**
- Rewrite: `app/src/components/features/markdown-render/components/renderers/image-render.tsx`

> **TypeScript note:** Keep the prop type as `React.ComponentPropsWithoutRef<'img'>` (to stay compatible with the react-markdown call site), but destructure `onLoad` and `onError` out with an `_` prefix to drop them silently. The component manages its own load/error handlers.

- [ ] **Step 1: Rewrite `image-render.tsx`**

```tsx
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ImageIcon, ImageOffIcon, XIcon } from 'lucide-react';
import React, { memo, useState } from 'react';

import { DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import styles from './image-render.module.css';

const ImageRender: React.FC<React.ComponentPropsWithoutRef<'img'>> = memo(
  ({
    src,
    alt,
    title,
    className,
    style,
    width,
    height,
    crossOrigin,
    decoding,
    loading,
    referrerPolicy,
    sizes,
    srcSet,
    useMap,
    onLoad: _onLoad,   // dropped — component owns its load handler
    onError: _onError, // dropped — component owns its error handler
    ...rest
  }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [open, setOpen] = useState(false);

    const displayAlt = alt ?? 'Image';

    return (
      <figure className={cn('my-4', className)} style={style}>
        {/* Clickable button wrapper */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`View image: ${displayAlt}`}
          className="block w-full cursor-zoom-in relative min-h-48 rounded-md overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Skeleton overlay — shown while loading */}
          {!loaded && !error && (
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/60 rounded-md z-10',
                styles.shimmer
              )}
            >
              <ImageIcon size={28} className="text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground italic max-w-[80%] truncate">
                {displayAlt}
              </span>
            </div>
          )}

          {/* Error overlay — shown when image fails */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/60 rounded-md z-10">
              <ImageOffIcon size={28} className="text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">Could not load image</span>
            </div>
          )}

          {/* Actual image — invisible until loaded */}
          <img
            key={src}
            src={src}
            alt={displayAlt}
            width={width}
            height={height}
            crossOrigin={crossOrigin}
            decoding={decoding}
            loading={loading}
            referrerPolicy={referrerPolicy}
            sizes={sizes}
            srcSet={srcSet}
            useMap={useMap}
            {...rest}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={cn(
              'max-w-full h-auto rounded-md transition-opacity duration-[400ms]',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        </button>

        {/* Inline caption */}
        {title && (
          <figcaption className="text-center text-sm text-muted-foreground italic mt-1.5 px-1">
            {title}
          </figcaption>
        )}

        {/* Bottom sheet gallery */}
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
              className={cn(
                'fixed bottom-0 left-0 right-0 z-50',
                'max-h-[90vh] overflow-y-auto',
                'rounded-t-2xl bg-background border-t border-border p-4',
                'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in-0 data-[state=open]:duration-300',
                'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:fade-out-0 data-[state=closed]:duration-200'
              )}
            >
              {/* Hidden title for screen readers */}
              <DialogPrimitive.Title className="sr-only">
                {title ?? displayAlt ?? 'Image viewer'}
              </DialogPrimitive.Title>

              {/* Drag handle + close button row */}
              <div className="relative py-2">
                <div className="w-10 h-1 rounded-full bg-muted mx-auto" />
                <DialogPrimitive.Close
                  aria-label="Close"
                  className="absolute top-0 right-0 p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <XIcon size={32} />
                </DialogPrimitive.Close>
              </div>

              {/* Image slot */}
              <div className="flex items-center justify-center min-h-40 mt-4">
                {error ? (
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground w-full h-full min-h-40">
                    <ImageOffIcon size={32} />
                    <span className="text-sm">Could not load image</span>
                  </div>
                ) : (
                  <img
                    src={src}
                    alt={displayAlt}
                    className="max-h-[70vh] max-w-full object-contain mx-auto rounded-md"
                  />
                )}
              </div>

              {/* Alt text label */}
              <p className="text-xs text-muted-foreground text-center mt-2">{displayAlt}</p>

              {/* Caption */}
              {title && (
                <p className="text-sm italic text-muted-foreground text-center mt-1">{title}</p>
              )}
            </DialogPrimitive.Content>
          </DialogPortal>
        </DialogPrimitive.Root>
      </figure>
    );
  }
);

ImageRender.displayName = 'ImageRender';
export default ImageRender;
```

- [ ] **Step 2: Run the tests to confirm they all pass**

```bash
cd app
npm run test:run -- src/components/features/markdown-render/components/renderers/image-render.test.tsx
```

Expected: All tests **PASS**.

- [ ] **Step 3: Run type check to confirm no TypeScript errors**

```bash
cd app
npx tsc --noEmit
```

Expected: No errors. If TypeScript complains about `_onLoad`/`_onError`, prefix them with an underscore and add `// eslint-disable-next-line @typescript-eslint/no-unused-vars` above each destructured variable, or use the pattern `onLoad: _onLoad` (already done — the ESLint config typically ignores `_`-prefixed vars).

- [ ] **Step 4: Commit**

```bash
cd app
git add src/components/features/markdown-render/components/renderers/image-render.tsx
git commit -m "feat(image-render): add skeleton loading, fade-in, caption, and bottom sheet gallery"
```

---

## Task 4: Update the Call Site in `index.tsx`

**Files:**
- Modify: `app/src/components/features/markdown-render/components/renderers/index.tsx:80-86`

Two changes:
1. Remove the stale `className="max-w-full h-auto rounded-md my-4"` (those classes now live inside the component)
2. Add `key={props.src}` so the entire `ImageRender` component remounts when `src` changes, resetting `loaded`/`error` state

- [ ] **Step 1: Update the `img` entry in `index.tsx`**

Replace lines 80–86:

```tsx
// BEFORE
img: (props: React.ComponentPropsWithoutRef<'img'>) => (
  <ImageRender
    {...props}
    className="max-w-full h-auto rounded-md my-4"
    alt={props.alt ?? 'Image'}
  />
),
```

With:

```tsx
// AFTER
img: (props: React.ComponentPropsWithoutRef<'img'>) => (
  <ImageRender key={props.src} {...props} alt={props.alt ?? 'Image'} />
),
```

- [ ] **Step 2: Run the full test suite to confirm nothing regressed**

```bash
cd app
npm run test:run
```

Expected: All tests **PASS**.

- [ ] **Step 3: Run lint**

```bash
cd app
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd app
git add src/components/features/markdown-render/components/renderers/index.tsx
git commit -m "refactor(image-render): clean up index.tsx call site, add key for src-change reset"
```

---

## Task 5: Final Verification

- [ ] **Step 1: Run the full test suite**

```bash
cd app
npm run test:run
```

Expected: All tests **PASS**.

- [ ] **Step 2: Run a production build**

```bash
cd app
npm run build
```

Expected: Build completes with no errors.

- [ ] **Step 3: Manual smoke test in the dev server**

```bash
cd app
npm run dev
```

Open a markdown document containing at least one image. Verify:
- A shimmer skeleton with the alt text appears while the image loads
- The image fades in smoothly when loaded
- If the image has a `title` attribute in markdown (`![alt](url "title")`), a caption appears below the image inline
- Clicking the image opens a bottom sheet that slides up from the bottom
- The sheet shows the image, alt text label, caption (if any), and a close (X) button
- The close button, backdrop click, and Escape key all close the sheet
- Opening the sheet for a failed image shows an error state instead

- [ ] **Step 4: Commit any smoke-test fixes if needed**

```bash
cd app
git add -p
git commit -m "fix(image-render): smoke test fixes"
```
