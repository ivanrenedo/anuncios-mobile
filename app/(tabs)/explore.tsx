import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Switch,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  X,
  User,
  Sparkles,
  Tag,
  Truck,
  Navigation,
  Check,
  Smartphone,
  Shirt,
  Car,
  Home as HomeIcon,
  Wrench,
  LayoutGrid,
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';
import ProductCard from '@/components/ProductCard';
import SwipeableSheet from '@/components/SwipeableSheet';
import { useProducts } from '@/hooks/useProducts';
import { useCategoryTree } from '@/hooks/useCategories';
import { API_URL } from '@/lib/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POPULAR = ['iPhone 15 Pro', 'Toyota Hilux', 'Relojes Lujo', 'MacBook M2', 'PS5'];

function toExploreItem(p: any) {
  const img = p.images?.[0]?.url || '';
  return {
    id: p.id,
    title: p.title,
    price: `${Number(p.price).toLocaleString('es')} XAF`,
    location: p.city || '',
    seller: p.seller?.name || '',
    verified: p.seller?.verified ?? false,
    image: img.startsWith('/') ? `${API_URL}${img}` : img,
    avatar: p.seller?.avatarUrl || '',
    category: p.category?.label || '',
    categoryId: p.category?.id || '',
    priceNum: Number(p.price),
    createdAt: p.createdAt,
  };
}

const LOCATIONS = ['Todas las ciudades', 'Malabo', 'Bata', 'Ebebiyin', 'Mongomo', 'Luba'];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price_low', label: 'Precio: Bajo a Alto' },
  { value: 'price_high', label: 'Precio: Alto a Bajo' },
  { value: 'newest', label: 'Más recientes' },
];

// Per-category filter capabilities (the drawer adapts to the active category).
type CatFilter = { icon: any; brandModel?: boolean; conditions?: string[] };
// Keyed by the real top-level category labels seeded in the catalog.
const CATEGORY_FILTERS: Record<string, CatFilter> = {
  Todos: { icon: LayoutGrid },
  Moda: { icon: Shirt, conditions: ['Nuevo', 'Como nuevo', 'Buen estado'] },
  Tech: {
    icon: Smartphone,
    brandModel: true,
    conditions: ['Nuevo', 'Reacondicionado', 'Buen estado', 'Para piezas'],
  },
  Coches: {
    icon: Car,
    brandModel: true,
    conditions: ['Nuevo', 'Buen estado', 'Para piezas'],
  },
  Hogar: { icon: HomeIcon, conditions: ['Nuevo', 'Buen estado'] },
  Servicios: { icon: Wrench },
};

const BRANDS: Record<string, string[]> = {
  Tech: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Sony', 'Google', 'LG'],
  Coches: ['Toyota', 'Mercedes', 'BMW', 'Hyundai', 'Kia', 'Ford', 'Nissan'],
};


export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { q, filterCat } = useLocalSearchParams<{ q?: string; filterCat?: string }>();
  const { products: apiProducts } = useProducts(50);
  const { tree } = useCategoryTree();
  const PRODUCTS = apiProducts.map(toExploreItem);
  const categoryNames = ['Todos', ...tree.map((t: any) => t.label)];
  const [query, setQuery] = useState('');
  const [related, setRelated] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortIndex, setSortIndex] = useState(0);
  const [locationIndex, setLocationIndex] = useState(0);
  // Filter drawer state
  const [saveSearch, setSaveSearch] = useState(false);
  const [delivery, setDelivery] = useState(true);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [activeConditions, setActiveConditions] = useState<string[]>([]);
  const [sellerType, setSellerType] = useState<'particulares' | 'profesionales' | null>(null);
  const [withPriceOnly, setWithPriceOnly] = useState(false);
  const [brand, setBrand] = useState<string | null>(null);
  const [picker, setPicker] = useState<null | 'location' | 'brand'>(null);

  // Sync incoming ?q= (e.g. coming from the categories modal) into the search.
  // Subcategory → its related terms; whole category → its subcategories.
  useEffect(() => {
    const incoming = typeof q === 'string' ? q : '';
    if (!incoming) return;
    setQuery(incoming);

    // Related terms from the category tree: a parent → its children; a child →
    // its own children, else its siblings.
    const lower = incoming.toLowerCase();
    let rel: string[] = [];
    for (const parent of tree) {
      if (parent.label.toLowerCase() === lower) {
        rel = (parent.children ?? []).map((c: any) => c.label);
        break;
      }
      const child = (parent.children ?? []).find(
        (c: any) => c.label.toLowerCase() === lower
      );
      if (child) {
        rel = (child.children ?? []).length
          ? child.children.map((c: any) => c.label)
          : (parent.children ?? [])
              .map((c: any) => c.label)
              .filter((l: string) => l.toLowerCase() !== lower);
        break;
      }
    }
    setRelated(rel);
  }, [q, tree]);

  // Sync incoming ?filterCat= (coming from home or categories page)
  useEffect(() => {
    const incoming = typeof filterCat === 'string' ? filterCat : '';
    if (!incoming) return;
    setActiveCategory(incoming);
    setBrand(null);
    setActiveConditions([]);
  }, [filterCat]);

  const drawerAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openFilter = () => {
    setFilterOpen(true);
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeFilter = () => {
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: SCREEN_WIDTH, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setFilterOpen(false));
  };

  // Close filter drawer on hardware back press
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (filterOpen) {
          closeFilter();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [filterOpen])
  );

  const toggleLike = (id: string) => setLiked((p) => ({ ...p, [id]: !p[id] }));

  const clearSearch = () => {
    setQuery('');
    setRelated([]);
  };

  const applySuggestion = (term: string) => setQuery(term);

  const q2 = query.trim().toLowerCase();
  let visibleProducts = q2
    ? PRODUCTS.filter(
        (p: any) =>
          p.title.toLowerCase().includes(q2) ||
          p.seller.toLowerCase().includes(q2)
      )
    : PRODUCTS;
  if (activeCategory !== 'Todos') {
    const root = tree.find((t: any) => t.label === activeCategory);
    if (root) {
      const ids = new Set<string>([
        root.id,
        ...(root.children ?? []).map((c: any) => c.id),
      ]);
      visibleProducts = visibleProducts.filter((p: any) => ids.has(p.categoryId));
    } else {
      visibleProducts = visibleProducts.filter((p: any) => p.category === activeCategory);
    }
  }
  if (sellerType === 'profesionales')
    visibleProducts = visibleProducts.filter((p: any) => p.verified);
  else if (sellerType === 'particulares')
    visibleProducts = visibleProducts.filter((p: any) => !p.verified);
  if (locationIndex !== 0)
    visibleProducts = visibleProducts.filter((p: any) => p.location === LOCATIONS[locationIndex]);

  const minN = priceMin ? parseInt(priceMin, 10) : null;
  const maxN = priceMax ? parseInt(priceMax, 10) : null;
  if (minN != null)
    visibleProducts = visibleProducts.filter((p: any) => p.priceNum >= minN);
  if (maxN != null)
    visibleProducts = visibleProducts.filter((p: any) => p.priceNum <= maxN);

  if (sortIndex === 1) visibleProducts = [...visibleProducts].sort((a: any, b: any) => a.priceNum - b.priceNum);
  else if (sortIndex === 2) visibleProducts = [...visibleProducts].sort((a: any, b: any) => b.priceNum - a.priceNum);
  else if (sortIndex === 3) visibleProducts = [...visibleProducts].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pairs: any[][] = [];
  for (let i = 0; i < visibleProducts.length; i += 2)
    pairs.push(visibleProducts.slice(i, i + 2));

  const catFilter = CATEGORY_FILTERS[activeCategory] ?? CATEGORY_FILTERS.Todos;
  const CatIcon = catFilter.icon;

  const toggleCondition = (c: string) =>
    setActiveConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  // Count active filters for the badge
  const filterCount =
    (activeCategory !== 'Todos' ? 1 : 0) +
    (locationIndex !== 0 ? 1 : 0) +
    (priceMin !== '' || priceMax !== '' ? 1 : 0) +
    (activeConditions.length > 0 ? 1 : 0) +
    (sellerType !== null ? 1 : 0) +
    (brand !== null ? 1 : 0) +
    (withPriceOnly ? 1 : 0);

  const clearFilters = () => {
    // Reset every filter back to its default.
    setQuery('');
    setRelated([]);
    setActiveCategory('Todos');
    setActiveConditions([]);
    setLocationIndex(0);
    setSellerType(null);
    setPriceMin('');
    setPriceMax('');
    setBrand(null);
    setDelivery(true);
    setWithPriceOnly(false);
    setSaveSearch(false);
  };

  const pickerOptions =
    picker === 'location'
      ? LOCATIONS
      : picker === 'brand'
      ? BRANDS[activeCategory] ?? []
      : [];
  const pickerValue =
    picker === 'location'
      ? LOCATIONS[locationIndex]
      : brand ?? '';
  const onPickerSelect = (opt: string) => {
    if (picker === 'location') {
      setLocationIndex(LOCATIONS.indexOf(opt));
    } else if (picker === 'brand') {
      setBrand(opt);
    }
    setPicker(null);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 100 + insets.top }]}>
        {/* Row 1: back + search + filter */}
        <View style={styles.searchRow}>
          <RipplePress onPress={() => router.back()} style={styles.backBtn} borderRadius={18} rippleColor={colors.primary + '22'}>
            <ChevronLeft size={22} color={colors.primary} strokeWidth={2} />
          </RipplePress>
          <View style={styles.searchBox}>
            <Search size={16} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar en Market EG"
              placeholderTextColor={colors.onSurfaceVariant + '99'}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <RipplePress onPress={clearSearch} borderRadius={10} rippleColor={colors.primary + '18'}>
                <X size={14} color={colors.onSurfaceVariant} strokeWidth={2} />
              </RipplePress>
            )}
          </View>
          <RipplePress
            onPress={openFilter}
            style={[styles.filterBtn, filterCount > 0 && { backgroundColor: colors.primary }]}
            borderRadius={12}
            rippleColor={filterCount > 0 ? 'rgba(255,255,255,0.25)' : colors.primary + '22'}>
            <SlidersHorizontal size={18} color={filterCount > 0 ? '#ffffff' : colors.primary} strokeWidth={1.5} />
            {filterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            )}
          </RipplePress>
        </View>
        {/* Row 2: sort */}
        <View style={styles.sortRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
            {SORT_OPTIONS.map((opt, i) => (
              <RipplePress
                key={opt.value}
                style={[styles.sortChip, sortIndex === i && styles.sortChipActive]}
                onPress={() => setSortIndex(i)}
                borderRadius={20}
                rippleColor={colors.primary + '18'}>
                <Text style={[styles.sortChipText, sortIndex === i && styles.sortChipTextActive]}>
                  {opt.label}
                </Text>
                {sortIndex === i && <ChevronDown size={12} color={colors.primary} strokeWidth={2} />}
              </RipplePress>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 100 + insets.top, paddingBottom: 32 }}>
        {/* Category pills */}
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
            {categoryNames.map((cat) => (
              <RipplePress
                key={cat}
                style={[styles.pill, activeCategory === cat && styles.pillActive]}
                onPress={() => setActiveCategory(cat)}
                borderRadius={999}
                rippleColor={activeCategory === cat ? 'rgba(255,255,255,0.2)' : colors.primary + '18'}>
                <Text style={[styles.pillText, activeCategory === cat && styles.pillTextActive]}>
                  {cat}
                </Text>
              </RipplePress>
            ))}
          </ScrollView>
        </View>

        {/* Related suggestions (coming from a subcategory) */}
        {related.length > 0 && (
          <View style={[styles.section, { paddingBottom: 0 }]}>
            <View style={styles.sectionTitleRow}>
              <Sparkles size={15} color={colors.primary} strokeWidth={1.8} />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                Búsquedas relacionadas
              </Text>
            </View>
            <View style={styles.trendingWrap}>
              {related.map((term) => (
                <RipplePress
                  key={term}
                  style={[styles.trendingChip, styles.relatedChip]}
                  onPress={() => applySuggestion(term)}
                  borderRadius={8}
                  rippleColor={colors.primary + '18'}>
                  <Search size={12} color={colors.primary} strokeWidth={1.8} />
                  <Text style={[styles.trendingText, { color: colors.primary }]}>
                    {term}
                  </Text>
                </RipplePress>
              ))}
            </View>
          </View>
        )}

        {/* Popular searches (only when nothing searched) */}
        {query.length === 0 && related.length === 0 && (
          <View style={[styles.section, { paddingBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Búsquedas populares</Text>
            <View style={styles.trendingWrap}>
              {POPULAR.map((term) => (
                <RipplePress
                  key={term}
                  style={styles.trendingChip}
                  onPress={() => setQuery(term)}
                  borderRadius={8}
                  rippleColor={colors.secondary + '18'}>
                  <TrendingUp size={13} color={colors.secondary} strokeWidth={1.5} />
                  <Text style={styles.trendingText}>{term}</Text>
                </RipplePress>
              ))}
            </View>
          </View>
        )}

        {/* Results header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {query.trim()
              ? `${visibleProducts.length} resultados para "${query.trim()}"`
              : `${visibleProducts.length} resultados`}
          </Text>
        </View>

        {/* Product grid */}
        {visibleProducts.length > 0 ? (
          <View style={styles.grid}>
            {pairs.map((pair, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
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
                {pair.length === 1 && <View style={styles.cardPlaceholder} />}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Search size={32} color={colors.primary + '88'} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados para "{query.trim()}"</Text>
            <Text style={styles.emptyDesc}>
              {related.length > 0
                ? 'Prueba una de las búsquedas relacionadas de arriba.'
                : 'Prueba con otras palabras o revisa la ortografía.'}
            </Text>
          </View>
        )}

        {/* Load more */}
        <View style={styles.loadMoreWrap}>
          <RipplePress style={styles.loadMoreBtn} borderRadius={12} rippleColor={colors.primary + '18'}>
            <Text style={styles.loadMoreText}>Cargar más</Text>
          </RipplePress>
        </View>
      </ScrollView>

      {/* Filter drawer */}
      {filterOpen && (
        <>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropAnim }]}
            pointerEvents="auto">
            <Pressable style={StyleSheet.absoluteFillObject} onPress={closeFilter} />
          </Animated.View>

          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
            {/* Header */}
            <View style={[styles.fdHeader, { paddingTop: insets.top + 12 }]}>
              <Text style={styles.fdTitle}>Filtrar tu búsqueda</Text>
              <RipplePress style={styles.fdClose} onPress={closeFilter} borderRadius={20} rippleColor={colors.primary + '15'}>
                <X size={22} color={colors.onSurface} strokeWidth={2} />
              </RipplePress>
            </View>

            {/* Save / clear row */}
            <View style={styles.fdSaveRow}>
              <Text style={styles.fdSaveLabel}>Guardar búsqueda</Text>
              <Switch
                value={saveSearch}
                onValueChange={setSaveSearch}
                trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
                thumbColor="#ffffff"
              />
              <View style={{ flex: 1 }} />
              <RipplePress onPress={clearFilters} borderRadius={8} rippleColor={colors.primary + '12'}>
                <Text style={styles.fdClearText}>Borrar</Text>
              </RipplePress>
            </View>

            <ScrollView
              style={styles.drawerBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled">
              {/* Search */}
              <View style={styles.fdSearch}>
                <Search size={18} color={colors.onSurfaceVariant + '99'} strokeWidth={1.8} />
                <TextInput
                  style={styles.fdSearchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="¿Qué buscas?"
                  placeholderTextColor={colors.onSurfaceVariant + '88'}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <RipplePress onPress={clearSearch} borderRadius={10} rippleColor={colors.primary + '18'}>
                    <X size={16} color={colors.onSurfaceVariant} strokeWidth={2} />
                  </RipplePress>
                )}
              </View>

              {/* Categoría */}
              <Text style={styles.fdLabel}>Categoría</Text>
              <RipplePress
                style={styles.fdSelector}
                borderRadius={14}
                rippleColor={colors.primary + '10'}
                onPress={() => {
                  closeFilter();
                  setTimeout(() => {
                    router.push('/(tabs)/categories');
                  }, 280);
                }}>
                <View style={[styles.fdSelectorIcon, { backgroundColor: colors.primary + '15' }]}>
                  <CatIcon size={20} color={colors.primary} strokeWidth={1.8} />
                </View>
                <Text style={styles.fdSelectorValue}>{activeCategory}</Text>
                <ChevronRight size={20} color={colors.onSurfaceVariant} strokeWidth={2} />
              </RipplePress>

              {/* Ciudad - Sector */}
              <Text style={styles.fdLabel}>Ciudad - Sector</Text>
              <RipplePress style={styles.fdSelector} borderRadius={14} rippleColor={colors.primary + '10'} onPress={() => setPicker('location')}>
                <View style={[styles.fdSelectorIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <Navigation size={18} color={colors.onSurface} strokeWidth={1.8} />
                </View>
                <Text style={styles.fdSelectorValue}>{LOCATIONS[locationIndex]}</Text>
                <ChevronRight size={20} color={colors.onSurfaceVariant} strokeWidth={2} />
              </RipplePress>

              {/* Delivery */}
              <View style={styles.fdToggleRow}>
                <View style={styles.fdToggleIconDark}>
                  <Truck size={18} color="#ffffff" strokeWidth={1.8} />
                </View>
                <Text style={styles.fdToggleLabel}>Envío a toda Guinea Ecuatorial</Text>
                <Switch
                  value={delivery}
                  onValueChange={setDelivery}
                  trackColor={{ false: colors.surfaceContainerHigh, true: colors.secondary }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Precio */}
              <Text style={styles.fdLabel}>Precio</Text>
              <View style={styles.fdPriceRow}>
                <View style={styles.fdPriceField}>
                  <TextInput
                    style={styles.fdPriceInput}
                    value={priceMin}
                    onChangeText={(v) => setPriceMin(v.replace(/[^\d]/g, ''))}
                    placeholder="Mín"
                    placeholderTextColor={colors.onSurfaceVariant + '88'}
                    keyboardType="numeric"
                  />
                  <Text style={styles.fdPriceSuffix}>XAF</Text>
                </View>
                <View style={styles.fdPriceField}>
                  <TextInput
                    style={styles.fdPriceInput}
                    value={priceMax}
                    onChangeText={(v) => setPriceMax(v.replace(/[^\d]/g, ''))}
                    placeholder="Máx"
                    placeholderTextColor={colors.onSurfaceVariant + '88'}
                    keyboardType="numeric"
                  />
                  <Text style={styles.fdPriceSuffix}>XAF</Text>
                </View>
              </View>

              {/* Marca - Modelo (category-adaptive) */}
              {catFilter.brandModel && (
                <>
                  <Text style={styles.fdLabel}>Marca - Modelo</Text>
                  <RipplePress style={styles.fdSelector} borderRadius={14} rippleColor={colors.primary + '10'} onPress={() => setPicker('brand')}>
                    <View style={[styles.fdSelectorIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
                      <Tag size={18} color={colors.onSurface} strokeWidth={1.8} />
                    </View>
                    <Text style={[styles.fdSelectorValue, !brand && { color: colors.onSurfaceVariant }]}>
                      {brand ?? 'Elegir marca - modelo'}
                    </Text>
                    <ChevronRight size={20} color={colors.onSurfaceVariant} strokeWidth={2} />
                  </RipplePress>
                </>
              )}

              {/* Estado (category-adaptive) */}
              {catFilter.conditions && (
                <>
                  <Text style={styles.fdLabel}>Estado</Text>
                  <View style={styles.fdChipsWrap}>
                    {catFilter.conditions.map((cond) => {
                      const active = activeConditions.includes(cond);
                      return (
                        <RipplePress
                          key={cond}
                          style={[styles.fdChip, active && styles.fdChipActive]}
                          onPress={() => toggleCondition(cond)}
                          borderRadius={999}
                          rippleColor={colors.primary + '18'}>
                          <Text style={[styles.fdChipText, active && styles.fdChipTextActive]}>{cond}</Text>
                        </RipplePress>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Tipo de vendedores */}
              <Text style={styles.fdLabel}>Tipo de vendedores</Text>
              <View style={styles.fdChipsWrap}>
                {(['particulares', 'profesionales'] as const).map((t) => {
                  const active = sellerType === t;
                  return (
                    <RipplePress
                      key={t}
                      style={[styles.fdChip, active && styles.fdChipActive]}
                      onPress={() => setSellerType(active ? null : t)}
                      borderRadius={999}
                      rippleColor={colors.primary + '18'}>
                      <Text style={[styles.fdChipText, active && styles.fdChipTextActive]}>
                        {t === 'particulares' ? 'Particulares' : 'Profesionales'}
                      </Text>
                    </RipplePress>
                  );
                })}
              </View>

              {/* With price only */}
              <View style={[styles.fdToggleRow, { marginTop: 18 }]}>
                <View style={styles.fdToggleIconDark}>
                  <Tag size={16} color="#ffffff" strokeWidth={1.8} />
                </View>
                <Text style={styles.fdToggleLabel}>Anuncios con precio únicamente</Text>
                <Switch
                  value={withPriceOnly}
                  onValueChange={setWithPriceOnly}
                  trackColor={{ false: colors.surfaceContainerHigh, true: colors.secondary }}
                  thumbColor="#ffffff"
                />
              </View>
            </ScrollView>

            {/* Footer: result count */}
            <View style={[styles.fdFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <RipplePress style={styles.fdApplyBtn} onPress={closeFilter} borderRadius={14} rippleColor="rgba(255,255,255,0.2)">
                <Text style={styles.fdApplyText}>({visibleProducts.length}) anuncios</Text>
              </RipplePress>
            </View>
          </Animated.View>

          {/* Option picker sheet (location / brand) */}
          <SwipeableSheet
            visible={picker !== null}
            onClose={() => setPicker(null)}
            title={
              picker === 'location'
                ? 'Elegir ciudad - sector'
                : 'Elegir marca'
            }>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {pickerOptions.length === 0 ? (
                <Text style={styles.fdSheetEmpty}>No hay opciones para esta categoría.</Text>
              ) : (
                pickerOptions.map((opt) => {
                  const active = pickerValue === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={styles.fdSheetOption}
                      activeOpacity={0.7}
                      onPress={() => onPickerSelect(opt)}>
                      <Text style={[styles.fdSheetOptionText, active && styles.fdSheetOptionActive]}>
                        {opt}
                      </Text>
                      {active && <Check size={18} color={colors.primary} strokeWidth={2.2} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </SwipeableSheet>
        </>
      )}
    </View>
  );
}

const DRAWER_WIDTH = SCREEN_WIDTH;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  // ── Filter drawer (redesigned) ──────────────────────────────
  fdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
  },
  fdTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 20,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  fdClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
  },
  fdSaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
  },
  fdSaveLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurface,
  },
  fdClearText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    paddingHorizontal: 4,
  },
  fdSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 999,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    marginBottom: 22,
  },
  fdSearchInput: {
    flex: 1,
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
    padding: 0,
    height: '100%',
  },
  fdLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginBottom: 8,
  },
  fdSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    marginBottom: 18,
  },
  fdSelectorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fdSelectorValue: {
    flex: 1,
    fontFamily: 'Manrope-SemiBold',
    fontSize: 16,
    color: colors.onSurface,
  },
  fdToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  fdToggleIconDark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onSurface,
  },
  fdToggleLabel: {
    flex: 1,
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurface,
  },
  fdPriceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  fdPriceField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  fdPriceInput: {
    flex: 1,
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: colors.onSurface,
    padding: 0,
    height: '100%',
  },
  fdPriceSuffix: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: colors.outlineVariant + '66',
  },
  fdChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  fdChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '80',
    backgroundColor: colors.surface,
  },
  fdChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '14',
  },
  fdChipText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  fdChipTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: colors.primary,
  },
  fdFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '4d',
    backgroundColor: colors.surface,
  },
  fdApplyBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  fdApplyText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  fdSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '33',
  },
  fdSheetOptionText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
  },
  fdSheetOptionActive: {
    fontFamily: 'Manrope-SemiBold',
    color: colors.primary,
  },
  fdSheetEmpty: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 24,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: colors.surface + 'e6',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  searchBox: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
    height: '100%',
    padding: 0,
  },
  filterBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
  },
  filterBadge: {
    position: 'absolute' as const,
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  filterBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#ffffff',
    lineHeight: 13,
  },
  sortRow: {
    paddingHorizontal: 12,
  },
  sortScroll: {
    flexGrow: 0,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  sortChipActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary + '55',
  },
  sortChipText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  sortChipTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: colors.primary,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pillScroll: {
    flexGrow: 0,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  pillTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: '#ffffff',
  },
  sectionTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 17,
    color: colors.onSurface,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  trendingWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  relatedChip: {
    backgroundColor: colors.primary + '0f',
    borderColor: colors.primary + '44',
  },
  trendingText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.secondary,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsCount: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '0f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 16,
    color: colors.onSurface,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  grid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardPlaceholder: {
    flex: 1,
  },
  loadMoreWrap: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  loadMoreBtn: {
    borderWidth: 1,
    borderColor: colors.outlineVariant + '4d',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
  },
  loadMoreText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.primary,
  },
  // Filter drawer
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25,27,31,0.5)',
    zIndex: 60,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.surface,
    zIndex: 61,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  drawerBody: {
    flex: 1,
  },
});
