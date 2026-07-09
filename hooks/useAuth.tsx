import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore, GOOGLE_WEB_CLIENT_ID } from '@/store/authStore';

export type { AuthUser } from '@/store/authStore';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/**
 * Auth state lives in a Zustand store (store/authStore.ts). This provider only
 * wires the React-bound pieces that can't live in the store: the web Google
 * AuthSession request and the initial hydration. It renders no context.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'marketeg' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID,
      responseType: AuthSession.ResponseType.Token,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      usePKCE: false,
    },
    discovery,
  );

  // Hydrate the persisted session on mount.
  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  // Expose the web prompt to the store so signInWithGoogle() can trigger it.
  useEffect(() => {
    useAuthStore
      .getState()
      .setWebPrompt(request ? () => promptAsync().then(() => {}) : null);
  }, [request, promptAsync]);

  // Handle the web auth response.
  useEffect(() => {
    if (Platform.OS !== 'web' || response?.type !== 'success') return;
    const accessToken = response.params?.access_token;
    if (accessToken) {
      useAuthStore.getState().completeWebLogin(accessToken);
    }
  }, [response]);

  return <>{children}</>;
}

/** Same API as before, now backed by the Zustand store. */
export function useAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signOut = useAuthStore((s) => s.signOut);
  return { isAuthenticated, user, loading, signInWithGoogle, signOut };
}
