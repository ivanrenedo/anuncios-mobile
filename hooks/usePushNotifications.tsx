import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { useAuth } from './useAuth';
import { apolloClient } from '@/lib/apollo';
import { REGISTER_PUSH_TOKEN, REMOVE_PUSH_TOKEN } from '@/graphql/mutations';
import { GET_NOTIFICATIONS, UNREAD_COUNT } from '@/graphql/queries';

// expo-notifications / expo-device are native modules. If the running binary
// predates their install (Expo Go, or a dev build made before adding push),
// importing them throws "Cannot find native module 'ExpoPushTokenManager'" at
// module load and crashes the whole app. Load them defensively via require so
// push just stays disabled instead of bricking the app — a fresh dev build
// (eas build) enables it.
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  Notifications = null;
  Device = null;
}

/** Ask permission and resolve the device's Expo push token (null if unavailable). */
async function getExpoPushToken(): Promise<string | null> {
  const N = Notifications;
  const D = Device;
  if (!N || !D) return null;
  // Emulators/simulators can't receive remote push.
  if (!D.isDevice) return null;

  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('default', {
      name: 'General',
      importance: N.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1f6feb',
    });
  }

  const existing = await N.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await N.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;
  if (!projectId) return null;

  try {
    const { data } = await N.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}

/**
 * Registers the device for push while authenticated and reacts to taps.
 * Mounted once near the app root (see app/_layout.tsx). No-ops when the native
 * notifications module isn't present in the current binary.
 */
export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [registerToken] = useMutation(REGISTER_PUSH_TOKEN);
  const [removeToken] = useMutation(REMOVE_PUSH_TOKEN);
  const tokenRef = useRef<string | null>(null);

  // Register on login, unregister on logout.
  useEffect(() => {
    if (!Notifications) return;
    let cancelled = false;
    if (isAuthenticated) {
      getExpoPushToken().then((token) => {
        if (cancelled || !token) return;
        tokenRef.current = token;
        registerToken({ variables: { token, platform: Platform.OS } }).catch(
          () => {},
        );
      });
    } else if (tokenRef.current) {
      const token = tokenRef.current;
      tokenRef.current = null;
      removeToken({ variables: { token } }).catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Refresh the in-app list + unread badge when a push lands in foreground.
  useEffect(() => {
    if (!Notifications) return;
    const sub = Notifications.addNotificationReceivedListener(() => {
      apolloClient
        .refetchQueries({ include: [GET_NOTIFICATIONS, UNREAD_COUNT] })
        .catch(() => {});
    });
    return () => sub.remove();
  }, []);

  // Deep-link when the user taps a notification.
  useEffect(() => {
    if (!Notifications) return;
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        if (data?.productId) {
          router.push({ pathname: '/product/[id]', params: { id: String(data.productId) } });
        } else if (data?.userId) {
          router.push({ pathname: '/user/[id]', params: { id: String(data.userId) } });
        }
      },
    );
    return () => sub.remove();
  }, [router]);
}
