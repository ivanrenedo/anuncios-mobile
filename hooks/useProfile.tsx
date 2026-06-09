import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

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
  notif_messages: boolean;
  notif_offers: boolean;
  notif_marketing: boolean;
  show_email: boolean;
  show_phone: boolean;
  dark_mode: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Antonio Mbá',
  location: 'Malabo, Guinea Ecuatorial',
  bio: 'Vendedor verificado · Miembro desde 2022 · Responde en menos de 1h',
  avatar_url:
    'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
  cover_url:
    'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1200',
  email: 'antonio.mba@example.com',
  phone: '+240 222 000 000',
  language: 'es',
  notif_messages: true,
  notif_offers: true,
  notif_marketing: false,
  show_email: false,
  show_phone: true,
  dark_mode: false,
  created_at: '2022-01-01T00:00:00.000Z',
  updated_at: new Date().toISOString(),
};

interface ProfileContextValue {
  profile: Profile;
  loading: false;
  error: null;
  refresh: () => Promise<void>;
  update: (patch: Partial<Profile>) => Promise<{ ok: boolean; error?: string }>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  const refresh = useCallback(async () => {}, []);

  const update = useCallback(async (patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch, updated_at: new Date().toISOString() }));
    return { ok: true };
  }, []);

  const value = useMemo(
    () => ({ profile, loading: false as const, error: null, refresh, update }),
    [profile, refresh, update]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
