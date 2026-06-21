import { create } from 'zustand';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { apolloClient, setToken, removeToken, getToken } from '@/lib/apollo';
import { GOOGLE_LOGIN } from '@/graphql/mutations';
import { ME } from '@/graphql/queries';

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
  email: string;
  avatar: string;
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
          const { data }: any = await apolloClient.query({ query: ME });
          if (data?.me?.permission === 'DENIED') {
            // Account blocked by an admin: surface it and end the session.
            Alert.alert(
              'Cuenta suspendida',
              'Tu cuenta ha sido suspendida. Si crees que es un error, contacta con soporte.',
            );
            throw new Error('Account suspended');
          }
          if (data?.me) {
            const fresh: AuthUser = {
              id: data.me.id,
              name: data.me.name,
              email: data.me.email,
              avatar: data.me.avatarUrl || cached.avatar,
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
    } catch {
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
        email: user.email,
        avatar: user.avatarUrl || googleUser.avatar,
      };
      set({ user: authUser, isAuthenticated: true });
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      return authUser;
    } catch (err) {
      console.log('[Auth] Backend login error:', err);
      Alert.alert(
        'No se pudo iniciar sesión',
        'No se pudo conectar con el servidor. Comprueba tu conexión y que el backend sea accesible desde el dispositivo (variable EXPO_PUBLIC_API_URL).',
      );
      return null;
    }
  },

  completeWebLogin: async (googleAccessToken) => {
    try {
      const res = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${googleAccessToken}` } },
      );
      const info = await res.json();
      await get().loginWithBackend({
        id: info.sub,
        email: info.email,
        name: info.name,
        avatar: info.picture,
      });
    } catch (err) {
      console.log('[Auth] Web login error:', err);
    }
  },

  signInWithGoogleNative: async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const googleResult = await GoogleSignin.signIn();
      if (isSuccessResponse(googleResult)) {
        const { user: gUser } = googleResult.data;
        const googleUser: GoogleUser = {
          id: gUser.id,
          email: gUser.email,
          name: gUser.name || '',
          avatar: gUser.photo || '',
        };
        const result = await get().loginWithBackend(googleUser);
        if (result) {
          console.log('[Auth] Login exitoso:', result.email);
        }
        // If result is null, loginWithBackend already surfaced the reason
        // (suspended account or connection error). Don't fake an offline
        // login — a session without a backend token only breaks every guarded
        // query afterwards.
      }
    } catch (err: any) {
      // Silent only when the user explicitly cancels the picker.
      if (err?.code === statusCodes.SIGN_IN_CANCELLED) return;
      console.log('[Auth] Google Sign-In error:', err?.code, err?.message);
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
