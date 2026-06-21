import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
  RefreshControl,
} from 'react-native';
import { Bell, Search, LogIn } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import PromoCarousel from '@/components/PromoCarousel';
import CategoryScroll from '@/components/CategoryScroll';
import FeaturedSection from '@/components/FeaturedSection';
import RecentlyViewed from '@/components/RecentlyViewed';
import SponsoredAd from '@/components/SponsoredAd';
import RecentlyUploaded from '@/components/RecentlyUploaded';
import NotificationsModal from '@/components/NotificationsModal';
import CitySelector from '@/components/CitySelector';
import RipplePress from '@/components/RipplePress';
import { useUnreadCount } from '@/hooks/useNotifications';

const HEADER_HEIGHT = 56;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { isAuthenticated } = useAuth();
  const { count: unreadCount } = useUnreadCount();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [notifVisible, setNotifVisible] = useState(false);
  const [city, setCity] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const headerShadow = scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 0.06],
    extrapolate: 'clamp',
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulated refresh until the data layer is wired.
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            height: HEADER_HEIGHT + insets.top,
            shadowOpacity: headerShadow,
          },
        ]}>
        <Text style={styles.headerTitle}>Market EG</Text>
        <View style={styles.headerActions}>
          <RipplePress
            style={styles.iconBtn}
            borderRadius={18}
            rippleColor={colors.primary + '22'}
            accessibilityLabel="Buscar"
            onPress={() => router.push('/(tabs)/explore')}>
            <Search size={22} color={colors.primary} strokeWidth={1.8} />
          </RipplePress>
          {isAuthenticated ? (
            <View style={styles.bellWrap}>
              <RipplePress
                style={styles.iconBtn}
                borderRadius={18}
                rippleColor={colors.primary + '22'}
                accessibilityLabel="Notificaciones"
                onPress={() => setNotifVisible(true)}>
                <Bell size={22} color={colors.primary} strokeWidth={1.5} />
              </RipplePress>
              {unreadCount > 0 && (
                <View style={styles.badge} pointerEvents="none">
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <RipplePress
              style={styles.loginBtn}
              borderRadius={20}
              rippleColor="rgba(255,255,255,0.25)"
              accessibilityLabel="Iniciar sesión"
              onPress={() => router.push('/login')}>
              <LogIn size={15} color="#ffffff" strokeWidth={2} />
              <Text style={styles.loginBtnText}>Iniciar sesión</Text>
            </RipplePress>
          )}
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_HEIGHT + insets.top + 4 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={HEADER_HEIGHT + insets.top}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}>
        <CitySelector city={city} onChange={setCity} />
        <PromoCarousel />
        <CategoryScroll />
        <FeaturedSection />
        <SponsoredAd />
        <RecentlyViewed />
        <RecentlyUploaded />
        <View style={{ height: 16 }} />
      </Animated.ScrollView>

      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: colors.surface + 'cc',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      ios: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  headerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  bellWrap: {
    position: 'relative',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 9,
    color: '#ffffff',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  loginBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
    color: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 16,
  },
});
