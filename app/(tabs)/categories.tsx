import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, LayoutGrid } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useCategoryTree } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { API_URL } from '@/lib/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = 120;
const RIGHT_WIDTH = SCREEN_WIDTH - SIDEBAR_WIDTH;
const TILE_GAP = 12;
const TILE_WIDTH = (RIGHT_WIDTH - 16 * 2 - TILE_GAP * 2) / 3;
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 84 : 64;

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const paneAnim = useRef(new Animated.Value(1)).current;
  const rightScrollRef = useRef<ScrollView>(null);
  const { tree, loading } = useCategoryTree();
  const { products } = useProducts(100);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // Representative thumbnail per leaf category id (first product image found).
  const imageByCategory = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of products) {
      const cid = p.category?.id;
      const raw = p.images?.[0]?.url;
      if (cid && raw && !map[cid]) {
        map[cid] = raw.startsWith('/') ? `${API_URL}${raw}` : raw;
      }
    }
    return map;
  }, [products]);

  const active = tree.find((c: any) => c.slug === activeSlug) ?? tree[0];
  const subs: any[] = active?.children ?? [];

  const selectCategory = (slug: string) => {
    if (active && slug === active.slug) return;
    setActiveSlug(slug);
    rightScrollRef.current?.scrollTo({ y: 0, animated: false });
    paneAnim.setValue(0);
    Animated.timing(paneAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  };

  // Navigate to explore with the selected category/subcategory as filter value
  const goSearch = (term: string) => {
    router.push({ pathname: '/explore', params: { filterCat: term } });
  };

  const paneTranslate = paneAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Categorías</Text>
      </View>

      {/* Search */}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.8}
        onPress={() => goSearch('')}>
        <Search size={16} color={colors.onSurfaceVariant + '99'} strokeWidth={1.8} />
        <Text style={styles.searchPlaceholder}>Buscar en Bomell</Text>
      </TouchableOpacity>

      {loading && tree.length === 0 ? (
        <View style={styles.loadingFill}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : !active ? (
        <View style={styles.loadingFill}>
          <Text style={styles.emptyText}>No hay categorías disponibles.</Text>
        </View>
      ) : (
        <View style={styles.body}>
          {/* Left sidebar (text only, no icons) */}
          <View style={styles.sidebar}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 24 }}>
              {tree.map((cat: any) => {
                const isActive = cat.slug === active.slug;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.sideItem, isActive && styles.sideItemActive]}
                    activeOpacity={0.7}
                    onPress={() => selectCategory(cat.slug)}>
                    {isActive && (
                      <View
                        style={[styles.sideAccent, { backgroundColor: cat.color || colors.primary }]}
                      />
                    )}
                    <Text
                      style={[
                        styles.sideLabel,
                        isActive && {
                          color: colors.onSurface,
                          fontFamily: 'Manrope-Bold',
                        },
                      ]}
                      numberOfLines={2}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Right detail panel */}
          <Animated.View
            style={[
              styles.detail,
              { opacity: paneAnim, transform: [{ translateY: paneTranslate }] },
            ]}>
            <ScrollView
              ref={rightScrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                padding: 16,
                paddingBottom: TAB_BAR_HEIGHT + 24,
              }}>
              <Text style={styles.detailTitle}>{active.label}</Text>

              {subs.length === 0 ? (
                <Text style={styles.emptyText}>Sin subcategorías por ahora.</Text>
              ) : (
                <View style={styles.grid}>
                  {subs.map((sub: any) => {
                    const img = imageByCategory[sub.id];
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        style={styles.tile}
                        activeOpacity={0.8}
                        onPress={() => goSearch(sub.label)}>
                        <View style={styles.tileImageWrap}>
                          {img ? (
                            <Image source={{ uri: img }} style={styles.tileImage} />
                          ) : (
                            <LayoutGrid
                              size={24}
                              color={active.color || colors.primary}
                              strokeWidth={1.5}
                            />
                          )}
                        </View>
                        <Text style={styles.tileLabel} numberOfLines={2}>
                          {sub.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Ver todo tile → search by category name */}
                  <TouchableOpacity
                    style={styles.tile}
                    activeOpacity={0.8}
                    onPress={() => goSearch(active.label)}>
                    <View style={[styles.tileImageWrap, styles.tileAllWrap]}>
                      <LayoutGrid
                        size={26}
                        color={active.color || colors.primary}
                        strokeWidth={1.6}
                      />
                    </View>
                    <Text
                      style={[
                        styles.tileLabel,
                        { color: active.color || colors.primary, fontFamily: 'Manrope-SemiBold' },
                      ]}>
                      Ver todo
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontFamily: 'Manrope-Bold',
    fontSize: 24,
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  searchPlaceholder: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant + '99',
  },
  loadingFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '44',
  },
  // Sidebar
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.surfaceContainerLow,
  },
  sideItem: {
    paddingVertical: 18,
    paddingLeft: 18,
    paddingRight: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  sideItemActive: {
    backgroundColor: colors.surface,
  },
  sideAccent: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  sideLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  // Detail
  detail: {
    flex: 1,
  },
  detailTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: colors.onSurface,
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
  },
  tile: {
    width: TILE_WIDTH,
    alignItems: 'center',
    gap: 6,
  },
  tileImageWrap: {
    width: TILE_WIDTH,
    height: TILE_WIDTH,
    borderRadius: TILE_WIDTH / 2,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileAllWrap: {
    borderWidth: 1.2,
    borderColor: colors.primary + '55',
    borderStyle: 'dashed',
    backgroundColor: colors.primary + '08',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurface,
    textAlign: 'center',
    lineHeight: 15,
  },
});
