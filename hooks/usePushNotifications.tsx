import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { useAuth } from './useAuth';
import { apolloClient } from '@/lib/apollo';
import { REGISTER_PUSH_TOKEN, REMOVE_PUSH_TOKEN } from '@/graphql/mutations';
import { GET_NOTIFICATIONS, UNREAD_COUNT } from '@/graphql/queries';

// Show the notification (banner + sound) even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Ask permission and resolve the device's Expo push token (null if unavailable). */
async function getExpoPushToken(): Promise<string | null> {
  // Emulators/simulators can't receive remote push.
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1f6feb',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;
  if (!projectId) return null;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}

/**
 * Registers the device for push while authenticated and reacts to taps.
 * Mounted once near the app root (see app/_layout.tsx).
 */
export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [registerToken] = useMutation(REGISTER_PUSH_TOKEN);
  const [removeToken] = useMutation(REMOVE_PUSH_TOKEN);
  const tokenRef = useRef<string | null>(null);

  // Register on login, unregister on logout.
  useEffect(() => {
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
    const sub = Notifications.addNotificationReceivedListener(() => {
      apolloClient
        .refetchQueries({ include: [GET_NOTIFICATIONS, UNREAD_COUNT] })
        .catch(() => {});
    });
    return () => sub.remove();
  }, []);

  // Deep-link when the user taps a notification.
  useEffect(() => {
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
