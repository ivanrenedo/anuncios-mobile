import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  ArrowDownUp,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getCategory } from '@/constants/categories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

type SortKey = 'recent' | 'price_asc' | 'price_desc';

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Más recientes',
  price_asc: 'Precio: menor',
  price_desc: 'Precio: mayor',
};

export default function CategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const category = getCategory(slug);

  const [activeSub, setActiveSub] = useState<string>('Todos');
  const [sort, setSort] = useState<SortKey>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const scrollY = React.useRef(new Animated.Value(0)).current;

  if (!category) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.notFoundTitle}>Categoría no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLinkBtn} activeOpacity={0.8}>
          <Text style={styles.backLinkText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleLike = (id: string) => setLiked((prev) => ({ ...prev, [id]: !prev[id] }));

  const filtered = useMemo(() => {
    let list = category.products;
    if (activeSub !== 'Todos') {
      list = list.filter((p) => p.subcategory === activeSub);
    }
    if (sort === 'price_asc') {
      list = [...list].sort((a, b) => a.priceValue - b.priceValue);
    } else if (sort === 'price_desc') {
      list = [...list].sort((a, b) => b.priceValue - a.priceValue);
    }
    return list;
  }, [activeSub, sort, category]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [120, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const Icon = category.Icon;

  return (
    <View style={styles.root}>
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={{ uri: category.hero }} style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.65)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.heroBackBtnWrap, { top: insets.top + 8 }]}>
          <TouchableOpacity style={styles.heroBackBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <ChevronLeft size={22} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View style={[styles.heroContent, { paddingBottom: 24 }]}>
          <View style={[styles.heroBadge, { backgroundColor: category.color }]}>
            <Icon size={14} color="#ffffff" strokeWidth={2} />
            <Text style={styles.heroBadgeText}>{category.label}</Text>
          </View>
          <Text style={styles.heroTitle}>{category.label}</Text>
          <Text style={styles.heroTagline}>{category.tagline}</Text>
          <Text style={styles.heroCount}>{category.products.length} anuncios disponibles</Text>
        </View>
      </View>

      {/* Sticky compact header (appears when scrolling) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stickyHeader,
          {
            paddingTop: insets.top,
            height: 52 + insets.top,
            opacity: headerOpacity,
          },
        ]}>
        <Text style={styles.stickyHeaderTitle}>{category.label}</Text>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
        {/* Subcategory chips */}
        <View style={styles.chipsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}>
            {category.subcategories.map((sub) => {
              const active = sub === activeSub;
              return (
                <TouchableOpacity
                  key={sub}
                  onPress={() => setActiveSub(sub)}
                  activeOpacity={0.85}
                  style={[
                    styles.chip,
                    active && { backgroundColor: category.color, borderColor: category.color },
                  ]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{sub}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <Text style={styles.resultCount}>
            {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
          </Text>
          <View style={styles.toolbarActions}>
            <TouchableOpacity
              style={styles.toolbarBtn}
              onPress={() => setSortOpen((v) => !v)}
              activeOpacity={0.8}>
              <ArrowDownUp size={14} color={colors.onSurfaceVariant} strokeWidth={1.7} />
              <Text style={styles.toolbarBtnText}>{SORT_LABELS[sort]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} activeOpacity={0.8}>
              <SlidersHorizontal size={14} color={colors.onSurfaceVariant} strokeWidth={1.7} />
              <Text style={styles.toolbarBtnText}>Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>

        {sortOpen && (
          <View style={styles.sortMenu}>
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  setSort(key);
                  setSortOpen(false);
                }}
                style={[styles.sortOption, sort === key && styles.sortOptionActive]}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.sortOptionText,
                    sort === key && { color: category.color, fontFamily: 'Manrope-SemiBold' },
                  ]}>
                  {SORT_LABELS[key]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: category.color + '15' }]}>
              <Search size={32} color={category.color + '99'} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyDesc}>
              No hay anuncios en {activeSub.toLowerCase()}. Prueba con otra subcategoría.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { width: CARD_WIDTH }]}
                activeOpacity={0.92}
                onPress={() => router.push('/product')}>
                <View style={styles.imageWrap}>
                  <Image source={{ uri: item.image }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => toggleLike(item.id)}
                    activeOpacity={0.85}>
                    <Heart
                      size={16}
                      color="#ffffff"
                      fill={liked[item.id] ? '#ffffff' : 'transparent'}
                      strokeWidth={1.5}
                    />
                  </TouchableOpacity>
                  <View style={styles.conditionBadge}>
                    <Text style={styles.conditionText}>{item.condition}</Text>
                  </View>
                </View>
                <View style={styles.info}>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.price, { color: category.color }]}>{item.price}</Text>
                  <View style={styles.locationRow}>
                    <MapPin size={11} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
                    <Text style={styles.location}>{item.location}</Text>
                  </View>
                  <View style={styles.sellerRow}>
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    <Text style={styles.sellerName} numberOfLines={1}>
                      {item.seller}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  notFoundTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  backLinkBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  backLinkText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
  hero: {
    height: 240,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroBackBtnWrap: {
    position: 'absolute',
    left: 16,
    zIndex: 5,
  },
  heroBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    paddingHorizontal: 20,
    gap: 6,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 6,
  },
  heroBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 30,
    color: '#ffffff',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  heroTagline: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    maxWidth: '90%',
  },
  heroCount: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
    zIndex: 10,
  },
  stickyHeaderTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  chipsWrap: {
    paddingTop: 16,
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '66',
  },
  chipText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultCount: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '66',
    backgroundColor: colors.surfaceContainerLowest,
  },
  toolbarBtnText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  sortMenu: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '66',
    overflow: 'hidden',
  },
  sortOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '33',
  },
  sortOptionActive: {
    backgroundColor: colors.surfaceContainerLow,
  },
  sortOptionText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurface,
  },
  grid: {
    paddingHorizontal: HORIZONTAL_PADDING,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  imageWrap: {
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  conditionText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 9,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  info: {
    padding: 10,
  },
  productTitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurface,
    lineHeight: 18,
  },
  price: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    lineHeight: 20,
    marginTop: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  location: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant + '99',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '33',
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  sellerName: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  emptyWrap: {
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: colors.onSurface,
  },
  emptyDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});
