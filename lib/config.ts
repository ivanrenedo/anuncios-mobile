import { Platform } from 'react-native';

// On a physical device the backend is reached via the host's LAN IP
// (phone + PC on the same Wi-Fi, backend listening on 0.0.0.0).
// Override with EXPO_PUBLIC_API_URL in .env if your IP changes.
// 10.0.2.2 is only the Android *emulator* alias for the host's localhost.
const DEV_API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Platform.select({
    android: 'http://192.168.0.101:3000',
    ios: 'http://192.168.0.101:3000',
    default: 'http://192.168.0.101:3000',
  });

export const API_URL = DEV_API_URL!;
export const GRAPHQL_URL = `${API_URL}/graphql`;
export const UPLOAD_URL = `${API_URL}/upload`;

// Public-facing URL for share links (OG previews require a URL reachable
// from the internet). Falls back to the API_URL for local testing.
export const SHARE_URL = process.env.EXPO_PUBLIC_SHARE_URL ?? API_URL;

// Business WhatsApp number for manual payment flows (plans, boosts).
// Single source of truth — update here when the number changes.
export const WHATSAPP_NUMBER = '240222626418';
export const EMAIL = 'digitalcorps365@gmail.com';

/** Resolve a possibly-relative image URL coming from the backend. */
export function resolveImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
}
