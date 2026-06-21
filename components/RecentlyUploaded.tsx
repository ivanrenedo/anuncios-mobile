import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Sparkles, Clock } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import ProductCard, { ProductCardItem, ProductCardSkeleton } from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { API_URL } from '@/lib/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function toCardItem(p: any): ProductCardItem {
  const img = p.images?.[0]?.url || '';
  return {
    id: p.id,
    title: p.title,
    price: `${Number(p.price).toLocaleString('es')} XAF`,
    location: p.city,
    seller: p.seller?.name,
    avatar: p.seller?.avatarUrl,
    verified: p.seller?.verified,
    image: img.startsWith('/') ? `${API_URL}${img}` : img,
    condition: p.condition,
  };
}

const TABS = [
  { key: 'forYou', label: 'Para ti', icon: Sparkles },
  { key: 'recent', label: 'Novedades', icon: Clock },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const PAGE_SIZE = 4;
const TAB_WIDTH = (SCREEN_WIDTH - 32 - 8) / 2;

export default function RecentlyUploaded() {
  const router = useRouter();
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<TabKey>('forYou');
  const [countForYou, setCountForYou] = useState(PAGE_SIZE);
  const [countRecent, setCountRecent] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const { products: allProducts, loading } = useProducts(20);

  const forYouItems = useMemo(() => allProducts.map(toCardItem), [allProducts]);
  const recentItems = useMemo(
    () => [...allProducts].sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).map(toCardItem),
    [allProducts]
  );

  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const switchTab = (tab: TabKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    Animated.spring(indicatorAnim, {
      toValue: tab === 'forYou' ? 0 : 1,
      damping: 20,
      stiffness: 260,
      useNativeDriver: true,
    }).start();
  };

  const toggleLike = (id: string) =>
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));

  const pool = activeTab === 'forYou' ? forYouItems : recentItems;
  const count = activeTab === 'forYou' ? countForYou : countRecent;
  const setCount = activeTab === 'forYou' ? setCountForYou : setCountRecent;

  const visible = pool.slice(0, count);
  const hasMore = count < pool.length;

  const pairs = useMemo(() => {
    const out: ProductCardItem[][] = [];
    for (let i = 0; i < visible.length; i += 2) out.push(visible.slice(i, i + 2));
    return out;
  }, [visible]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setCount((c: number) => Math.min(c + PAGE_SIZE, pool.length));
      setLoadingMore(false);
    }, 300);
  };

  const indicatorTranslate = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TAB_WIDTH + 8],
  });

  if (loading && allProducts.length === 0) {
    return (
      <View style={styles.section}>
        {[0, 1, 2].map((row) => (
          <View key={row} style={styles.row}>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </View>
        ))}
      </View>
    );
  }

  if (pool.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.tabBar}>
        <Animated.View
          style={[
            styles.tabIndicator,
            { width: TAB_WIDTH, transform: [{ translateX: indicatorTranslate }] },
          ]}
        />
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() => switchTab(tab.key)}>
              <Icon
                size={15}
                color={active ? colors.primary : colors.onSurfaceVariant}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {pairs.map((pair, rowIdx) => (
        <View key={`${activeTab}-${rowIdx}`} style={styles.row}>
          {pair.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              liked={!!liked[item.id]}
              onLike={() => toggleLike(item.id)}
              onPress={() =>
                router.push({ pathname: '/product/[id]', params: { id: item.id } })
              }
            />
          ))}
          {pair.length === 1 && <View style={styles.placeholder} />}
        </View>
      ))}

      {hasMore ? (
        <TouchableOpacity
          style={styles.loadMore}
          onPress={loadMore}
          activeOpacity={0.85}
          disabled={loadingMore}
          accessibilityRole="button"
          accessibilityLabel="Cargar más productos">
          {loadingMore ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Plus size={16} color={colors.primary} strokeWidth={2} />
              <Text style={styles.loadMoreText}>Cargar más</Text>
            </>
          )}
        </TouchableOpacity>
      ) : visible.length > 0 ? (
        <Text style={styles.endText}>Has visto todos los productos</Text>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    position: 'relative' as const,
    gap: 8,
  },
  tabIndicator: {
    position: 'absolute' as const,
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 10,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  tabLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  tabLabelActive: {
    fontFamily: 'Manrope-Bold',
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  placeholder: {
    flex: 1,
  },
  loadMore: {
    marginTop: 4,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  loadMoreText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.primary,
  },
  endText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant + '99',
    textAlign: 'center',
    marginTop: 8,
  },
});
