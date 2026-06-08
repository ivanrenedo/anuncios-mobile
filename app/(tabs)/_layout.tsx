import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Home, Heart, Plus, Search, User, Compass } from 'lucide-react-native';
import { colors } from '@/constants/theme';

export default function TabLayout() {
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
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, size, focused }) => (
            <Search
              size={size}
              color={color}
              fill={focused ? color : 'transparent'}
              strokeWidth={focused ? 0 : 1.5}
            />
          ),
        }}
      />
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
          tabBarIcon: ({ color, size, focused }) => (
            <User
              size={size}
              color={color}
              fill={focused ? color : 'transparent'}
              strokeWidth={focused ? 0 : 1.5}
            />
          ),
        }}
      /><Tabs.Screen
        name="safety"
        options={{ title: 'Seguridad', href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
