import { create } from 'zustand';
import { Platform, Alert, AppState } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  apolloClient,
  setToken,
  removeToken,
  getToken,
  onAccountSuspended,
  resetSuspendedAlert,
} from '@/lib/apollo';
import { GOOGLE_LOGIN, LOGOUT } from '@/graphql/mutations';
import { ME } from '@/graphql/queries';
import { getErrorMessage } from '@/lib/errors';

const AUTH_STORAGE_KEY = 'market_eg_auth_v1';
const REFRESH_TOKEN_KEY = 'market_eg_refresh_token';

export const GOOGLE_WEB_CLIENT_ID =
  '97086228598-fqa8ukvkbijsronqag78mga4g1us41d3.apps.googleusercontent.com';

/** Reject if a promise (e.g. an unreachable backend call) doesn't settle in time. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms),
    ),
  ]);
}

if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });
}

export interface AuthUser {
  id: string;
  name: string;
  suspended: boolean;
  email: string;
  avatar: string;
  phone: string | null;
  verified: boolean;
}

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** Web-only: set by AuthProvider once the AuthSession request is ready. */
  _webPrompt: (() => Promise<void>) | null;
  setWebPrompt: (fn: (() => Promise<void>) | null) => void;
  hydrate: () => Promise<void>;
  loginWithBackend: (googleUser: GoogleUser) => Promise<AuthUser | null>;
  completeWebLogin: (googleAccessToken: string) => Promise<void>;
  signInWithGoogleNative: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  isAuthenticated: false,
  _webPrompt: null,

  setWebPrompt: (fn) => set({ _webPrompt: fn }),

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const token = await getToken();

      if (raw && token) {
        const cached = JSON.parse(raw) as AuthUser;
        try {
          // Validate the token *before* trusting the cached session. Otherwise a
          // stale/invalid token (e.g. after a DB reset) leaves the app in a
          // half-authenticated state that fires guarded queries → Unauthorized.
          const { data }: any = await apolloClient.query({
            query: ME,
          });

          if (data?.me?.permission === 'DENIED') {
            // Account blocked by an admin: surface it and end the session.
            Alert.alert(
              'Cuenta suspendida',
              'Tu cuenta ha sido suspendida. Si crees que es un error, contacta con soporte.',
            );
          }
          if (data?.me) {
            const fresh: AuthUser = {
              id: data.me.id,
              name: data.me.name,
              suspended: data.me.suspended,
              email: data.me.email,
              avatar: data.me.avatarUrl || cached.avatar,
              phone: data.me.phone || null,
              verified: data.me.verified ?? false,
            };
            set({ user: fresh, isAuthenticated: true });
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fresh));
          } else {
            throw new Error('Session no longer valid');
          }
        } catch {
          // Token expired / user gone — clear the stale session.
          set({ user: null, isAuthenticated: false });
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          await removeToken();
        }
      }
    } catch (error) {
      console.log({ error });
      /* ignore */
    } finally {
      set({ loading: false });
    }
  },

  loginWithBackend: async (googleUser) => {
    try {
      const { data } = await withTimeout(
        apolloClient.mutate({
          mutation: GOOGLE_LOGIN,
          variables: {
            input: {
              googleId: googleUser.id,
              email: googleUser.email,
              name: googleUser.name,
              avatar: googleUser.avatar,
            },
          },
        }),
        15000,
      );
      const { accessToken, refreshToken, user } = (data as any).googleLogin;
      if (user.permission === 'DENIED') {
        // Blocked account: refuse the login without storing any tokens.
        Alert.alert(
          'Cuenta suspendida',
          'Tu cuenta ha sido suspendida. Si crees que es un error, contacta con soporte.',
        );
        return null;
      }
      await setToken(accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      const authUser: AuthUser = {
        id: user.id,
        name: user.name,
        suspended: user.suspended,
        email: user.email,
        avatar: user.avatarUrl || googleUser.avatar,
        phone: user.phone || null,
        verified: user.verified ?? false,
      };
      set({ user: authUser, isAuthenticated: true });
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      resetSuspendedAlert();
      return authUser;
    } catch (err) {
      // back to a connection hint for network/timeout errors.
      Alert.alert(
        'No se pudo iniciar sesión',
        getErrorMessage(
          err,
          'No se pudo conectar con el servidor. Comprueba tu conexión y la URL del backend (hasPlayServices).',
        ),
      );
      return null;
    }
  },

  completeWebLogin: async (googleAccessToken) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });
      const info = await res.json();
      await get().loginWithBackend({
        id: info.sub,
        email: info.email,
        name: info.name,
        avatar: info.picture,
      });
    } catch {}
  },

  signInWithGoogleNative: async () => {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: false,
      });
      const googleResult = await withTimeout(GoogleSignin.signIn(), 45000);
      if (isSuccessResponse(googleResult)) {
        const { user: gUser } = googleResult.data;
        const googleUser: GoogleUser = {
          id: gUser.id,
          email: gUser.email,
          name: gUser.name || '',
          avatar: gUser.photo || '',
        };
        await get().loginWithBackend(googleUser);
      }
    } catch (err: any) {
      if (err?.code === statusCodes.SIGN_IN_CANCELLED) return;
      Alert.alert(
        'No se pudo iniciar sesión',
        `${err?.code ? `[${err.code}] ` : ''}${err?.message ?? String(err)}`,
      );
    }
  },

  signInWithGoogle: async () => {
    if (Platform.OS === 'web') {
      const prompt = get()._webPrompt;
      if (prompt) await prompt();
      return;
    }
    await get().signInWithGoogleNative();
  },

  signOut: async () => {
    await apolloClient.mutate({ mutation: LOGOUT }).catch(() => {});
    if (Platform.OS !== 'web') {
      try {
        await GoogleSignin.signOut();
      } catch {
        /* ignore */
      }
    }
    set({ user: null, isAuthenticated: false });
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await removeToken();
    await apolloClient.clearStore();
  },
}));

onAccountSuspended(() => {
  useAuthStore
    .getState()
    .signOut()
    .finally(() => {
      // Kick the user off whatever (possibly private) screen they were on.
      router.replace('/(tabs)');
    });
});

// Re-validate the session against the backend. A suspended ME query fails
// with ForbiddenException, which the Apollo errorLink turns into the alert +
// signOut above. Other failures (offline, expired token) are ignored here —
// hydrate/refresh flows own those.
function revalidateSession() {
  if (!useAuthStore.getState().isAuthenticated) return;

  apolloClient
    .query({ query: ME, fetchPolicy: 'network-only' })
    .catch(() => {});
}

// On foreground: a suspension applied while the app was backgrounded kicks
// the user out on resume instead of waiting for their next action.
AppState.addEventListener('change', (state) => {
  if (state === 'active') revalidateSession();
});
