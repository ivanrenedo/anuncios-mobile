import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export function usePhoneGate() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loading = useAuthStore((s) => s.loading);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    const onVerifyScreen = segments.includes('verify-phone' as never);
    const onLoginScreen = segments.includes('login' as never);
    if (!user.phone && !onVerifyScreen && !onLoginScreen) {
      router.replace('/verify-phone' as any);
    }
  }, [loading, isAuthenticated, user, segments]);
}
