# ImageRender Enhancement — Design Spec

**Date:** 2026-03-19
**File:** `app/src/components/features/markdown-render/components/renderers/image-render.tsx`

## Overview

Enhance the `ImageRender` component — currently a plain `<img>` tag — with four connected improvements:

1. **Shimmer skeleton loading state** with alt text and icon while the image fetches
2. **Smooth fade-in animation** when the image finishes loading
3. **Inline caption** rendered from the markdown `title` attribute
4. **Bottom sheet gallery view** that opens when the user clicks the image

All logic stays self-contained in `image-render.tsx`. No new files, no shared state.

---

## Component Structure

The component changes from a bare `<img>` to a `<figure>` containing:

```tsx
<figure>
  <button onClick={() => setOpen(true)}>           // native button (keyboard + click)
    <SkeletonOverlay />                             // shown while !loaded && !error
    <ErrorOverlay />                               // shown while error === true
    <img onLoad onError ... />                     // opacity-0 until loaded
  </button>
  <figcaption />                                   // only if title prop present
  <BottomSheet open={open} />                      // Radix Dialog, bottom variant
</figure>
```

### Props

`ImageRender` accepts `React.ComponentPropsWithoutRef<'img'>`. Prop routing:

- `src`, `alt`, `title`, `width`, `height`, `crossOrigin`, and all other `<img>` attributes → forwarded to `<img>` only
- `className` → forwarded to `<figure>` (outer container), not to `<img>`
- `style` → forwarded to `<figure>`
- `onLoad` and `onError` → **dropped from the spread**; the component defines its own internal handlers for these and does not merge with caller-provided ones. This is intentional: `ImageRender` is a markdown renderer primitive, not a general-purpose `<img>` wrapper. Callers do not supply these callbacks.

This avoids passing img-specific props to a `<figure>` and prevents React DOM warnings.

The `my-4` vertical margin is **hardcoded** on the `<figure>`. The call site in `index.tsx` currently passes `className="max-w-full h-auto rounded-md my-4"` to `ImageRender` — this must be **removed** as part of this change, since those img-layout classes now live inside the component (`max-w-full h-auto rounded-md` on the `<img>`, `my-4` on the `<figure>`). After the update the `index.tsx` img entry becomes simply `<ImageRender {...props} alt={props.alt ?? 'Image'} />` with no extra `className`.

### State

```ts
const [loaded, setLoaded] = useState(false);
const [error, setError]   = useState(false);
const [open, setOpen]     = useState(false);
```

**State reset on `src` change:** Use a `key={src}` prop on the `<img>` element to force a full remount whenever `src` changes. This is simpler and more reliable than a `useEffect` reset, which can race with React's synchronous `onLoad` callback (cached images fire `onLoad` before the effect runs). Remounting the `<img>` node guarantees the browser re-fetches and `onLoad`/`onError` fire fresh.

---

## Loading State

While `loaded === false` and `error === false`, a skeleton overlay is rendered as an absolutely-positioned sibling inside the button wrapper. The `<img>` itself has `opacity-0` so it loads silently in the background.

**Skeleton layout:**

- The `<button>` wrapper has `min-h-48` to give the skeleton visible presence before image dimensions are known
- The skeleton overlay `<div>` is `absolute inset-0` (filling the button) — it does NOT carry `min-h-48` itself
- Background: dark fill (`bg-muted/60`) with a shimmer sweep on top (via CSS Module class)
- Centered column flex: lucide `ImageIcon` (size 28, muted color) above the alt text label
- Alt text: `text-xs text-muted-foreground italic`, `max-w-[80%] truncate`

**Shimmer animation** — defined in `image-render.module.css` and applied to the skeleton overlay element via the CSS Modules import:

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
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
```

In JSX:

```tsx
import styles from './image-render.module.css';
// ...
<div className={cn('absolute inset-0 bg-muted/60', styles.shimmer)}>
```

This combines the Tailwind base fill with the CSS Module shimmer sweep via `cn()`.

**Error state** (`error === true`): skeleton is removed, an error overlay takes its place using the same absolutely-positioned container — lucide `ImageOffIcon` + "Could not load image" text. The button wrapper is still rendered but the sheet suppresses the image (see Bottom Sheet section).

---

## Fade-in Animation

On `onLoad`:

- `setLoaded(true)` — unmounts the skeleton overlay
- The `<img>` transitions from `opacity-0` to `opacity-100`

```tsx
<img
  src={src}
  alt={alt ?? 'Image'}
  width={width}
  height={height}
  // ...remaining img-specific props
  onLoad={() => setLoaded(true)}
  onError={() => setError(true)}
  className={cn(
    'max-w-full h-auto rounded-md transition-opacity duration-400',
    loaded ? 'opacity-100' : 'opacity-0'
  )}
/>
```

Use `duration-[400ms]` (arbitrary-value bracket syntax) for the 400ms fade throughout the component. Tailwind v4 does not include `duration-400` as a built-in scale value; the bracket form is required to avoid a silent no-op.

---

## Caption

When the `title` prop is a non-empty string, a `<figcaption>` is rendered directly below the button wrapper:

```tsx
{title && (
  <figcaption className="text-center text-sm text-muted-foreground italic mt-1.5 px-1">
    {title}
  </figcaption>
)}
```

No caption is shown if `title` is absent. The alt text is not used as a caption fallback.

---

## Bottom Sheet Gallery View

Built with Radix Dialog primitives already present in the project (`@radix-ui/react-dialog` via `app/src/components/ui/dialog.tsx`). The standard `DialogContent` is not reused — a custom bottom-sheet content is composed inline using `DialogPortal` + `DialogOverlay` + `DialogPrimitive.Content`.

### Dialog Accessibility

The Radix `DialogPrimitive.Root` wraps everything. A visually hidden `DialogPrimitive.Title` provides a screen-reader-accessible name:

```tsx
<DialogPrimitive.Title className="sr-only">
  {title ?? alt ?? 'Image viewer'}
</DialogPrimitive.Title>
```

### Overlay

`DialogOverlay` from `ui/dialog.tsx` (semi-transparent black backdrop, fade in/out animations already defined).

### Content (bottom sheet)

Tailwind classes: `fixed bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-background border-t border-border p-4`

Animations:

```text
data-[state=open]:animate-in   slide-in-from-bottom-4  fade-in-0   duration-300
data-[state=closed]:animate-out slide-out-to-bottom-4  fade-out-0  duration-200
```

### Sheet Contents (top to bottom)

1. **Drag handle + close button row** — a `relative` container at the top of the sheet. The drag handle `w-10 h-1 rounded-full bg-muted` is centered via `mx-auto`. The `DialogPrimitive.Close` button (X icon, `size-8`, `aria-label="Close"`) is `absolute top-0 right-0` within this container. The container itself has `py-2` padding so both elements have breathing room.
2. **Image slot** — a `flex items-center justify-center min-h-40 mt-4` container. When `error === false`: renders `<img>` with `max-h-[70vh] max-w-full object-contain mx-auto rounded-md`. When `error === true`: renders the error overlay (`ImageOffIcon` + "Could not load image") filling this same container (the overlay is `flex flex-col items-center justify-center gap-2 text-muted-foreground w-full h-full min-h-40`).
3. **Alt text** — `text-xs text-muted-foreground text-center mt-2` (always shown)
4. **Caption** — `text-sm italic text-muted-foreground text-center mt-1` (only if `title` present)

### Close Behaviour

- Click backdrop (`DialogOverlay`) → closes
- Press Escape → closes (Radix default)
- Click X button (top-right of sheet) → closes
- Drag handle is a visual cue only; no swipe-to-dismiss gesture is implemented

---

## Keyboard Accessibility

The clickable wrapper is a native `<button>` element (not `div role="button"`). This gives Enter and Space key activation for free, correct tab stop behaviour, and correct browser focus ring — no `onKeyDown` handler needed.

```tsx
<button
  type="button"
  onClick={() => setOpen(true)}
  aria-label={`View image: ${alt ?? 'Image'}`}
  className="block w-full cursor-zoom-in relative min-h-48 ..."
>
```

`cursor-zoom-in` communicates the click affordance visually.

---

## Full Accessibility Summary

| Concern             | Solution                                              |
| ------------------- | ----------------------------------------------------- |
| Keyboard activation | Native `<button>` element                             |
| Button label        | `aria-label="View image: {alt}"`                      |
| Dialog name         | `DialogPrimitive.Title` (sr-only) with `title ?? alt` |
| Focus trap          | Radix Dialog built-in                                 |
| Escape to close     | Radix Dialog built-in                                 |
| Explicit close      | X icon button inside the sheet                        |
| Semantic caption    | `<figure>` + `<figcaption>`                           |

---

## Constraints & Non-Goals

- No zoom/pinch gestures inside the sheet
- No multi-image carousel (single image only)
- No lazy loading via IntersectionObserver (`loading="lazy"` can be added as a future pass)
- The `<figure>` replaces the current top-level `<img>` — `my-4` margin moves to `<figure>` to preserve vertical spacing in the document
