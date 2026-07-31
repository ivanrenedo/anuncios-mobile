import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, ChevronRight, Clock, Flame, Heart, Star, Tag, TrendingUp, Crown } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import ProductCard, { ProductCardItem, ProductCardSkeleton, fmtPrice } from '@/components/ProductCard';
import { useFavoriteToggle } from '@/hooks/useFavorites';
import { useProducts } from '@/hooks/useProducts';
import { API_URL } from '@/lib/config';

const PAGE_SIZE = 4;

const ICON_MAP: Record<string, any> = {
  flame: Flame, clock: Clock, tag: Tag, star: Star,
  'trending-up': TrendingUp, heart: Heart,crown: Crown
};

const ICON_COLOR: Record<string, string> = {
  flame: '#D85A30',
  tag: '#185FA5',
  'trending-up': '#3B6D11',
  heart: '#A32D2D',
  clock: '#854F0B',
  star: '#534AB7',
  crown: '#ffcb05'
};

function getIcon(name?: string | null) {
  return ICON_MAP[name ?? ''] ?? Star;
}

function getIconColor(name?: string | null) {
  return ICON_COLOR[name ?? ''] ?? '#534AB7';
}

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
    image: img.startsWith('/') ? `${API_URL}${img}` : img,
    condition: p.condition,
    discount: p.discount,
    categoryLabel: p.category?.label,
    operation: p.propertyDetail?.operation,
    offerType: p.serviceDetail?.offerType,
    isBoosted: p.boostedUntil ? new Date(p.boostedUntil) > new Date() : false,
    postedAgo: timeAgo(p.createdAt),
  };
}

interface Props {
  title: string;
  icon?: string | null;
  items?: ProductCardItem[];
  loading?: boolean;
  onSeeAll?: () => void;
}

function ProductGrid({
  title,
  icon,
  items: externalItems,
  loading: externalLoading,
  onSeeAll,
}: Props) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavoriteToggle();
  const [count, setCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const Icon = getIcon(icon);
  const iconColor = getIconColor(icon);

  const { products: apiProducts, loading: apiLoading } = useProducts(
    externalItems ? 0 : 20,
  );

  const pool = useMemo(
    () =>
      externalItems ??
      [...apiProducts]
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map(toCardItem),
    [externalItems, apiProducts],
  );

  const loading = externalLoading ?? apiLoading;
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
      setCount((c) => Math.min(c + PAGE_SIZE, pool.length));
      setLoadingMore(false);
    }, 300);
  };

  if (loading && pool.length === 0) {
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
      <View style={styles.header}>
        <View style={styles.contentTitle}>
          <View style={[styles.iconTitle, { backgroundColor: iconColor + '18' }]}>
            <Icon size={17} color={iconColor} strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        {onSeeAll && (
          <TouchableOpacity
            style={styles.seeAll}
            onPress={onSeeAll}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Ver todo: ${title}`}>
            <Text style={styles.seeAllText}>Ver todo</Text>
            <ChevronRight size={15} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {pairs.map((pair, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {pair.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              liked={isFavorite(item.id)}
              onLike={() => toggleFavorite(item.id)}
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
          accessibilityLabel="Cargar más anuncios">
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
        <Text style={styles.endText}>Has visto todos los anuncios</Text>
      ) : null}
    </View>
  );
}

export default React.memo(ProductGrid);

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    contentTitle: {
      flexDirection: 'row',
      gap: 5,
      alignItems: 'center',
    },
    iconTitle: {
      flexShrink: 0,
      borderRadius: 8,
      padding: 5,
    },
    title: { 
      fontFamily: 'Manrope-SemiBold',
      fontSize: 17,
      color: colors.onSurface,
      lineHeight: 22,
      letterSpacing: -0.2,
    },
    seeAll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
    },
    seeAllText: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 14,
      color: colors.primary,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
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
