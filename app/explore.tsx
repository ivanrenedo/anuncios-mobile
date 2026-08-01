import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  Sparkles,
  Plus,
  Bell,
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import Spinner from '@/components/Spinner';
import SortPickerSheet from '@/components/explore/SortPickerSheet';
import CategoryPickerSheet from '@/components/explore/CategoryPickerSheet';
import FilterDrawer from '@/components/explore/FilterDrawer';
import { useCategoryTree } from '@/hooks/useCategories';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { useFavoriteToggle } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useExploreSearch } from '@/hooks/useExploreSearch';
import { getErrorMessage } from '@/lib/errors';
import { useQuery } from '@apollo/client/react';
import { GET_FILTERABLE_SECTIONS, GET_SECTION_PRODUCTS } from '@/graphql/queries';
import {
  CATEGORY_FILTERS,
  SORT_LABELS,
  toExploreItem,
  type SortOrder,
} from '@/lib/exploreUtils';

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

  // Three-stage mount so the user sees progressive content instead of a
  // frozen screen or a spinner-only shell:
  //   Stage 0 (immediate)          : header (back + search + filter) so the
  //                                  user can go back or start typing right
  //                                  away.
  //   Stage 1 (next animation frame): category pills + saved searches — cheap
  //                                  to render, high visual value.
  //   Stage 2 (after interactions) : product grid, related suggestions,
  //                                  results header, load-more — the heavy
  //                                  part, deferred so it doesn't block the
  //                                  stack slide-in animation.
  // Hooks below still fire on the first mount, so Apollo queries kick off
  // during stage 0 and data is usually ready by the time stage 2 renders.
  const [pillsReady, setPillsReady] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setPillsReady(true));
    const task = InteractionManager.runAfterInteractions(() =>
      setContentReady(true),
    );
    return () => {
      cancelAnimationFrame(raf);
      task.cancel();
    };
  }, []);

  const { tree, refetch: refetchTree } = useCategoryTree();
  const categoryNames = useMemo(
    () => ['Todos', ...tree.map((t: any) => t.label)],
    [tree],
  );
  
  const [query, setQuery] = useState('');
  const [related, setRelated] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const { isFavorite, toggleFavorite } = useFavoriteToggle();
  const { isAuthenticated } = useAuth();
  const { searches: savedSearches, save: saveSearch, remove: removeSavedSearch, saving: savingSearch } = useSavedSearches(isAuthenticated);
  const [refreshing, setRefreshing] = useState(false);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const { data: sectionsData, refetch: refetchSections } = useQuery(GET_FILTERABLE_SECTIONS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const filterableSections = useMemo<
    { id: string; title: string; icon?: string; filter: any }[]
  >(() => (sectionsData as any)?.filterableSections ?? [], [sectionsData]);

  const { data: sectionProductsData, loading: sectionProductsLoading } = useQuery(
    GET_SECTION_PRODUCTS,
    {
      variables: { sectionId: activeSectionId!, take: 50 },
      skip: !activeSectionId,
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    },
  );
  const sectionProducts = useMemo(
    () =>
      activeSectionId
        ? ((sectionProductsData as any)?.sectionProducts ?? []).map(toExploreItem)
        : null,
    [activeSectionId, sectionProductsData],
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  // Filter drawer state
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [activeConditions, setActiveConditions] = useState<string[]>([]);
  const [sellerType, setSellerType] = useState<'particulares' | 'profesionales' | null>(null);
  const [withPriceOnly, setWithPriceOnly] = useState(false);
  const [brand, setBrand] = useState<string | null>(null);
  const [brandModelQuery, setBrandModelQuery] = useState('');
  const [activeEngines, setActiveEngines] = useState<string[]>([]);
  const [activeTransmissions, setActiveTransmissions] = useState<string[]>([]);
  const [operation, setOperation] = useState<string | null>(null);
  const [filterBedrooms, setFilterBedrooms] = useState(0);
  const [filterBathrooms, setFilterBathrooms] = useState(0);
  const [surfaceMin, setSurfaceMin] = useState('');
  const [filterOfferType, setFilterOfferType] = useState<string | null>(null);

  // Resolve category → categoryId for the server query
  const activeCategoryId = useMemo(
    () =>
      activeCategory !== 'Todos'
        ? (tree.find((t: any) => t.label === activeCategory)?.id ??
          tree
            .flatMap((t: any) => t.children ?? [])
            .find((c: any) => c.label === activeCategory)?.id ??
          undefined)
        : undefined,
    [activeCategory, tree],
  );

  // Full SEARCH_PRODUCTS pipeline (debounces, useQuery, useLazyQuery for
  // pagination, page reset) lives in useExploreSearch. Post-filters that
  // the backend doesn't support (sellerType, withPriceOnly, multi-condition,
  // brandModelQuery, az/za sort) stay below over `searchResults`.
  const {
    searchData,
    productsLoading,
    refetchProducts,
    debouncedQuery,
    searchResults,
    loadMore,
    loadingMore,
    hasMore,
  } = useExploreSearch({
    query,
    categoryId: activeCategoryId,
    city: cityFilter,
    priceMin,
    priceMax,
    singleCondition:
      activeConditions.length === 1 ? activeConditions[0] : undefined,
    sortOrder,
  });

  // Nuevos anuncios, cambios de categoría/sección desde admin y ediciones
  // remotas se ven al volver a explore sin pull-to-refresh.
  useRefetchOnFocus([refetchProducts, refetchSections, refetchTree]);

  // ── Saved searches (alerts) ────────────────────────────────────────────────
  const hasSearchCriteria = !!(
    query.trim() || activeCategoryId || cityFilter.trim() || priceMin || priceMax
  );

  const findCategory = (catId: string) =>
    tree.find((t: any) => t.id === catId) ??
    tree.flatMap((t: any) => t.children ?? []).find((c: any) => c.id === catId);

  const savedSearchLabel = (s: any) => {
    const parts: string[] = [];
    if (s.query) parts.push(s.query);
    if (s.categoryId) {
      const cat = findCategory(s.categoryId);
      if (cat) parts.push(cat.label);
    }
    if (s.city) parts.push(s.city);
    return parts.join(' · ') || 'Alerta';
  };

  const onSaveSearch = async () => {
    if (savingSearch) return;
    try {
      await saveSearch({
        query: query.trim() || undefined,
        categoryId: activeCategoryId,
        city: cityFilter.trim() || undefined,
        priceMin: priceMin ? parseInt(priceMin, 10) : undefined,
        priceMax: priceMax ? parseInt(priceMax, 10) : undefined,
      });
      Alert.alert(
        'Búsqueda guardada',
        'Te avisaremos cuando se publique un anuncio que coincida.',
      );
    } catch (e) {
      Alert.alert('No se pudo guardar', getErrorMessage(e));
    }
  };

  const applySavedSearch = (s: any) => {
    setQuery(s.query ?? '');
    setCityFilter(s.city ?? '');
    setPriceMin(s.priceMin != null ? String(Math.trunc(Number(s.priceMin))) : '');
    setPriceMax(s.priceMax != null ? String(Math.trunc(Number(s.priceMax))) : '');
    setActiveCategory(s.categoryId ? findCategory(s.categoryId)?.label ?? 'Todos' : 'Todos');
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

  const clearSearch = () => {
    setQuery('');
    setRelated([]);
  };

  const applySuggestion = (term: string) => setQuery(term);

  // Server handles: query, categoryId, city, condition, price, sortBy.
  // Post-filters for what the backend doesn't support yet. Memoized so the
  // filter/sort chain doesn't re-run on unrelated state changes.
  const visibleProducts = useMemo(() => {
    let list = sectionProducts ? sectionProducts : searchResults;

    if (sellerType === 'profesionales')
      list = list.filter((p: any) => p.verified);
    else if (sellerType === 'particulares')
      list = list.filter((p: any) => !p.verified);
    if (withPriceOnly)
      list = list.filter((p: any) => p.priceNum > 0);
    if (activeConditions.length > 1)
      list = list.filter((p: any) =>
        activeConditions.includes(p.condition ?? ''),
      );
    if (brandModelQuery.trim())
      list = list.filter((p: any) =>
        p.title.toLowerCase().includes(brandModelQuery.trim().toLowerCase()),
      );

    if (sortOrder === 'az')
      list = [...list].sort((a: any, b: any) => a.title.localeCompare(b.title));
    else if (sortOrder === 'za')
      list = [...list].sort((a: any, b: any) => b.title.localeCompare(a.title));
    else if (sortOrder === 'price_asc')
      list = [...list].sort((a: any, b: any) => a.priceRaw - b.priceRaw);
    else if (sortOrder === 'price_desc')
      list = [...list].sort((a: any, b: any) => b.priceRaw - a.priceRaw);

    return list;
  }, [
    sectionProducts,
    searchResults,
    sellerType,
    withPriceOnly,
    activeConditions,
    brandModelQuery,
    sortOrder,
  ]);

  const pairs = useMemo(() => {
    const out: any[][] = [];
    for (let i = 0; i < visibleProducts.length; i += 2)
      out.push(visibleProducts.slice(i, i + 2));
    return out;
  }, [visibleProducts]);

  const catFilter = CATEGORY_FILTERS[activeCategory.toLowerCase()] ?? CATEGORY_FILTERS.todos;

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
     try { await Promise.all([refetchProducts(), refetchSections()]); } catch {}
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
              placeholder="Buscar en Bomelh"
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
            onPress={() => setFilterOpen(true)}
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
        {/* Category pills — stage 1 */}
        {pillsReady && (
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
        )}

        {/* Saved searches / alerts — stage 1 */}
        {pillsReady && isAuthenticated && (hasSearchCriteria || savedSearches.length > 0) && (
          <View style={[styles.section, { paddingTop: 0, paddingBottom: 0 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {hasSearchCriteria && (
                  <TouchableOpacity
                    style={styles.saveSearchChip}
                    activeOpacity={0.8}
                    onPress={onSaveSearch}>
                    <Bell size={12} color="#ffffff" strokeWidth={2} />
                    <Text style={styles.saveSearchText}>
                      {savingSearch ? 'Guardando…' : 'Guardar búsqueda'}
                    </Text>
                  </TouchableOpacity>
                )}
                {savedSearches.map((s: any) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.trendingChip, styles.relatedChip]}
                    activeOpacity={0.7}
                    onPress={() => applySavedSearch(s)}>
                    <Bell size={12} color={colors.primary} strokeWidth={1.8} />
                    <Text style={[styles.trendingText, { color: colors.primary }]} numberOfLines={1}>
                      {savedSearchLabel(s)}
                    </Text>
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                      onPress={() => removeSavedSearch(s.id)}>
                      <X size={12} color={colors.onSurfaceVariant} strokeWidth={2} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Stage 2 — related + results header + product grid + load more.
            These are the heavy pieces (many ProductCards, sort/filter memo
            chains). Deferring until interactions settle lets the stack
            slide-in animation finish before React starts building this
            subtree, so the transition feels instant. */}
        {contentReady && (
        <>
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
              {debouncedQuery.trim()
                ? `${visibleProducts.length} resultados para "${debouncedQuery.trim()}"`
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
            <Text style={styles.emptyTitle}>Sin resultados para "{debouncedQuery.trim()}"</Text>
            <Text style={styles.emptyDesc}>
              {related.length > 0
                ? 'Prueba una de las búsquedas relacionadas de arriba.'
                : 'Prueba con otras palabras o revisa la ortografía.'}
            </Text>
          </View>
        ) : null}

        {/* Load more */}
        {!productsLoading && visibleProducts.length > 0 && (hasMore || loadingMore) && (
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
        </>
        )}
      </ScrollView>

      {/* Filter drawer — lazy-mounted. Owns its own entrance/exit animation
          and the nested brand-picker sheet. Filter state lives here and is
          passed down so the search-input in the header stays in sync. */}
      {filterOpen && (
        <FilterDrawer
          visible={filterOpen}
          onClose={() => setFilterOpen(false)}
          activeCategory={activeCategory}
          catFilter={catFilter}
          onOpenCategoryPicker={() => setCategoryPickerOpen(true)}
          query={query}
          setQuery={setQuery}
          clearSearch={clearSearch}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          priceMin={priceMin}
          setPriceMin={setPriceMin}
          priceMax={priceMax}
          setPriceMax={setPriceMax}
          withPriceOnly={withPriceOnly}
          setWithPriceOnly={setWithPriceOnly}
          operation={operation}
          setOperation={setOperation}
          brandModelQuery={brandModelQuery}
          setBrandModelQuery={setBrandModelQuery}
          activeConditions={activeConditions}
          setActiveConditions={setActiveConditions}
          activeEngines={activeEngines}
          setActiveEngines={setActiveEngines}
          activeTransmissions={activeTransmissions}
          setActiveTransmissions={setActiveTransmissions}
          filterOfferType={filterOfferType}
          setFilterOfferType={setFilterOfferType}
          filterBedrooms={filterBedrooms}
          setFilterBedrooms={setFilterBedrooms}
          filterBathrooms={filterBathrooms}
          setFilterBathrooms={setFilterBathrooms}
          surfaceMin={surfaceMin}
          setSurfaceMin={setSurfaceMin}
          brand={brand}
          setBrand={setBrand}
          sellerType={sellerType}
          setSellerType={setSellerType}
          resultCount={visibleProducts.length}
          productsLoading={productsLoading}
          clearFilters={clearFilters}
        />
      )}

      {/* Sort picker sheet — lazy-mounted (see note above). */}
      {sortPickerOpen && (
        <SortPickerSheet
          visible={sortPickerOpen}
          value={sortOrder}
          onChange={setSortOrder}
          onClose={() => setSortPickerOpen(false)}
        />
      )}

      {/* Category picker sheet — drill-down like the post-creation flow.
          Replaces the old navigation to the categories tab, which broke the
          back stack (back went to Home instead of here) and forced a full
          Home reload. Lazy-mounted like the other sheets. */}
      {categoryPickerOpen && (
        <CategoryPickerSheet
          visible={categoryPickerOpen}
          tree={tree}
          active={activeCategory}
          onChange={(label) => {
            setActiveCategory(label);
            setBrand(null);
            setActiveConditions([]);
          }}
          onClose={() => setCategoryPickerOpen(false)}
        />
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
  saveSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveSearchText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: '#ffffff',
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
});
