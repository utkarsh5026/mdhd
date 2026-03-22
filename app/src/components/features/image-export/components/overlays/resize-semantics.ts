import type { ResizeAnchor } from './resize-handles';

export const resizeContentScale = (
  currentX: number,
  currentY: number,
  dx: number,
  dy: number,
  anchor: ResizeAnchor,
  naturalW: number,
  naturalH: number,
  offsetX: number,
  offsetY: number
): {
  contentScaleX: number;
  contentScaleY: number;
  contentOffsetX: number;
  contentOffsetY: number;
} => {
  const newScaleX = Math.max(0.25, Math.min(3, currentX + dx * 0.005));
  const newScaleY = Math.max(0.25, Math.min(3, currentY + dy * 0.005));
  return {
    contentScaleX: newScaleX,
    contentScaleY: newScaleY,
    // Shift the element so the anchor point stays visually fixed
    contentOffsetX: offsetX - anchor[0] * naturalW * (newScaleX - currentX),
    contentOffsetY: offsetY - anchor[1] * naturalH * (newScaleY - currentY),
  };
};

export const resizeAnnotationFontSize = (current: number, dx: number, dy: number) =>
  Math.max(8, Math.min(64, current + (dx + dy) * 0.1));

export const resizeWatermarkSize = (current: number, dx: number, dy: number) =>
  Math.max(8, Math.min(48, current + (dx + dy) * 0.075));
