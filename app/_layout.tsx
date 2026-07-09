import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@/lib/apollo';
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
          name="user/[id]"
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="verify-phone"
          options={{ animation: 'none', gestureEnabled: false }}
        />
        <Stack.Screen
          name="login"
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="help"
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="terms"
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="privacy"
          options={{ animation: 'none' }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
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
