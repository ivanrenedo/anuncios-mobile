import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, DEMO_PROFILE_ID } from '@/lib/supabase';

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

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (patch: Partial<Profile>) => Promise<{ ok: boolean; error?: string }>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', DEMO_PROFILE_ID)
      .maybeSingle();
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setProfile(data as Profile | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const update = useCallback(
    async (patch: Partial<Profile>) => {
      const optimistic = profile ? { ...profile, ...patch } : null;
      if (optimistic) setProfile(optimistic);

      const { data, error: err } = await supabase
        .from('profiles')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', DEMO_PROFILE_ID)
        .select()
        .maybeSingle();

      if (err) {
        setError(err.message);
        await fetchProfile();
        return { ok: false, error: err.message };
      }
      if (data) setProfile(data as Profile);
      return { ok: true };
    },
    [profile, fetchProfile]
  );

  const value = useMemo(
    () => ({ profile, loading, error, refresh: fetchProfile, update }),
    [profile, loading, error, fetchProfile, update]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
