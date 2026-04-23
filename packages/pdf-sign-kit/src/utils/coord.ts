import type { PageSize } from '../types';

export function pixelsToNormalized(
  leftPx: number,
  topPx: number,
  widthPx: number,
  heightPx: number,
  pageSize: PageSize,
  scale: number,
) {
  const pageW = pageSize.width * scale;
  const pageH = pageSize.height * scale;
  return {
    x: leftPx / pageW,
    y: topPx / pageH,
    width: widthPx / pageW,
    height: heightPx / pageH,
  };
}

export function normalizedToPixels(
  x: number,
  y: number,
  width: number,
  height: number,
  pageSize: PageSize,
  scale: number,
) {
  const pageW = pageSize.width * scale;
  const pageH = pageSize.height * scale;
  return {
    left: x * pageW,
    top: y * pageH,
    width: width * pageW,
    height: height * pageH,
  };
}
