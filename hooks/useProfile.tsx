import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apolloClient } from '@/lib/apollo';
import { ME } from '@/graphql/queries';
import { UPDATE_USER } from '@/graphql/mutations';
import { getErrorMessage, isGraphQLError } from '@/lib/errors';
import { useAuth } from './useAuth';

const STORAGE_KEY = 'market_eg_profile_v1';

export interface Profile {
  id: string;
  name: string;
  location: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
  email: string;
  phone: string;
  language: string;
  permission: 'GRANTED' | 'DENIED';
  notif_messages: boolean;
  notif_offers: boolean;
  notif_marketing: boolean;
  show_email: boolean;
  show_phone: boolean;
  dark_mode: boolean;
  theme_preference: 'system' | 'light' | 'dark';
  created_at: string;
  updated_at: string;
}

const DEFAULT_PROFILE: Profile = {
  id: '',
  name: '',
  location: '',
  bio: '',
  avatar_url: '',
  cover_url: '',
  email: '',
  phone: '',
  language: 'es',
  permission: 'GRANTED',
  notif_messages: true,
  notif_offers: true,
  notif_marketing: false,
  show_email: false,
  show_phone: true,
  dark_mode: false,
  theme_preference: 'system',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function apiToProfile(u: any): Profile {
  return {
    id: u.id,
    name: u.name || '',
    location: u.location || '',
    bio: u.bio || '',
    avatar_url: u.avatarUrl || '',
    cover_url: u.coverUrl || '',
    email: u.email || '',
    phone: u.phone || '',
    language: u.language || 'es',
    permission: u.permission || 'GRANTED',
    notif_messages: u.notifMessages ?? true,
    notif_offers: u.notifOffers ?? true,
    notif_marketing: u.notifMarketing ?? false,
    show_email: u.showEmail ?? false,
    show_phone: u.showPhone ?? true,
    dark_mode: false,
    theme_preference: u.themePreference || 'system',
    created_at: u.createdAt || new Date().toISOString(),
    updated_at: u.updatedAt || new Date().toISOString(),
  };
}

interface ProfileContextValue {
  profile: Profile;
  loading: boolean;
  error: null;
  refresh: () => Promise<void>;
  update: (patch: Partial<Profile>) => Promise<{ ok: boolean; error?: string }>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await apolloClient.query<any>({ query: ME, fetchPolicy: 'network-only' });
      if (data?.me) {
        const p = apiToProfile(data.me);
        setProfile(p);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      }
    } catch (err) {
      console.log('[Profile] Refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch profile when auth changes
  useEffect(() => {
    if (isAuthenticated && user) {
      (async () => {
        const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
        if (raw) {
          try { setProfile(JSON.parse(raw)); } catch { /* ignore */ }
        }
        refresh();
      })();
    } else {
      setProfile(DEFAULT_PROFILE);
    }
  }, [isAuthenticated, user?.id]);

  const update = useCallback(async (patch: Partial<Profile>) => {
    const input: Record<string, any> = {};
    if (patch.name !== undefined) input.name = patch.name;
    if (patch.phone !== undefined) input.phone = patch.phone;
    if (patch.avatar_url !== undefined) input.avatarUrl = patch.avatar_url;
    if (patch.cover_url !== undefined) input.coverUrl = patch.cover_url;
    if (patch.bio !== undefined) input.bio = patch.bio;
    if (patch.location !== undefined) input.location = patch.location;
    if (patch.language !== undefined) input.language = patch.language;
    if (patch.notif_messages !== undefined) input.notifMessages = patch.notif_messages;
    if (patch.notif_offers !== undefined) input.notifOffers = patch.notif_offers;
    if (patch.notif_marketing !== undefined) input.notifMarketing = patch.notif_marketing;
    if (patch.show_email !== undefined) input.showEmail = patch.show_email;
    if (patch.show_phone !== undefined) input.showPhone = patch.show_phone;
    if (patch.theme_preference !== undefined) input.themePreference = patch.theme_preference;

    try {
      const { data } = await apolloClient.mutate<any>({
        mutation: UPDATE_USER,
        variables: { input },
      });
      if (data?.updateUser) {
        const p = apiToProfile(data.updateUser);
        setProfile(p);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      }
      return { ok: true };
    } catch (err: any) {
      console.log('[Profile] Update error:', err);
      // The backend rejected the change (e.g. duplicate email): surface it.
      if (isGraphQLError(err)) {
        return { ok: false, error: getErrorMessage(err, 'No se pudo guardar el perfil.') };
      }
      // Network/offline: fall back to a local update so the UI stays responsive.
      setProfile((prev) => ({ ...prev, ...patch, updated_at: new Date().toISOString() }));
      return { ok: true };
    }
  }, []);

  const value = useMemo(
    () => ({ profile, loading, error: null, refresh, update }),
    [profile, loading, refresh, update]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
