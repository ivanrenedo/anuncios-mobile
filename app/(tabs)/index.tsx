import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Bell, Search, LogIn, Megaphone, Shield, Users, Clock, X, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useProductsBySeller } from '@/hooks/useProducts';
import { useHomeSections, type HomeSection } from '@/hooks/useHomeSections';
import PromoCarousel from '@/components/PromoCarousel';
import CategoryScroll from '@/components/CategoryScroll';
import PremiumStoresRail from '@/components/PremiumStoresRail';
import ProductRail from '@/components/ProductRail';
import ProductGrid from '@/components/ProductGrid';
import NotificationsModal from '@/components/NotificationsModal';
import RipplePress from '@/components/RipplePress';
import BrandLogo from '@/components/BrandLogo';
import Skeleton from '@/components/Skeleton';
import { ProductCardSkeleton } from '@/components/ProductCard';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { API_URL } from '@/lib/config';
import { ProductCardItem, fmtPrice } from '@/components/ProductCard';

const HEADER_HEIGHT = 56;

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'hace un momento';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  const mo = Math.floor(d / 30);
  return `hace ${mo} meses`;
}

function toCardItem(p: any): ProductCardItem {
  const img = p.images?.[0]?.url || '';
  return {
    id: p.id,
    title: p.title,
    price: fmtPrice(Number(p.price)),
    priceRaw: Number(p.price),
    location: p.city,
    seller: p.seller?.name,
    sellerId: p.seller?.id,
    avatar: p.seller?.avatarUrl,
    verified: p.seller?.verified,
    sellerPlan: p.seller?.effectivePlan ?? p.seller?.plan,

    priceReducedUntil: p.priceReducedUntil ?? null,
    image: img.startsWith('/') ? `${API_URL}${img}` : img,
    condition: p.condition,
    discount: p.discount,
    categoryLabel: p.category?.label,
    operation: p.propertyDetail?.operation ?? p.vehicleDetail?.operation,
    offerType: p.serviceDetail?.offerType,
    isBoosted: p.boostedUntil ? new Date(p.boostedUntil) > new Date() : false,
    postedAgo: timeAgo(p.createdAt),
  };
}

const SectionRenderer = React.memo(function SectionRenderer({
  section,
  trackEvent,
}: {
  section: HomeSection;
  trackEvent: (id: string, event: 'impression' | 'click') => void;
}) {
  const router = useRouter();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackEvent(section.id, 'impression');
    }
  }, [section.id, trackEvent]);

  // Stable callbacks so memoized children (PromoCarousel/ProductRail/ProductGrid)
  // can skip re-renders when nothing about their inputs changed.
  const handleSeeAll = useCallback(() => {
    trackEvent(section.id, 'click');
    router.push({
      pathname: '/explore',
      params: { sectionId: section.id },
    });
  }, [router, section.id, trackEvent]);

  const handleSlidePress = useCallback(() => {
    trackEvent(section.id, 'click');
  }, [section.id, trackEvent]);

  // Recompute only when the underlying products change reference.
  const items = useMemo(
    () => (section.products ?? []).map(toCardItem),
    [section.products],
  );

  switch (section.type) {
    case 'banner':
      return (
        <PromoCarousel config={section.config} onSlidePress={handleSlidePress} />
      );

    case 'categories':
      return <CategoryScroll />;

    case 'product_grid': {
      if (items.length === 0) return null;
      return (
        <ProductGrid
          title={section.title}
          icon={section.icon}
          items={items}
          onSeeAll={section.filter ? handleSeeAll : undefined}
        />
      );
    }

    case 'premium_showcase': {
      if (items.length === 0) return null;
      return (
        <ProductRail
          title={section.title}
          icon="crown"
          items={items}
          autoplay
          autoplayMs={4000}
        />
      );
    }

    case 'recent_views':
    case 'product_rail': {
      if (items.length === 0) return null;
      return (
        <ProductRail
          title={section.title}
          icon={section.icon}
          items={items}
          onSeeAll={section.filter ? handleSeeAll : undefined}
          autoplay={section.config?.autoplay}
          autoplayMs={section.config?.autoplayMs}
        />
      );
    }

    default:
      return null;
  }
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { isAuthenticated, user } = useAuth();
  const { count: unreadCount, refetch: refetchUnread } = useUnreadCount();
  const { products: myProducts } = useProductsBySeller(user?.id || '');
  const scrollY = useRef(new Animated.Value(0)).current;
  const [notifVisible, setNotifVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [ctaDismissed, setCtaDismissed] = useState(false);
  const showCta = !ctaDismissed && myProducts.length === 0;
  const { sections, loading, refetch, trackEvent } = useHomeSections();

  // Refresh feed + badge every time Home regains focus (returning from post,
  // from a product, from a background). Other users' new listings and freshly
  // arrived notifications become visible without a pull-to-refresh.
  useRefetchOnFocus([refetch, refetchUnread]); 

  const headerShadow = scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 0.06],
    extrapolate: 'clamp',
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchUnread()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchUnread]);

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
        <BrandLogo size={28} wordmarkSize={20} />
        <View style={styles.headerActions}>
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
        {/* Search bar */}
        <RipplePress
          style={styles.searchBar}
          borderRadius={12}
          rippleColor={colors.primary + '15'}
          onPress={() => router.push('/explore')}>
          <Search size={16} color={colors.onSurfaceVariant + '88'} strokeWidth={1.8} />
          <Text style={styles.searchPlaceholder}>¿Qué estás buscando?</Text>
        </RipplePress>

        {loading && sections.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <Skeleton style={{ height: 180, borderRadius: 16, marginHorizontal: 16, marginBottom: 24 }} />
            <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 28 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} style={{ width: 64, height: 32, borderRadius: 8 }} />
              ))}
            </View>
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Skeleton style={{ height: 20, width: '40%', borderRadius: 6, marginBottom: 14 }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 32 }}>
              {[0, 1, 2].map((i) => (
                <ProductCardSkeleton key={i} width={160} />
              ))}
            </View>
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Skeleton style={{ height: 20, width: '50%', borderRadius: 6, marginBottom: 14 }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16 }}>
              {[0, 1, 2].map((i) => (
                <ProductCardSkeleton key={i} width={160} />
              ))}
            </View>
          </View>
        ) : (
          sections.map((section, idx) => {
            const isAfterCategories = idx > 0 && sections[idx - 1]?.type === 'categories';
            const isFirstProduct = (section.type === 'product_rail' || section.type === 'product_grid') &&
              !sections.slice(0, idx).some((s) => s.type === 'product_rail' || s.type === 'product_grid');

            return (
              <React.Fragment key={section.id}>
                {/* CTA banner after categories */}
                {isAfterCategories && showCta && (
                  <View style={styles.ctaWrap}>
                    <LinearGradient
                      colors={[colors.primary, '#008a78', '#00a08a']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ctaBanner}>
                      <View style={styles.ctaCircle1} />
                      <View style={styles.ctaCircle2} />
                      <TouchableOpacity
                        style={styles.ctaDismiss}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => setCtaDismissed(true)}>
                        <X size={12} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
                      </TouchableOpacity>
                      <View style={styles.ctaIconWrap}>
                        <Megaphone size={18} color="#ffffff" strokeWidth={1.8} />
                      </View>
                      <Text style={styles.ctaTitle}>¿Tienes algo que vender?</Text>
                      <Text style={styles.ctaDesc}>
                        Publica tu anuncio en menos de 2 minutos. Es gratis y llega a miles de compradores.
                      </Text>
                      <RipplePress
                        style={styles.ctaBtn}
                        borderRadius={10}
                        rippleColor={colors.primary + '22'}
                        onPress={() => router.push('/(tabs)/post')}>
                        <Plus size={14} color={colors.primary} strokeWidth={2.5} />
                        <Text style={styles.ctaBtnText}>Publicar mi anuncio</Text>
                      </RipplePress>
                    </LinearGradient>
                  </View>
                )}

                <SectionRenderer section={section} trackEvent={trackEvent} />

                {/* v2 Fase 7b.2 — Tiendas Premium justo después de las
                    categorías. Auto-hide si la query no devuelve productos. */}
                {isAfterCategories && <PremiumStoresRail />}

                {/* Trust bar after first product section */}
                {isFirstProduct && (
                  <View style={styles.trustBar}>
                    <View style={styles.trustItem}>
                      <View style={styles.trustIconWrap}>
                        <Shield size={15} color={colors.primary} strokeWidth={1.8} />
                      </View>
                      <Text style={styles.trustLabel}>100% gratis</Text>
                      <Text style={styles.trustSub}>Sin comisiones</Text>
                    </View>
                    <View style={styles.trustItem}>
                      <View style={styles.trustIconWrap}>
                        <Users size={15} color={colors.primary} strokeWidth={1.8} />
                      </View>
                      <Text style={styles.trustLabel}>Compradores</Text>
                      <Text style={styles.trustSub}>En todo GE</Text>
                    </View>
                    <View style={styles.trustItem}>
                      <View style={styles.trustIconWrap}>
                        <Clock size={15} color={colors.primary} strokeWidth={1.8} />
                      </View>
                      <Text style={styles.trustLabel}>2 minutos</Text>
                      <Text style={styles.trustSub}>Para publicar</Text>
                    </View>
                  </View>
                )}
              </React.Fragment>
            );
          })
        )}

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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 4,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchPlaceholder: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant + '88',
  },
  ctaWrap: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  ctaBanner: {
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  ctaCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  ctaCircle2: {
    position: 'absolute',
    bottom: -14,
    left: -14,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  ctaDismiss: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  ctaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  ctaDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 19,
    marginBottom: 16,
    maxWidth: 260,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },
  ctaBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
    color: colors.primary,
  },
  trustBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    marginTop: -10
  },
  trustItem: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  trustIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  trustLabel: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    color: colors.onSurface,
    textAlign: 'center',
  },
  trustSub: {
    fontFamily: 'Manrope-Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
  },
  skeletonWrap: {
    paddingTop: 8,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
