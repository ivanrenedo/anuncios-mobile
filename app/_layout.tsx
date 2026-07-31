import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient, hydrateApolloCache } from '@/lib/apollo';
import { SEARCH_PRODUCTS } from '@/graphql/queries';
import { ProfileProvider } from '@/hooks/useProfile';
import { AuthProvider } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useFavoritesSync } from '@/hooks/useFavorites';
import { usePhoneGate } from '@/hooks/usePhoneGate';
import { ThemeProvider, useTheme } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { colors, isDark } = useTheme();
  usePushNotifications();
  useFavoritesSync();
  usePhoneGate();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
          
        }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen
          name="product/[id]"
          options={{ animation: 'none',  }}
        />
        <Stack.Screen
          name="explore"
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="user/[id]"
          options={{ animation: 'none', gestureEnabled: true,fullScreenGestureEnabled: true, }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ animation: 'slide_from_right', gestureEnabled: true,fullScreenGestureEnabled: true, }}
        />
        <Stack.Screen
          name="edit-listing/[id]"
          options={{ animation: 'slide_from_right', gestureEnabled: true,fullScreenGestureEnabled: true, }}
        />
        <Stack.Screen
          name="verify-phone"
          options={{ animation: 'none', gestureEnabled: false }}
        />
        <Stack.Screen
          name="login"
          options={{ animation: 'slide_from_right', gestureEnabled: true,fullScreenGestureEnabled: true, }}
        />
        <Stack.Screen
          name="help"
         options={{ animation: 'slide_from_right', gestureEnabled: true,fullScreenGestureEnabled: true, }}
        />
        <Stack.Screen
          name="terms"
         options={{ animation: 'slide_from_right', gestureEnabled: true,fullScreenGestureEnabled: true, }}
        />
        <Stack.Screen
          name="privacy"
         options={{ animation: 'slide_from_right', gestureEnabled: true,fullScreenGestureEnabled: true, }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  // Restore persisted Apollo cache before mounting the app so previously
  // visited screens paint from cache on cold start. Non-blocking on failure
  // — we still boot rather than trap the user on the splash.
  const [cacheReady, setCacheReady] = useState(false);
  useEffect(() => {
    hydrateApolloCache().finally(() => {
      setCacheReady(true);
      // Warm the Explore default query in the background. The first navigation
      // to Explore currently waits on this network round-trip before showing
      // real content; prefetching once cache is restored lets it paint from
      // cache instantly. Fire-and-forget — failures don't block boot.
      apolloClient
        .query({
          query: SEARCH_PRODUCTS,
          variables: {
            input: { sortBy: 'recent', take: 8, skip: 0 },
          },
          fetchPolicy: 'network-only',
        })
        .catch(() => {});
    });
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && cacheReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, cacheReady]);

  if ((!fontsLoaded && !fontError) || !cacheReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ApolloProvider client={apolloClient}>
          <AuthProvider>
            <ProfileProvider>
              <ThemeProvider>
                <RootNavigator />
              </ThemeProvider>
            </ProfileProvider>
          </AuthProvider>
        </ApolloProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
