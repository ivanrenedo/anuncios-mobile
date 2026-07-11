import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock, Crown, Flame, Heart, Star, Tag, TrendingUp } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import ProductCard, { ProductCardItem, ProductCardSkeleton } from '@/components/ProductCard';
import { useFavoriteToggle } from '@/hooks/useFavorites';

const RAIL_GAP = 12;

interface Props {
  title: string;
  icon?: string | null;
  items: ProductCardItem[];
  cardWidth?: number;
  onSeeAll?: () => void;
  loading?: boolean;
  autoplay?: boolean;
  autoplayMs?: number;
}

const ICON_MAP: Record<string, any> = {
  flame: Flame, clock: Clock, tag: Tag, star: Star,
  crown: Crown, "trending-up": TrendingUp, heart: Heart
};

const ICON_COLOR: Record<string, string> = {
  flame: '#D85A30',
  tag: '#185FA5',
  'trending-up': '#3B6D11',
  heart: '#A32D2D',
  clock: '#854F0B',
  star: '#534AB7',
  crown: '#7C3AED',
};

function getIcon(name?: string | null) {
  const Icon = ICON_MAP[name ?? ""] ?? Star;
  return Icon;
}

function getIconColor(name?: string | null) {
  return ICON_COLOR[name ?? ''] ?? '#534AB7';
}

export default function ProductRail({
  title,
  icon,
  items,
  cardWidth = 180,
  onSeeAll,
  loading,
  autoplay,
  autoplayMs = 3500,
}: Props) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavoriteToggle();

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const Icon = getIcon(icon);
  const iconColor = getIconColor(icon);

  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const userInteractingRef = useRef(false);
  const pitch = cardWidth + RAIL_GAP;

  useEffect(() => {
    if (!autoplay || items.length < 2) return;
    indexRef.current = 0;
    const id = setInterval(() => {
      if (userInteractingRef.current) return;
      indexRef.current = (indexRef.current + 1) % items.length;
      scrollRef.current?.scrollTo({ x: indexRef.current * pitch, animated: true });
    }, autoplayMs);
    return () => clearInterval(id);
  }, [autoplay, autoplayMs, items.length, pitch]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.contentTitle}>
          <View style={[styles.iconTitle, { backgroundColor: iconColor + '18' }]}>
            <Icon size={17} color={iconColor} strokeWidth={2.2}
            />
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
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScrollBeginDrag={() => {
          userInteractingRef.current = true;
        }}
        onScrollEndDrag={() => {
          userInteractingRef.current = false;
        }}>
        {loading && items.length === 0
          ? [0, 1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} width={cardWidth} />
            ))
          : items.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                liked={isFavorite(item.id)}
                onLike={() => toggleFavorite(item.id)}
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
  contentTitle: {
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
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
    fontWeight: 'medium',
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
    gap: RAIL_GAP,
  },
});
