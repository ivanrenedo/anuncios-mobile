import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Car,
  Check,
  ChevronRight,
  Minus,
  Navigation,
  Plus,
  Search,
  Sparkles,
  Tag,
  X,
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';
import Spinner from '@/components/Spinner';
import SwipeableSheet from '@/components/SwipeableSheet';
import { BRANDS, type CatFilter } from '@/lib/exploreUtils';
import { useSheetStyles } from './sheetStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface FilterDrawerProps {
  /** Whether the drawer is currently visible. Parent should conditionally
   *  render `<FilterDrawer visible ... />` — the component does the entrance
   *  animation on mount and calls `onClose` after the exit animation ends,
   *  at which point the parent unmounts it. */
  visible: boolean;
  onClose: () => void;

  // Category (readonly + a callback that opens the drill-down picker)
  activeCategory: string;
  catFilter: CatFilter;
  onOpenCategoryPicker: () => void;

  // Text search inside the drawer (same state as the header's search box)
  query: string;
  setQuery: (v: string) => void;
  clearSearch: () => void;

  // Location
  cityFilter: string;
  setCityFilter: (v: string) => void;

  // Price
  priceMin: string;
  setPriceMin: (v: string) => void;
  priceMax: string;
  setPriceMax: (v: string) => void;
  withPriceOnly: boolean;
  setWithPriceOnly: (v: boolean) => void;

  // Category-specific
  operation: string | null;
  setOperation: (v: string | null) => void;
  brandModelQuery: string;
  setBrandModelQuery: (v: string) => void;
  activeConditions: string[];
  setActiveConditions: React.Dispatch<React.SetStateAction<string[]>>;
  activeEngines: string[];
  setActiveEngines: React.Dispatch<React.SetStateAction<string[]>>;
  activeTransmissions: string[];
  setActiveTransmissions: React.Dispatch<React.SetStateAction<string[]>>;
  filterOfferType: string | null;
  setFilterOfferType: (v: string | null) => void;
  filterBedrooms: number;
  setFilterBedrooms: React.Dispatch<React.SetStateAction<number>>;
  filterBathrooms: number;
  setFilterBathrooms: React.Dispatch<React.SetStateAction<number>>;
  surfaceMin: string;
  setSurfaceMin: (v: string) => void;

  // Brand picker (for non-vertical categories with brand list)
  brand: string | null;
  setBrand: (v: string | null) => void;

  // Seller
  sellerType: 'particulares' | 'profesionales' | null;
  setSellerType: (v: 'particulares' | 'profesionales' | null) => void;

  // Footer / actions
  resultCount: number;
  productsLoading: boolean;
  clearFilters: () => void;
}

export default function FilterDrawer(props: FilterDrawerProps) {
  const {
    onClose,
    activeCategory,
    catFilter,
    onOpenCategoryPicker,
    query,
    setQuery,
    clearSearch,
    cityFilter,
    setCityFilter,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    withPriceOnly,
    setWithPriceOnly,
    operation,
    setOperation,
    brandModelQuery,
    setBrandModelQuery,
    activeConditions,
    setActiveConditions,
    activeEngines,
    setActiveEngines,
    activeTransmissions,
    setActiveTransmissions,
    filterOfferType,
    setFilterOfferType,
    filterBedrooms,
    setFilterBedrooms,
    filterBathrooms,
    setFilterBathrooms,
    surfaceMin,
    setSurfaceMin,
    brand,
    setBrand,
    sellerType,
    setSellerType,
    resultCount,
    productsLoading,
    clearFilters,
  } = props;

  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const sheetStyles = useSheetStyles();
  const CatIcon = catFilter.icon;

  // Local UI state for the brand picker sheet nested inside the drawer.
  const [picker, setPicker] = useState<null | 'brand'>(null);

  const drawerAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Play the entrance animation on mount and hook Android hardware back.
  useEffect(() => {
    Animated.parallel([
      Animated.spring(drawerAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    Animated.parallel([
      Animated.timing(drawerAnim, {
        toValue: SCREEN_WIDTH,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  // Chip-list toggles — local so the parent's array setters don't need special
  // toggle wrappers.
  const toggleCondition = (c: string) =>
    setActiveConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  const toggleEngine = (e: string) =>
    setActiveEngines((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  const toggleTransmission = (t: string) =>
    setActiveTransmissions((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  // Brand picker (used only when the category has `brandModel` but isn't the
  // free-text vehicles case).
  const pickerOptions =
    picker === 'brand' ? BRANDS[activeCategory.toLowerCase()] ?? [] : [];
  const pickerValue = brand ?? '';
  const onPickerSelect = (opt: string) => {
    if (picker === 'brand') setBrand(opt);
    setPicker(null);
  };

  return (
    <>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents="auto">
        <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        {/* Header */}
        <View style={[styles.fdHeader, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.fdTitle}>Filtrar tu búsqueda</Text>
          <RipplePress
            style={styles.fdClose}
            onPress={close}
            borderRadius={20}
            rippleColor={colors.primary + '15'}>
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
              onPress={onOpenCategoryPicker}>
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
            <View
              style={[
                styles.fdCard,
                { borderColor: (catFilter.color ?? colors.primary) + '40' },
              ]}>
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
                  <RipplePress
                    style={styles.fdSelector}
                    borderRadius={14}
                    rippleColor={colors.primary + '10'}
                    onPress={() => setPicker('brand')}>
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
          <RipplePress
            style={styles.fdApplyBtn}
            onPress={close}
            borderRadius={14}
            rippleColor="rgba(255,255,255,0.2)">
            {productsLoading ? (
              <Spinner color="#ffffff" />
            ) : (
              <Text style={styles.fdApplyText}>({resultCount}) anuncios</Text>
            )}
          </RipplePress>
        </View>
      </Animated.View>

      {/* Brand picker sheet — nested here because it's drawer-scoped. */}
      <SwipeableSheet
        visible={picker !== null}
        onClose={() => setPicker(null)}
        title="Elegir marca">
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
          {pickerOptions.length === 0 ? (
            <Text style={sheetStyles.empty}>No hay opciones para esta categoría.</Text>
          ) : (
            pickerOptions.map((opt) => {
              const active = pickerValue === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={sheetStyles.option}
                  activeOpacity={0.7}
                  onPress={() => onPickerSelect(opt)}>
                  <Text style={[sheetStyles.optionText, active && sheetStyles.optionActive]}>
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
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      width: SCREEN_WIDTH,
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
      shadowOffset: { width: -0, height: 4 },
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
  });
