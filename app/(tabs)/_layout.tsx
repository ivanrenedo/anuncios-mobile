import { Tabs } from 'expo-router';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { Home, Heart, Plus, LayoutGrid, User } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { API_URL } from '@/lib/config';

export default function TabLayout() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { profile } = useProfile();
  const avatarUri = profile?.avatar_url
    ? profile.avatar_url.startsWith('/') ? `${API_URL}${profile.avatar_url}` : profile.avatar_url
    : null;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.onSurfaceVariant + '99',
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <Home
              size={size}
              color={color}
              fill={focused ? color : 'transparent'}
              strokeWidth={focused ? 0 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categorías',
          tabBarIcon: ({ color, size, focused }) => (
            <LayoutGrid
              size={size}
              color={color}
              strokeWidth={focused ? 2.2 : 1.5}
            />
          ),
        }}
      />
      {/* Explore stays as a route (search target) but hidden from the tab bar */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Vender',
          tabBarIcon: () => (
            <View style={styles.postButton}>
              <Plus size={28} color="#ffffff" strokeWidth={2.5} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Favorito',
          tabBarIcon: ({ color, size, focused }) => (
            <Heart
              size={size}
              color={color}
              fill={focused ? color : 'transparent'}
              strokeWidth={focused ? 0 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) =>
            avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={[
                  styles.profileAvatar,
                  { width: size, height: size },
                  focused && { borderColor: colors.secondary, borderWidth: 2 },
                ]}
              />
            ) : (
              <User
                size={size}
                color={color}
                fill={focused ? color : 'transparent'}
                strokeWidth={focused ? 0 : 1.5}
              />
            ),
        }}
      />
    </Tabs>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface + 'cc',
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '4d',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    elevation: 0,
  },
  tabLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 10,
    marginTop: 2,
  },
  profileAvatar: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  postButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 8 : 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
