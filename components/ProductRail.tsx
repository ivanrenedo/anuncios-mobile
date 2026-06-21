import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import ProductCard, { ProductCardItem, ProductCardSkeleton } from '@/components/ProductCard';

interface Props {
  title: string;
  items: ProductCardItem[];
  cardWidth?: number;
  onSeeAll?: () => void;
  loading?: boolean;
}

export default function ProductRail({
  title,
  items,
  cardWidth = 160,
  onSeeAll,
  loading,
}: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const toggleLike = (id: string) =>
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {loading && items.length === 0
          ? [0, 1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} width={cardWidth} />
            ))
          : items.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                liked={!!liked[item.id]}
                onLike={() => toggleLike(item.id)}
                onPress={() =>
                  router.push({ pathname: '/product/[id]', params: { id: item.id } })
                }
                width={cardWidth}
              />
            ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
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
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
