import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Heart,
  ChevronDown,
  X,
  MapPin,
  User,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = ['Todos', 'Electrónica', 'Moda', 'Vehículos', 'Hogar', 'Servicios', 'Deportes'];

const POPULAR = ['iPhone 15 Pro', 'Toyota Hilux', 'Relojes Lujo', 'MacBook M2', 'PS5'];

const PRODUCTS = [
  {
    id: '1',
    title: 'Nike Air Max 2024',
    price: '65.000 XAF',
    location: 'Malabo',
    seller: 'Carlos N.',
    verified: false,
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '2',
    title: 'Sony Noise Cancelling',
    price: '120.000 XAF',
    location: 'Bata',
    seller: 'Elena M.',
    verified: false,
    image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '3',
    title: 'Reloj Minimalista',
    price: '85.000 XAF',
    location: 'Malabo',
    seller: 'Market EG',
    verified: true,
    image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '4',
    title: 'Toyota Corolla 2018',
    price: '4.5M XAF',
    location: 'Bata',
    seller: 'Elite Cars',
    verified: true,
    image: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '5',
    title: 'MacBook Air M2',
    price: '850.000 XAF',
    location: 'Malabo',
    seller: 'Estela N.',
    verified: false,
    image: 'https://images.pexels.com/photos/812264/pexels-photo-812264.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '6',
    title: 'Cámara Sony Alpha',
    price: '540.000 XAF',
    location: 'Ebebiyin',
    seller: 'Lucía B.',
    verified: false,
    image: 'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
];

const LOCATIONS = ['Todas las ciudades', 'Malabo', 'Bata', 'Ebebiyin', 'Mongomo', 'Luba'];
const CONDITIONS = ['Nuevo', 'Como nuevo', 'Usado'];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price_low', label: 'Precio: Bajo a Alto' },
  { value: 'price_high', label: 'Precio: Alto a Bajo' },
  { value: 'newest', label: 'Más recientes' },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortIndex, setSortIndex] = useState(0);
  const [activeCondition, setActiveCondition] = useState<string | null>('Nuevo');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [locationIndex, setLocationIndex] = useState(0);

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

  const toggleLike = (id: string) => setLiked((p) => ({ ...p, [id]: !p[id] }));

  const pairs: (typeof PRODUCTS[0])[][] = [];
  for (let i = 0; i < PRODUCTS.length; i += 2) pairs.push(PRODUCTS.slice(i, i + 2));

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 100 + insets.top }]}>
        {/* Row 1: back + search + filter */}
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
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
              <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
                <X size={14} color={colors.onSurfaceVariant} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={openFilter} activeOpacity={0.8} style={styles.filterBtn}>
            <SlidersHorizontal size={18} color={colors.primary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
        {/* Row 2: sort */}
        <View style={styles.sortRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
            {SORT_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sortChip, sortIndex === i && styles.sortChipActive]}
                onPress={() => setSortIndex(i)}
                activeOpacity={0.8}>
                <Text style={[styles.sortChipText, sortIndex === i && styles.sortChipTextActive]}>
                  {opt.label}
                </Text>
                {sortIndex === i && <ChevronDown size={12} color={colors.primary} strokeWidth={2} />}
              </TouchableOpacity>
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
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.pill, activeCategory === cat && styles.pillActive]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}>
                <Text style={[styles.pillText, activeCategory === cat && styles.pillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular searches */}
        {query.length === 0 && (
          <View style={[styles.section, { paddingBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Búsquedas populares</Text>
            <View style={styles.trendingWrap}>
              {POPULAR.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.trendingChip}
                  onPress={() => setQuery(term)}
                  activeOpacity={0.8}>
                  <TrendingUp size={13} color={colors.secondary} strokeWidth={1.5} />
                  <Text style={styles.trendingText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Results header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{PRODUCTS.length} resultados</Text>
        </View>

        {/* Product grid */}
        <View style={styles.grid}>
          {pairs.map((pair, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {pair.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.92}
                  onPress={() => router.push('/product')}>
                  <View style={styles.cardImageWrap}>
                    <Image source={{ uri: item.image }} style={styles.cardImage} />
                    <TouchableOpacity
                      style={styles.heartBtn}
                      onPress={() => toggleLike(item.id)}
                      activeOpacity={0.85}>
                      <Heart
                        size={15}
                        color="#ffffff"
                        fill={liked[item.id] ? '#ffffff' : 'transparent'}
                        strokeWidth={1.5}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardPrice}>{item.price}</Text>
                    <View style={styles.cardLocation}>
                      <MapPin size={10} color={colors.onSurfaceVariant + '80'} strokeWidth={1.5} />
                      <Text style={styles.cardLocationText}>{item.location}</Text>
                    </View>
                    <View style={styles.cardSeller}>
                      <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />
                      <Text style={styles.cardSellerName} numberOfLines={1}>{item.seller}</Text>
                      {item.verified && (
                        <View style={styles.verifiedDot} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {pair.length === 1 && <View style={styles.cardPlaceholder} />}
            </View>
          ))}
        </View>

        {/* Load more */}
        <View style={styles.loadMoreWrap}>
          <TouchableOpacity style={styles.loadMoreBtn} activeOpacity={0.8}>
            <Text style={styles.loadMoreText}>Cargar más</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Filter drawer */}
      {filterOpen && (
        <>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropAnim }]}
            pointerEvents="auto">
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={closeFilter} activeOpacity={1} />
          </Animated.View>

          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
            {/* Drawer header */}
            <View style={[styles.drawerHeader, { paddingTop: insets.top + 16 }]}>
              <Text style={styles.drawerTitle}>Filtros</Text>
              <TouchableOpacity style={styles.drawerClose} onPress={closeFilter} activeOpacity={0.8}>
                <X size={20} color={colors.onSurface} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerBody} showsVerticalScrollIndicator={false}>
              {/* Price range */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Rango de precio</Text>
                <View style={styles.priceLabels}>
                  <Text style={styles.priceLabel}>0 XAF</Text>
                  <Text style={styles.priceLabel}>5M+ XAF</Text>
                </View>
                <View style={styles.priceCards}>
                  <View style={styles.priceCard}>
                    <Text style={styles.priceCardLabel}>Mínimo</Text>
                    <Text style={styles.priceCardValue}>0 XAF</Text>
                  </View>
                  <View style={styles.priceCard}>
                    <Text style={styles.priceCardLabel}>Máximo</Text>
                    <Text style={styles.priceCardValue}>5M+ XAF</Text>
                  </View>
                </View>
              </View>

              {/* Location */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Ubicación</Text>
                <View style={styles.locationGrid}>
                  {LOCATIONS.map((loc, i) => (
                    <TouchableOpacity
                      key={loc}
                      style={[styles.locationChip, locationIndex === i && styles.locationChipActive]}
                      onPress={() => setLocationIndex(i)}
                      activeOpacity={0.8}>
                      <Text style={[styles.locationChipText, locationIndex === i && styles.locationChipTextActive]}>
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Condition */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Estado del producto</Text>
                <View style={styles.conditionGrid}>
                  {CONDITIONS.map((cond) => (
                    <TouchableOpacity
                      key={cond}
                      style={[styles.conditionChip, activeCondition === cond && styles.conditionChipActive]}
                      onPress={() => setActiveCondition(activeCondition === cond ? null : cond)}
                      activeOpacity={0.8}>
                      <Text style={[styles.conditionChipText, activeCondition === cond && styles.conditionChipTextActive]}>
                        {cond}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Verified only toggle */}
              <View style={styles.filterGroup}>
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleLabel}>Solo vendedores verificados</Text>
                    <Text style={styles.toggleSub}>Mayor seguridad en tus compras</Text>
                  </View>
                  <Switch
                    value={verifiedOnly}
                    onValueChange={setVerifiedOnly}
                    trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              <View style={{ height: 120 }} />
            </ScrollView>

            {/* Drawer footer */}
            <View style={[styles.drawerFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => { setActiveCondition(null); setLocationIndex(0); setVerifiedOnly(false); }}
                activeOpacity={0.8}>
                <Text style={styles.clearBtnText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={closeFilter} activeOpacity={0.88}>
                <Text style={styles.applyBtnText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.86, 360);

const styles = StyleSheet.create({
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
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
  grid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPlaceholder: {
    flex: 1,
  },
  cardImageWrap: {
    height: 140,
    position: 'relative',
  },
  cardImage: {
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: 10,
    gap: 2,
  },
  cardTitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurface,
    lineHeight: 18,
  },
  cardPrice: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.primary,
    lineHeight: 20,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  cardLocationText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant + '99',
  },
  cardSeller: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '33',
  },
  cardAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  cardSellerName: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
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
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
  },
  drawerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 22,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  drawerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBody: {
    flex: 1,
  },
  drawerFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '4d',
    backgroundColor: colors.surface,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '4d',
  },
  clearBtnText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.primary,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  filterGroup: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '22',
  },
  filterGroupTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: 14,
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  priceCards: {
    flexDirection: 'row',
    gap: 12,
  },
  priceCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  priceCardLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  priceCardValue: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  locationChipActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary + '66',
  },
  locationChipText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  locationChipTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: colors.primary,
  },
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  conditionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '66',
    backgroundColor: colors.surfaceContainerLowest,
  },
  conditionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  conditionChipText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  conditionChipTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: colors.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  toggleLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: 2,
  },
  toggleSub: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
});
