import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export type { AuthUser } from '@/store/authStore';

/**
 * Auth state lives in a Zustand store (store/authStore.ts). This provider
 * only fires the initial hydration on mount. It renders no context.
 *
 * Note: the web OAuth flow (expo-auth-session / expo-web-browser) was
 * removed with the web platform target. Sign-in is native-only via
 * @react-native-google-signin/google-signin.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);
  return <>{children}</>;
}

/** Same API as before, backed by the Zustand store. */
export function useAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signOut = useAuthStore((s) => s.signOut);
  return { isAuthenticated, user, loading, signInWithGoogle, signOut };
}
