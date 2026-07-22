import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, BarChart2, LogIn } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';
import ProductCard, { ProductCardSkeleton, fmtPrice } from '@/components/ProductCard';
import CenterSafetyModal from '@/components/CenterSafetyModal';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites, useFavoriteToggle } from '@/hooks/useFavorites';
import { API_URL } from '@/lib/config';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { isAuthenticated } = useAuth();
  const { favorites, loading: favsLoading, refetch } = useFavorites();
  const { isFavorite, toggleFavorite } = useFavoriteToggle();
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [safetyOpen, setSafetyOpen] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); } catch {}
    setRefreshing(false);
  };

  const savedItems = useMemo(() => favorites.map((f: any) => {
    const p = f.product;
    const img = p.images?.[0]?.url || '';
    const s = p.createdAt ? Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 1000) : 0;
    const ago = !p.createdAt ? '' : s < 60 ? 'hace un momento' : s < 3600 ? `hace ${Math.floor(s / 60)} min` : s < 86400 ? `hace ${Math.floor(s / 3600)} h` : s < 2592000 ? `hace ${Math.floor(s / 86400)} d` : `hace ${Math.floor(s / 2592000)} meses`;
    return {
      id: p.id,
      title: p.title,
      price: fmtPrice(Number(p.price)),
      priceRaw: Number(p.price),
      condition: p.condition,
      category: p.category?.label || '',
      categoryLabel: p.category?.label || '',
      seller: p.seller?.name,
      sellerId: p.seller?.id,
      location: p.city,
      verified: p.seller?.verified,
      sellerPlan: p.seller?.effectivePlan ?? p.seller?.plan,
      avatar: p.seller?.avatarUrl,
      image: img.startsWith('/') ? `${API_URL}${img}` : img,
      priceValue: Number(p.price),
      discount: p.discount,
      operation: p.propertyDetail?.operation,
      offerType: p.serviceDetail?.offerType,
      isBoosted: p.boostedUntil ? new Date(p.boostedUntil) > new Date() : false,
      postedAgo: ago,
    };
  }), [favorites]);

  const categories = useMemo<string[]>(() => {
    const cats = new Set<string>(
      savedItems.map((i: any) => i.category as string).filter(Boolean),
    );
    return ['Todos', ...Array.from(cats)];
  }, [savedItems]);

  const visibleItems =
    activeCategory === 'Todos'
      ? savedItems
      : savedItems.filter((i: any) => i.category === activeCategory);

  const TOTAL = savedItems.reduce((sum: number, i: any) => sum + (i.priceValue || 0), 0);

  const pairs: (any | null)[][] = [];
  for (let i = 0; i < visibleItems.length; i += 2) {
    pairs.push([visibleItems[i], visibleItems[i + 1] ?? null]);
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top, height: 44 + insets.top }]}>
          <Text style={styles.headerTitle}>Favoritos</Text> 
        </View>
        <View style={styles.authGate}>
          <View style={styles.authIconWrap}>
            <Heart size={48} color={colors.primary} strokeWidth={1.2} />
          </View>
          <Text style={styles.authTitle}>Guarda tus favoritos</Text>
          <Text style={styles.authDesc}>
            Inicia sesión para guardar los anuncios que más te interesan y no perderlos de vista.
          </Text>
          <RipplePress
            style={styles.authBtn}
            borderRadius={14}
            rippleColor="rgba(255,255,255,0.25)"
            onPress={() => router.push('/login')}>
            <LogIn size={18} color="#ffffff" strokeWidth={2} />
            <Text style={styles.authBtnText}>Iniciar sesión</Text>
          </RipplePress>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 44 + insets.top }]}>
        <Text style={styles.headerTitle}>Favoritos</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 44 + insets.top + 8,
          paddingBottom: 32,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Category filter chips */}
        <View style={styles.chipsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {categories.map((cat) => (
              <RipplePress
                key={cat}
                style={[styles.chip, activeCategory === cat && styles.chipActive]}
                onPress={() => setActiveCategory(cat)}
                borderRadius={8}
                rippleColor={activeCategory === cat ? 'rgba(255,255,255,0.2)' : colors.primary + '18'}>
                <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </RipplePress>
            ))}
          </ScrollView>
        </View>

        {/* Product grid */}
        {favsLoading && savedItems.length === 0 ? (
          <View style={styles.grid}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.gridRow}>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </View>
            ))}
          </View>
        ) : visibleItems.length > 0 ? (
          <View style={styles.grid}>
            {pairs.map((pair, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {pair[0] && (
                  <ProductCard
                    item={pair[0]}
                    liked={isFavorite(pair[0]!.id)}
                    onLike={() => toggleFavorite(pair[0]!.id)}
                    onPress={() =>
                      router.push({ pathname: '/product/[id]', params: { id: pair[0]!.id } })
                    }
                  />
                )}
                {pair[1] && (
                  <ProductCard 
                    item={pair[1]}
                    liked={isFavorite(pair[1]!.id)}
                    onLike={() => toggleFavorite(pair[1]!.id)}
                    onPress={() =>
                      router.push({ pathname: '/product/[id]', params: { id: pair[1]!.id } })
                    }
                  />
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Heart size={40} color={colors.primary + '66'} strokeWidth={1} />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyDesc}>No tienes guardados en esta categoría.</Text>
          </View>
        )}

        {/* Summary insight card */}
        {visibleItems.length > 0 && (
          <View style={styles.insightSection}>
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <BarChart2 size={22} color={colors.primary} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>Resumen de Guardados</Text>
                <Text style={styles.insightDesc}>
                  Tienes {savedItems.length} artículos guardados que suman un total de{' '}
                  <Text style={styles.insightAmount}>{fmtPrice(TOTAL)}</Text>.{' '}
                  ¡No pierdas las mejores ofertas!
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <CenterSafetyModal visible={safetyOpen} onClose={() => setSafetyOpen(false)} />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 24,
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  chipsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: colors.surfaceContainerHigh,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: '#ffffff',
  },
  grid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 17,
    color: colors.onSurface,
  },
  emptyDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 220,
  },
  insightSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  insightCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.primary + '0a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.primary + '22',
    alignItems: 'flex-start',
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  insightTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  insightDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 19,
  },
  insightAmount: {
    fontFamily: 'Manrope-Bold',
    color: colors.onSurface,
  },
  authGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  authIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary + '0f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  authTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 22,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  authDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: colors.primary,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  authBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});
