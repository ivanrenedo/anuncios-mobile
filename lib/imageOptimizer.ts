import * as ImageManipulator from 'expo-image-manipulator';

export interface OptimizeOpts {
  /** Max size in pixels for the longer side. Default 1600. */
  maxDim?: number;
  /** JPEG quality 0..1. Default 0.85. */
  quality?: number;
  /** Original dimensions from ImagePicker — used to skip resize when already
   *  small enough (never upscale). If unknown, we always run through the
   *  manipulator, which still gives us the recompression + HEIC→JPEG win. */
  sourceWidth?: number;
  sourceHeight?: number;
  /**
   * Target aspect ratio (width / height) for a centered crop. Skips the
   * OS-native crop UI (whose "Choose" button is invisible on several Android
   * skins) and does a deterministic center crop instead. Common values:
   *   1        → avatar (square)
   *   16 / 9   → cover / hero
   * Requires both `sourceWidth` and `sourceHeight`; without them we can't
   * compute the crop rectangle and just skip cropping.
   */
  targetAspect?: number;
}

/**
 * Downscale + recompress a picked photo so it stays under a couple hundred
 * KB without visible quality loss. A 12 MP HEIC from a modern phone (~5 MB)
 * comes out around 300-500 KB JPEG at 1600px / q=0.85 — plenty for a
 * marketplace listing and well below any server-side cap.
 *
 * Optionally center-crops to a target aspect ratio before resizing, so
 * callers can skip `allowsEditing: true` on ImagePicker (whose crop UI has
 * poor visual contrast on some devices).
 *
 * Fails softly: if the manipulator can't handle the source (unsupported
 * codec, corrupted file), we return the original URI so the upload can
 * still be attempted. The server-side cap is the last defense.
 */
export async function optimizeImage(
  uri: string,
  opts: OptimizeOpts = {},
): Promise<string> {
  const maxDim = opts.maxDim ?? 1600;
  const quality = opts.quality ?? 0.85;
  const sw = opts.sourceWidth ?? 0;
  const sh = opts.sourceHeight ?? 0;

  const actions: ImageManipulator.Action[] = [];

  // 1) Center-crop to the requested aspect, if we can compute it.
  let workingW = sw;
  let workingH = sh;
  if (opts.targetAspect && sw > 0 && sh > 0) {
    const sourceAspect = sw / sh;
    if (Math.abs(sourceAspect - opts.targetAspect) > 0.01) {
      let cropW: number;
      let cropH: number;
      if (sourceAspect > opts.targetAspect) {
        // Too wide → trim the sides.
        cropH = sh;
        cropW = Math.round(sh * opts.targetAspect);
      } else {
        // Too tall → trim top+bottom.
        cropW = sw;
        cropH = Math.round(sw / opts.targetAspect);
      }
      const originX = Math.floor((sw - cropW) / 2);
      const originY = Math.floor((sh - cropH) / 2);
      actions.push({ crop: { originX, originY, width: cropW, height: cropH } });
      workingW = cropW;
      workingH = cropH;
    }
  }

  // 2) Downscale so the longer side ≤ maxDim (never upscales).
  if (workingW > maxDim || workingH > maxDim) {
    if (workingW >= workingH) actions.push({ resize: { width: maxDim } });
    else actions.push({ resize: { height: maxDim } });
  }

  try {
    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return result.uri;
  } catch {
    return uri;
  }
}
