import { Platform } from 'react-native';

const DEV_API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__
    ? Platform.select({
        android: 'http://192.168.0.101:3000',
        ios: 'http://192.168.0.101:3000',
        default: 'http://192.168.0.101:3000',
      })
    : 'https://api.bomelh.com');

export const API_URL = DEV_API_URL!;
export const GRAPHQL_URL = `${API_URL}/graphql`;
export const UPLOAD_URL = `${API_URL}/upload`;

// Public-facing URL for share links (OG previews require a URL reachable
// from the internet). Falls back to the API_URL for local testing.
export const SHARE_URL =
  process.env.EXPO_PUBLIC_SHARE_URL ?? 'https://bomelh.com';

/** Resolve a possibly-relative image URL coming from the backend. */
export function resolveImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
}
