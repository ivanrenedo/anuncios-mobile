import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Animated,
  Switch,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
  Tag,
  Navigation,
  Building2,
  Briefcase,
  Minus,
  Check,
  Smartphone,
  Shirt,
  Car,
  Home as HomeIcon,
  Wrench,
  LayoutGrid,
  Plus,
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';
import ProductCard, { ProductCardSkeleton, fmtPrice } from '@/components/ProductCard';
import SwipeableSheet from '@/components/SwipeableSheet';
import Spinner from '@/components/Spinner';
import { useCategoryTree } from '@/hooks/useCategories';
import { useFavoriteToggle } from '@/hooks/useFavorites';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { GET_FILTERABLE_SECTIONS, GET_SECTION_PRODUCTS, SEARCH_PRODUCTS } from '@/graphql/queries';
import { API_URL } from '@/lib/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

function toExploreItem(p: any) {
  const img = p.images?.[0]?.url || '';
  return {
    id: p.id,
    title: p.title,
    description: p.description || '',
    price: fmtPrice(Number(p.price)),
    priceRaw: Number(p.price),
    location: p.city || '',
    seller: p.seller?.name || '',
    sellerId: p.seller?.id,
    verified: p.seller?.verified ?? false,
    image: img.startsWith('/') ? `${API_URL}${img}` : img,
    avatar: p.seller?.avatarUrl || '',
    category: p.category?.label || '',
    categoryId: p.category?.id || '',
    categoryLabel: p.category?.label || '',
    priceNum: Number(p.price),
    createdAt: p.createdAt,
    discount: p.discount,
    operation: p.propertyDetail?.operation,
    offerType: p.serviceDetail?.offerType,
    postedAgo: timeAgo(p.createdAt),
  };
}

type CatFilter = {
  icon: any;
  label?: string;
  color?: string;
  brandModel?: boolean;
  conditions?: string[];
  operations?: string[];
  engines?: string[];
  transmissions?: string[];
  offerTypes?: string[];
  bedrooms?: boolean;
  bathrooms?: boolean;
  surface?: boolean;
};

const CATEGORY_FILTERS: Record<string, CatFilter> = {
  todos: { icon: LayoutGrid },
  moda: { icon: Shirt, conditions: ['Nuevo', 'Como nuevo', 'Buen estado'] },
  tech: { icon: Smartphone, brandModel: true, conditions: ['Nuevo', 'Reacondicionado', 'Buen estado', 'Para piezas'] },
  'electrónica': { icon: Smartphone, brandModel: true, conditions: ['Nuevo', 'Reacondicionado', 'Buen estado', 'Para piezas'] },
  hogar: { icon: HomeIcon, conditions: ['Nuevo', 'Buen estado'] },
  'vehículos': {
    icon: Car,
    label: 'Vehículos',
    color: '#8c5000',
    brandModel: true,
    conditions: ['Nuevo', 'Buen estado', 'Para piezas'],
    operations: ['Venta', 'Alquiler'],
    engines: ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'GLP'],
    transmissions: ['Manual', 'Automático'],
  },
  inmobiliaria: {
    icon: Building2,
    label: 'Inmobiliaria',
    color: '#5F5E5A',
    conditions: ['Obra nueva', 'Buen estado', 'A reformar'],
    operations: ['Venta', 'Alquiler'],
    bedrooms: true,
    bathrooms: true,
    surface: true,
  },
  servicios: {
    icon: Wrench,
    label: 'Servicios',
    color: '#006b5e',
    offerTypes: ['Oferta', 'Demanda'],
  },
  empleo: {
    icon: Briefcase,
    label: 'Empleo',
    color: '#ba1a1a',
  },
};

const BRANDS: Record<string, string[]> = {
  tech: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Sony', 'Google', 'LG'],
  'electrónica': ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Sony', 'Google', 'LG'],
};



export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { q, filterCat, sectionId: paramSectionId } = useLocalSearchParams<{
    q?: string;
    filterCat?: string;
    sectionId?: string;
  }>();
  const PAGE_SIZE = 8;
  const [hasMore, setHasMore] = useState(true);
  const { tree } = useCategoryTree();
  const categoryNames = ['Todos', ...tree.map((t: any) => t.label)];
  const [query, setQuery] = useState('');
  const [related, setRelated] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const { isFavorite, toggleFavorite } = useFavoriteToggle();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const { data: sectionsData } = useQuery(GET_FILTERABLE_SECTIONS, { fetchPolicy: 'cache-and-network' });
  const filterableSections: { id: string; title: string; icon?: string; filter: any }[] =
    (sectionsData as any)?.filterableSections ?? [];

  const { data: sectionProductsData, loading: sectionProductsLoading } = useQuery(
    GET_SECTION_PRODUCTS,
    {
      variables: { sectionId: activeSectionId!, take: 50 },
      skip: !activeSectionId,
    },
  );
  const sectionProducts = activeSectionId
    ? ((sectionProductsData as any)?.sectionProducts ?? []).map(toExploreItem)
    : null;
  type SortOrder = 'price_asc' | 'price_desc' | 'az' | 'za' | null;
  const SORT_LABELS: Record<Exclude<SortOrder, null>, string> = {
    price_asc: 'Menor precio',
    price_desc: 'Mayor precio',
    az: 'A - Z',
    za: 'Z - A',
  };
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  // Filter drawer state
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [activeConditions, setActiveConditions] = useState<string[]>([]);
  const [sellerType, setSellerType] = useState<'particulares' | 'profesionales' | null>(null);
  const [withPriceOnly, setWithPriceOnly] = useState(false);
  const [brand, setBrand] = useState<string | null>(null);
  const [picker, setPicker] = useState<null | 'brand'>(null);
  const [brandModelQuery, setBrandModelQuery] = useState('');
  const [activeEngines, setActiveEngines] = useState<string[]>([]);
  const [activeTransmissions, setActiveTransmissions] = useState<string[]>([]);
  const [operation, setOperation] = useState<string | null>(null);
  const [filterBedrooms, setFilterBedrooms] = useState(0);
  const [filterBathrooms, setFilterBathrooms] = useState(0);
  const [surfaceMin, setSurfaceMin] = useState('');
  const [filterOfferType, setFilterOfferType] = useState<string | null>(null);

  // Resolve category → categoryId for the server query
  const activeCategoryId = activeCategory !== 'Todos'
    ? tree.find((t: any) => t.label === activeCategory)?.id ?? undefined
    : undefined;

  // Build server search input from filter state
  const searchInput = {
    query: query.trim() || undefined,
    categoryId: activeCategoryId,
    city: cityFilter.trim() || undefined,
    condition: activeConditions.length === 1 ? activeConditions[0] : undefined,
    priceMin: priceMin ? parseInt(priceMin, 10) : undefined,
    priceMax: priceMax ? parseInt(priceMax, 10) : undefined,
    sortBy: sortOrder === 'price_asc' || sortOrder === 'price_desc' ? sortOrder : 'recent',
    take: PAGE_SIZE,
    skip: 0,
  };

  const { data: searchData, loading: productsLoading, refetch: refetchProducts } = useQuery<any>(
    SEARCH_PRODUCTS,
    { variables: { input: searchInput }, fetchPolicy: 'cache-and-network', notifyOnNetworkStatusChange: true },
  );

  const [fetchMore] = useLazyQuery<any>(SEARCH_PRODUCTS, {
    fetchPolicy: 'network-only',
  });

  // First page derived synchronously — no useEffect delay
  const firstPage = (searchData?.searchProducts ?? []).map(toExploreItem);

  // Extra pages loaded via "Cargar más"
  const [extraPages, setExtraPages] = useState<any[]>([]);

  // Reset extras when the base query changes (filters, search, sort)
  useEffect(() => {
    setExtraPages([]);
    setHasMore(firstPage.length >= PAGE_SIZE);
    setLoadingMore(false);
  }, [searchData]);

  const searchResults = [...firstPage, ...extraPages];

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { data } = await fetchMore({
        variables: { input: { ...searchInput, skip: searchResults.length } },
      });
      const next = (data?.searchProducts ?? []).map(toExploreItem);
      setExtraPages((prev) => [...prev, ...next]);
      setHasMore(next.length >= PAGE_SIZE);
    } catch {}
    setLoadingMore(false);
  };

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

  // Sync incoming ?sectionId= (coming from home "Ver todo")
  useEffect(() => {
    const incoming = typeof paramSectionId === 'string' ? paramSectionId : '';
    if (incoming) setActiveSectionId(incoming);
  }, [paramSectionId]);

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

  const clearSearch = () => {
    setQuery('');
    setRelated([]);
  };

  const applySuggestion = (term: string) => setQuery(term);

  // Server handles: query, categoryId, city, condition, price, sortBy.
  // Post-filters for what the backend doesn't support yet:
  let visibleProducts = sectionProducts ? sectionProducts : searchResults;

  if (sellerType === 'profesionales')
    visibleProducts = visibleProducts.filter((p: any) => p.verified);
  else if (sellerType === 'particulares')
    visibleProducts = visibleProducts.filter((p: any) => !p.verified);
  if (withPriceOnly)
    visibleProducts = visibleProducts.filter((p: any) => p.priceNum > 0);
  if (activeConditions.length > 1)
    visibleProducts = visibleProducts.filter((p: any) =>
      activeConditions.includes(p.condition ?? ''));
  if (brandModelQuery.trim())
    visibleProducts = visibleProducts.filter((p: any) =>
      p.title.toLowerCase().includes(brandModelQuery.trim().toLowerCase()));

  if (sortOrder === 'az')
    visibleProducts = [...visibleProducts].sort((a: any, b: any) => a.title.localeCompare(b.title));
  else if (sortOrder === 'za')
    visibleProducts = [...visibleProducts].sort((a: any, b: any) => b.title.localeCompare(a.title));

  const pairs: any[][] = [];
  for (let i = 0; i < visibleProducts.length; i += 2)
    pairs.push(visibleProducts.slice(i, i + 2));

  const catFilter = CATEGORY_FILTERS[activeCategory.toLowerCase()] ?? CATEGORY_FILTERS.todos;
  const CatIcon = catFilter.icon;

  const toggleCondition = (c: string) =>
    setActiveConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const toggleEngine = (e: string) =>
    setActiveEngines((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );

  const toggleTransmission = (t: string) =>
    setActiveTransmissions((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  // Count active filters for the badge
  const filterCount =
    (activeCategory !== 'Todos' ? 1 : 0) +
    (cityFilter.trim() ? 1 : 0) +
    (priceMin !== '' || priceMax !== '' ? 1 : 0) +
    (activeConditions.length > 0 ? 1 : 0) +
    (sellerType !== null ? 1 : 0) +
    (brand !== null ? 1 : 0) +
    (brandModelQuery.trim() ? 1 : 0) +
    (withPriceOnly ? 1 : 0) +
    (activeEngines.length > 0 ? 1 : 0) +
    (activeTransmissions.length > 0 ? 1 : 0) +
    (operation !== null ? 1 : 0) +
    (filterBedrooms > 0 ? 1 : 0) +
    (filterBathrooms > 0 ? 1 : 0) +
    (surfaceMin !== '' ? 1 : 0) +
    (filterOfferType !== null ? 1 : 0);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refetchProducts(); } catch {}
    setRefreshing(false);
  };

  const clearFilters = () => {
    setQuery('');
    setRelated([]);
    setActiveCategory('Todos');
    setActiveConditions([]);
    setCityFilter('');
    setSellerType(null);
    setPriceMin('');
    setPriceMax('');
    setBrand(null);
    setBrandModelQuery('');
    setWithPriceOnly(false);
    setActiveSectionId(null);
    setSortOrder(null);
    setActiveEngines([]);
    setActiveTransmissions([]);
    setOperation(null);
    setFilterBedrooms(0);
    setFilterBathrooms(0);
    setSurfaceMin('');
    setFilterOfferType(null);
  };

  const pickerOptions =
    picker === 'brand'
      ? BRANDS[activeCategory.toLowerCase()] ?? []
      : [];
  const pickerValue = brand ?? '';
  const onPickerSelect = (opt: string) => {
    if (picker === 'brand') {
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
          <RipplePress onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn} borderRadius={18} rippleColor={colors.primary + '22'}>
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
        {/* Row 2: section/sort selector */}
        <View style={styles.sortRow}>
          <RipplePress
            style={styles.sectionSelect}
            onPress={() => setSectionPickerOpen(true)}
            borderRadius={12}
            rippleColor={colors.primary + '18'}>
            <Text style={styles.sectionSelectText} numberOfLines={1}>
              {activeSectionId
                ? filterableSections.find((s) => s.id === activeSectionId)?.title ?? 'Filtro'
                : 'Filtros'}
            </Text>
            <ChevronDown size={16} color={colors.primary} strokeWidth={2} />
          </RipplePress>
          {(activeSectionId) && (
            <RipplePress
              style={styles.sectionClear}
              onPress={() => { setActiveSectionId(null) }}
              borderRadius={8}
              rippleColor={colors.primary + '18'}>
              <X size={14} color={colors.primary} strokeWidth={2} />
            </RipplePress>
          )}

          <RipplePress
            style={styles.sectionSelect}
            onPress={() => setSortPickerOpen(true)}
            borderRadius={12}
            rippleColor={colors.primary + '18'}>
            <Text style={styles.sectionSelectText} numberOfLines={1}>
              {sortOrder ? SORT_LABELS[sortOrder] : 'Ordenar'}
            </Text>
            <ChevronDown size={16} color={colors.primary} strokeWidth={2} />
          </RipplePress>
          {sortOrder && (
            <RipplePress
              style={styles.sectionClear}
              onPress={() => setSortOrder(null)}
              borderRadius={8}
              rippleColor={colors.primary + '18'}>
              <X size={14} color={colors.primary} strokeWidth={2} />
            </RipplePress>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 100 + insets.top, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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

        {/* Results header */}
        {!productsLoading && visibleProducts.length > 0 && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {query.trim()
                ? `${visibleProducts.length} resultados para "${query.trim()}"`
                : `${visibleProducts.length} resultados`}
            </Text>
          </View>
        )}

        {/* Product grid */}
        {productsLoading && visibleProducts.length === 0 || sectionProductsLoading ? (
          <View style={styles.grid}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.gridRow}>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </View>
            ))}
          </View>
        ) : visibleProducts.length > 0 ? (
          <View style={styles.grid}>
            {pairs.map((pair, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
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
                {pair.length === 1 && <View style={styles.cardPlaceholder} />}
              </View>
            ))}
          </View>
        ) : productsLoading ? (
          <View style={styles.grid}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.gridRow}>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </View>
            ))}
          </View>
        ) : searchData ? (
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
        ) : null}

        {/* Load more */}
        {(hasMore || loadingMore) && (
          <View style={styles.loadMoreWrap}>
            <RipplePress
              style={styles.loadMoreBtn}
              borderRadius={12}
              rippleColor={colors.primary + '18'}
              onPress={loadMore}>
              {loadingMore ? (
                <Spinner color={colors.primary} />
              ) : (
                <>
                  <Plus size={16} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.loadMoreText}>Cargar más</Text>
                </>
              )}
            </RipplePress>
          </View>
        )}
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

            {/* Clear row */}
            <View style={[styles.fdSaveRow, { justifyContent: 'flex-end' }]}>
              <RipplePress onPress={clearFilters} borderRadius={8} rippleColor={colors.primary + '12'}>
                <Text style={styles.fdClearText}>Borrar filtros</Text>
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

              {/* ─── Card: Qué y dónde ─── */}
              <View style={styles.fdCard}>
                <View style={styles.fdCardHeader}>
                  <Navigation size={16} color={colors.onSurfaceVariant} strokeWidth={2} />
                  <Text style={styles.fdCardTitle}>Qué y dónde</Text>
                </View>
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
                <Text style={styles.fdLabel}>Ubicación</Text>
                <View style={[styles.fdSelector, { paddingHorizontal: 12 }]}>
                  <View style={[styles.fdSelectorIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <Navigation size={18} color={colors.onSurface} strokeWidth={1.8} />
                  </View>
                  <TextInput
                    style={[styles.fdSelectorValue, { flex: 1, padding: 0 }]}
                    value={cityFilter}
                    onChangeText={setCityFilter}
                    placeholder="Ej: Malabo"
                    placeholderTextColor={colors.onSurfaceVariant + '88'}
                  />
                  {cityFilter.trim() !== '' && (
                    <TouchableOpacity onPress={() => setCityFilter('')} activeOpacity={0.7}>
                      <X size={18} color={colors.onSurfaceVariant} strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* ─── Card: Precio ─── */}
              <View style={styles.fdCard}>
                <View style={styles.fdCardHeader}>
                  <Tag size={16} color={colors.onSurfaceVariant} strokeWidth={2} />
                  <Text style={styles.fdCardTitle}>Precio</Text>
                </View>
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
                <View style={styles.fdToggleRow}>
                  <View style={styles.fdToggleIconDark}>
                    <Tag size={14} color="#ffffff" strokeWidth={1.8} />
                  </View>
                  <Text style={styles.fdToggleLabel}>Solo con precio</Text>
                  <Switch
                    value={withPriceOnly}
                    onValueChange={setWithPriceOnly}
                    trackColor={{ false: colors.surfaceContainerHigh, true: colors.secondary }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              {/* ─── Card: Category-specific ─── */}
              {catFilter.label && (
                <View style={[styles.fdCard, { borderColor: (catFilter.color ?? colors.primary) + '40' }]}>
                  <View style={styles.fdCardHeader}>
                    <CatIcon size={16} color={catFilter.color ?? colors.primary} strokeWidth={2} />
                    <Text style={[styles.fdCardTitle, { color: catFilter.color ?? colors.primary }]}>
                      {catFilter.label}
                    </Text>
                  </View>

                  {/* Operación */}
                  {catFilter.operations && (
                    <>
                      <Text style={styles.fdLabel}>Operación</Text>
                      <View style={styles.fdChipsWrap}>
                        {catFilter.operations.map((op) => {
                          const active = operation === op;
                          return (
                            <RipplePress
                              key={op}
                              style={[styles.fdChip, active && styles.fdChipActive]}
                              onPress={() => setOperation(active ? null : op)}
                              borderRadius={999}
                              rippleColor={colors.primary + '18'}>
                              <Text style={[styles.fdChipText, active && styles.fdChipTextActive]}>{op}</Text>
                            </RipplePress>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* Marca / Modelo (text input for vehicles) */}
                  {catFilter.brandModel && activeCategory.toLowerCase() === 'vehículos' && (
                    <>
                      <Text style={styles.fdLabel}>Marca / Modelo</Text>
                      <View style={[styles.fdSelector, { paddingHorizontal: 12 }]}>
                        <View style={[styles.fdSelectorIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
                          <Car size={18} color={colors.onSurface} strokeWidth={1.8} />
                        </View>
                        <TextInput
                          style={[styles.fdSelectorValue, { flex: 1, padding: 0 }]}
                          value={brandModelQuery}
                          onChangeText={setBrandModelQuery}
                          placeholder="Ej: Toyota Corolla"
                          placeholderTextColor={colors.onSurfaceVariant + '88'}
                        />
                        {brandModelQuery.trim() !== '' && (
                          <TouchableOpacity onPress={() => setBrandModelQuery('')} activeOpacity={0.7}>
                            <X size={18} color={colors.onSurfaceVariant} strokeWidth={2} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
                  )}

                  {/* Estado */}
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

                  {/* Motor */}
                  {catFilter.engines && (
                    <>
                      <Text style={styles.fdLabel}>Motor</Text>
                      <View style={styles.fdChipsWrap}>
                        {catFilter.engines.map((eng) => {
                          const active = activeEngines.includes(eng);
                          return (
                            <RipplePress
                              key={eng}
                              style={[styles.fdChip, active && styles.fdChipActive]}
                              onPress={() => toggleEngine(eng)}
                              borderRadius={999}
                              rippleColor={colors.primary + '18'}>
                              <Text style={[styles.fdChipText, active && styles.fdChipTextActive]}>{eng}</Text>
                            </RipplePress>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* Transmisión */}
                  {catFilter.transmissions && (
                    <>
                      <Text style={styles.fdLabel}>Transmisión</Text>
                      <View style={styles.fdChipsWrap}>
                        {catFilter.transmissions.map((tr) => {
                          const active = activeTransmissions.includes(tr);
                          return (
                            <RipplePress
                              key={tr}
                              style={[styles.fdChip, active && styles.fdChipActive]}
                              onPress={() => toggleTransmission(tr)}
                              borderRadius={999}
                              rippleColor={colors.primary + '18'}>
                              <Text style={[styles.fdChipText, active && styles.fdChipTextActive]}>{tr}</Text>
                            </RipplePress>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* Tipo de oferta (servicios) */}
                  {catFilter.offerTypes && (
                    <>
                      <Text style={styles.fdLabel}>Tipo de oferta</Text>
                      <View style={styles.fdChipsWrap}>
                        {catFilter.offerTypes.map((ot) => {
                          const active = filterOfferType === ot;
                          return (
                            <RipplePress
                              key={ot}
                              style={[styles.fdChip, active && styles.fdChipActive]}
                              onPress={() => setFilterOfferType(active ? null : ot)}
                              borderRadius={999}
                              rippleColor={colors.primary + '18'}>
                              <Text style={[styles.fdChipText, active && styles.fdChipTextActive]}>{ot}</Text>
                            </RipplePress>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* Habitaciones + Baños */}
                  {(catFilter.bedrooms || catFilter.bathrooms) && (
                    <View style={styles.fdStepperRow}>
                      {catFilter.bedrooms && (
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fdLabel}>Habitaciones (mín.)</Text>
                          <View style={styles.fdStepper}>
                            <RipplePress
                              style={styles.fdStepperBtn}
                              borderRadius={8}
                              rippleColor={colors.primary + '18'}
                              onPress={() => setFilterBedrooms((v) => Math.max(0, v - 1))}>
                              <Minus size={18} color={colors.onSurface} strokeWidth={2} />
                            </RipplePress>
                            <Text style={styles.fdStepperValue}>{filterBedrooms}</Text>
                            <RipplePress
                              style={styles.fdStepperBtn}
                              borderRadius={8}
                              rippleColor={colors.primary + '18'}
                              onPress={() => setFilterBedrooms((v) => v + 1)}>
                              <Plus size={18} color={colors.onSurface} strokeWidth={2} />
                            </RipplePress>
                          </View>
                        </View>
                      )}
                      {catFilter.bathrooms && (
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fdLabel}>Baños (mín.)</Text>
                          <View style={styles.fdStepper}>
                            <RipplePress
                              style={styles.fdStepperBtn}
                              borderRadius={8}
                              rippleColor={colors.primary + '18'}
                              onPress={() => setFilterBathrooms((v) => Math.max(0, v - 1))}>
                              <Minus size={18} color={colors.onSurface} strokeWidth={2} />
                            </RipplePress>
                            <Text style={styles.fdStepperValue}>{filterBathrooms}</Text>
                            <RipplePress
                              style={styles.fdStepperBtn}
                              borderRadius={8}
                              rippleColor={colors.primary + '18'}
                              onPress={() => setFilterBathrooms((v) => v + 1)}>
                              <Plus size={18} color={colors.onSurface} strokeWidth={2} />
                            </RipplePress>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Superficie */}
                  {catFilter.surface && (
                    <>
                      <Text style={styles.fdLabel}>Superficie mínima (m²)</Text>
                      <View style={[styles.fdPriceField, { marginBottom: 4 }]}>
                        <TextInput
                          style={styles.fdPriceInput}
                          value={surfaceMin}
                          onChangeText={(v) => setSurfaceMin(v.replace(/[^\d]/g, ''))}
                          placeholder="Ej: 50"
                          placeholderTextColor={colors.onSurfaceVariant + '88'}
                          keyboardType="numeric"
                        />
                        <Text style={styles.fdPriceSuffix}>m²</Text>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* ─── Card: Non-specialized categories with conditions/brand ─── */}
              {!catFilter.label && catFilter.conditions && (
                <View style={styles.fdCard}>
                  <View style={styles.fdCardHeader}>
                    <Sparkles size={16} color={colors.onSurfaceVariant} strokeWidth={2} />
                    <Text style={styles.fdCardTitle}>Detalles del producto</Text>
                  </View>
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
                  <Text style={styles.fdLabel}>Estado</Text>
                  <View style={[styles.fdChipsWrap, { marginBottom: 4 }]}>
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
                </View>
              )}

              {/* ─── Card: Vendedor ─── */}
              <View style={styles.fdCard}>
                <View style={styles.fdCardHeader}>
                  <Sparkles size={16} color={colors.onSurfaceVariant} strokeWidth={2} />
                  <Text style={styles.fdCardTitle}>Vendedor</Text>
                </View>
                <View style={[styles.fdChipsWrap, { marginBottom: 4 }]}>
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
            title="Elegir marca">
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

      {/* Section/sort picker sheet */}
      <SwipeableSheet
        visible={sectionPickerOpen}
        onClose={() => setSectionPickerOpen(false)}
        title="Filtros">
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
          {filterableSections.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.fdSheetOption}
                activeOpacity={0.7}
                onPress={() => { setActiveSectionId(null); setSectionPickerOpen(false); }}>
                <Text style={[styles.fdSheetOptionText, !activeSectionId && styles.fdSheetOptionActive]}>
                  Todos
                </Text>
                {!activeSectionId && <Check size={18} color={colors.primary} strokeWidth={2.2} />}
              </TouchableOpacity>
              {filterableSections.map((sec) => (
                <TouchableOpacity
                  key={sec.id}
                  style={styles.fdSheetOption}
                  activeOpacity={0.7}
                  onPress={() => { setActiveSectionId(sec.id); setSectionPickerOpen(false); }}>
                  <Text style={[styles.fdSheetOptionText, activeSectionId === sec.id && styles.fdSheetOptionActive]}>
                    {sec.title}
                  </Text>
                  {activeSectionId === sec.id && <Check size={18} color={colors.primary} strokeWidth={2.2} />}
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </SwipeableSheet>

      {/* Sort picker sheet */}
      <SwipeableSheet
        visible={sortPickerOpen}
        onClose={() => setSortPickerOpen(false)}
        title="Ordenar por">
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
          {(Object.keys(SORT_LABELS) as Exclude<SortOrder, null>[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.fdSheetOption}
              activeOpacity={0.7}
              onPress={() => { setSortOrder(key); setSortPickerOpen(false); }}>
              <Text style={[styles.fdSheetOptionText, sortOrder === key && styles.fdSheetOptionActive]}>
                {SORT_LABELS[key]}
              </Text>
              {sortOrder === key && <Check size={18} color={colors.primary} strokeWidth={2.2} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SwipeableSheet>
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
  fdCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    backgroundColor: colors.surfaceContainerLowest,
    padding: 14,
    marginBottom: 12,
  },
  fdCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  fdCardTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurface,
  },
  fdSep: {
    height: 1,
    backgroundColor: colors.outlineVariant + '40',
    marginVertical: 16,
  },
  fdCatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  fdCatBadgeText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
  },
  fdStepperRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  fdStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fdStepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  fdStepperValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: colors.onSurface,
    minWidth: 28,
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  sectionSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  sectionSelectText: {
    flex: 1,
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  sectionClear: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary + '12',
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
    height: 46,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '4d',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
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
