import * as VideoThumbnails from 'expo-video-thumbnails';
import { UPLOAD_URL, resolveImage } from './config';
import { getToken } from './apollo';

export type MediaKind = 'image' | 'video';

/** Local asset picked from the library / camera, before upload. */
export interface MediaAsset {
  uri: string;
  type: MediaKind;
  /** Local thumbnail URI for videos — generated at pick time. */
  thumbnailUri?: string;
}

/** Uploaded media reference as it ends up in the backend input. */
export interface MediaItem {
  url: string;
  type: MediaKind;
  thumbnailUrl?: string;
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

function guessMime(uri: string, fallback: string): string {
  const m = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(uri);
  const ext = m?.[1]?.toLowerCase();
  return (ext && MIME_BY_EXT[ext]) || fallback;
}

async function presign(contentType: string): Promise<{
  uploadUrl: string;
  publicUrl: string;
}> {
  const token = await getToken();
  const res = await fetch(`${UPLOAD_URL}/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ contentType }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`presign failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Headers that must match what the backend signed in `presignPut`. Missing
// any of them makes DigitalOcean Spaces reject with 403 signature mismatch,
// or (worse) accept but drop the ACL so the object ends up private.
const SIGNED_CACHE_CONTROL = 'public, max-age=31536000, immutable';

function putToSpaces(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
  onBytes?: (loaded: number, total: number) => void,
): Promise<void> {
  // RN's fetch has no upload-progress event — XMLHttpRequest.upload.onprogress
  // is the only cross-platform way to report it without adding a native dep.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('x-amz-acl', 'public-read');
    xhr.setRequestHeader('Cache-Control', SIGNED_CACHE_CONTROL);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onBytes) onBytes(e.loaded, e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else
        reject(
          new Error(
            `upload PUT failed: ${xhr.status} ${xhr.responseText || ''}`,
          ),
        );
    };
    xhr.onerror = () => reject(new Error('upload PUT network error'));
    xhr.ontimeout = () => reject(new Error('upload PUT timed out'));
    xhr.send(blob);
  });
}

async function uploadOne(
  uri: string,
  kindHint: MediaKind,
  onBytes?: (loaded: number, total: number) => void,
): Promise<string> {
  const contentType = guessMime(
    uri,
    kindHint === 'video' ? 'video/mp4' : 'image/jpeg',
  );
  const fileRes = await fetch(uri);
  const blob = await fileRes.blob();
  const { uploadUrl, publicUrl } = await presign(contentType);
  await putToSpaces(uploadUrl, blob, contentType, onBytes);
  return publicUrl;
}

/**
 * Extract a still frame from a local video URI. Called at pick time so the
 * user sees a real preview immediately (and so we already have the file when
 * we upload later).
 */
export async function generateVideoThumbnail(
  videoUri: string,
): Promise<string | undefined> {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 500,
      quality: 0.7,
    });
    return uri;
  } catch {
    return undefined;
  }
}

export interface UploadOpts {
  /** Total upload progress across all assets, 0–100. */
  onProgress?: (percent: number) => void;
}

/**
 * Upload a batch of picked assets straight to Spaces via presigned URLs. For
 * videos, if a local thumbnail is present it's uploaded too. Fails fast on
 * the first asset error so callers can Alert once instead of half-succeeding.
 *
 * Progress is an even weighting per asset — precise byte accounting would
 * need pre-fetching every blob to sum sizes; the per-asset approximation is
 * good enough for a progress bar.
 */
export async function uploadMedia(
  assets: MediaAsset[],
  opts: UploadOpts = {},
): Promise<MediaItem[]> {
  const results: MediaItem[] = [];
  // Count only work we'll actually do: skip already-uploaded assets, count
  // extra unit for each video thumbnail.
  const units = assets.reduce((acc, a) => {
    if (/^https?:\/\//.test(a.uri)) return acc;
    return acc + 1 + (a.type === 'video' && a.thumbnailUri ? 1 : 0);
  }, 0);
  let doneUnits = 0;

  const report = (currentFraction: number) => {
    if (!opts.onProgress || units === 0) return;
    const pct = Math.min(
      100,
      Math.round(((doneUnits + currentFraction) / units) * 100),
    );
    opts.onProgress(pct);
  };

  const trackOne = (loaded: number, total: number) => {
    if (total > 0) report(loaded / total);
  };

  for (const asset of assets) {
    // Skip re-uploading remote URLs (edit flow: existing items keep their URLs).
    if (/^https?:\/\//.test(asset.uri)) {
      results.push({
        url: asset.uri,
        type: asset.type,
        thumbnailUrl:
          asset.thumbnailUri && /^https?:\/\//.test(asset.thumbnailUri)
            ? asset.thumbnailUri
            : undefined,
      });
      continue;
    }
    const url = await uploadOne(asset.uri, asset.type, trackOne);
    doneUnits += 1;
    report(0);

    let thumbnailUrl: string | undefined;
    if (asset.type === 'video' && asset.thumbnailUri) {
      thumbnailUrl = await uploadOne(asset.thumbnailUri, 'image', trackOne);
      doneUnits += 1;
      report(0);
    }
    results.push({ url, type: asset.type, thumbnailUrl });
  }
  opts.onProgress?.(100);
  return results;
}

// ─── Legacy proxy-based helpers (still used elsewhere; kept for now) ───────

export async function uploadImage(uri: string): Promise<string> {
  const token = await getToken();
  const name = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(name);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const form = new FormData();
  form.append('file', { uri, name, type } as any);

  const res = await fetch(`${UPLOAD_URL}/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${text}`);

  const data = JSON.parse(text);
  return resolveImage(data.url) ?? data.url;
}

export async function uploadImages(uris: string[]): Promise<string[]> {
  const token = await getToken();
  const form = new FormData();

  uris.forEach((uri) => {
    const name = uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(name);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    form.append('files', { uri, name, type } as any);
  });

  const res = await fetch(`${UPLOAD_URL}/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = await res.json();
  return (data.urls as string[]).map((u) => resolveImage(u) ?? u);
}
