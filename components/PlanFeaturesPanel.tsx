import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@apollo/client/react';
import { Pin, Zap, X, Check, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { PINNED_PRODUCTS, MY_AUTO_BUMP_SLOTS } from '@/graphql/queries';
import {
  SET_PINNED_PRODUCTS,
  SET_AUTO_BUMP_SLOTS,
} from '@/graphql/mutations';
import { API_URL } from '@/lib/config';
import { getErrorMessage } from '@/lib/errors';

const PLAN_LIMITS: Record<
  string,
  { pinned: number; slots: number; cadence: string | null }
> = {
  FREE: { pinned: 0, slots: 0, cadence: null },
  BASIC: { pinned: 0, slots: 0, cadence: null },
  STAR: { pinned: 4, slots: 3, cadence: 'semanal' },
  PREMIUM: { pinned: 10, slots: 5, cadence: 'diaria' },
};

interface Props {
  userId: string;
  effectivePlan: string;
  products: Array<{
    id: string;
    title: string;
    price: number | string;
    status?: string;
    images?: { url: string }[];
  }>;
}

/**
 * v2 Fase 10b mobile — espejo del PlanFeaturesPanel del shop web.
 * Dos bars (fijados + auto-bump slots) que abren pickers full-screen.
 * Auto-hide para Free/Basic (limits = 0).
 */
export default function PlanFeaturesPanel({
  userId,
  effectivePlan,
  products,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const limits = PLAN_LIMITS[effectivePlan] ?? PLAN_LIMITS.FREE;
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [slotsOpen, setSlotsOpen] = useState(false);

  const { data: pinnedData } = useQuery<any>(PINNED_PRODUCTS, {
    variables: { userId },
    skip: !userId || limits.pinned === 0,
    fetchPolicy: 'cache-and-network',
  });
  const { data: slotsData } = useQuery<any>(MY_AUTO_BUMP_SLOTS, {
    skip: limits.slots === 0,
    fetchPolicy: 'cache-and-network',
  });

  const pinnedIds: string[] = (pinnedData?.pinnedProducts ?? []).map(
    (p: any) => p.id,
  );
  const slotIds: string[] = (slotsData?.myAutoBumpSlots ?? []).map(
    (s: any) => s.productId,
  );

  if (limits.pinned === 0 && limits.slots === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Ventajas de tu plan</Text>
      <View style={styles.row}>
        {limits.pinned > 0 && (
          <TouchableOpacity
            style={styles.bar}
            activeOpacity={0.85}
            onPress={() => setPinnedOpen(true)}>
            <Pin size={14} color="#7C3AED" strokeWidth={2} />
            <Text style={styles.barText}>Anuncios fijados</Text>
            <View style={[styles.chip, { backgroundColor: '#7C3AED22' }]}>
              <Text style={[styles.chipText, { color: '#7C3AED' }]}>
                {pinnedIds.length} / {limits.pinned}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        {limits.slots > 0 && (
          <TouchableOpacity
            style={styles.bar}
            activeOpacity={0.85}
            onPress={() => setSlotsOpen(true)}>
            <Zap size={14} color="#F5A623" strokeWidth={2} />
            <Text style={styles.barText}>Auto-bump {limits.cadence}</Text>
            <View style={[styles.chip, { backgroundColor: '#F5A62322' }]}>
              <Text style={[styles.chipText, { color: '#F5A623' }]}>
                {slotIds.length} / {limits.slots}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ProductPickerSheet
        visible={pinnedOpen}
        onClose={() => setPinnedOpen(false)}
        title="Anuncios fijados en tu perfil"
        subtitle="Aparecen antes que el resto en tu perfil."
        products={products}
        initialSelected={pinnedIds}
        limit={limits.pinned}
        mutation="pins"
      />
      <ProductPickerSheet
        visible={slotsOpen}
        onClose={() => setSlotsOpen(false)}
        title={`Pool de auto-bump (${limits.cadence ?? ''})`}
        subtitle="Estos anuncios suben automáticamente en su categoría."
        products={products}
        initialSelected={slotIds}
        limit={limits.slots}
        mutation="slots"
      />
    </View>
  );
}

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  products: Props['products'];
  initialSelected: string[];
  limit: number;
  mutation: 'pins' | 'slots';
}

function ProductPickerSheet({
  visible,
  onClose,
  title,
  subtitle,
  products,
  initialSelected,
  limit,
  mutation,
}: SheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>(initialSelected);

  // Reset a la selección del server al reabrir (evita drift si el usuario
  // canceló y volvió a abrir).
  React.useEffect(() => {
    if (visible) setSelected(initialSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const active = useMemo(
    () => products.filter((p) => (p.status ?? 'active') === 'active'),
    [products],
  );

  const [setPinnedMut, { loading: savingPins }] = useMutation(
    SET_PINNED_PRODUCTS,
    { refetchQueries: ['PinnedProducts'], awaitRefetchQueries: true },
  );
  const [setSlotsMut, { loading: savingSlots }] = useMutation(
    SET_AUTO_BUMP_SLOTS,
    { refetchQueries: ['MyAutoBumpSlots'], awaitRefetchQueries: true },
  );
  const saving = savingPins || savingSlots;

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else if (selected.length < limit) {
      setSelected([...selected, id]);
    } else {
      Alert.alert(
        'Límite alcanzado',
        `Tu plan permite hasta ${limit} anuncios.`,
      );
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= selected.length) return;
    const next = [...selected];
    [next[idx], next[j]] = [next[j], next[idx]];
    setSelected(next);
  };

  const onSave = async () => {
    try {
      if (mutation === 'pins') {
        await setPinnedMut({ variables: { productIds: selected } });
      } else {
        await setSlotsMut({ variables: { productIds: selected } });
      }
      onClose();
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e, 'No se pudo guardar.'));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingTop: insets.top }]}>
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Text style={styles.sheetSubtitle}>{subtitle}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.onSurface} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {selected.length > 0 && (
          <View style={styles.orderBox}>
            <Text style={styles.orderLabel}>Orden</Text>
            {selected.map((id, idx) => {
              const p = active.find((x) => x.id === id);
              if (!p) return null;
              return (
                <View key={id} style={styles.orderRow}>
                  <View style={styles.orderIdx}>
                    <Text style={styles.orderIdxText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.orderTitle} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => move(idx, -1)}
                    disabled={idx === 0}
                    style={[styles.orderBtn, idx === 0 && { opacity: 0.3 }]}>
                    <ChevronUp size={14} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => move(idx, 1)}
                    disabled={idx === selected.length - 1}
                    style={[
                      styles.orderBtn,
                      idx === selected.length - 1 && { opacity: 0.3 },
                    ]}>
                    <ChevronDown size={14} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggle(id)}
                    style={styles.orderBtn}>
                    <X size={12} color={colors.error} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {active.length === 0 ? (
            <Text style={styles.empty}>
              No tienes anuncios activos que puedas fijar.
            </Text>
          ) : (
            active.map((p) => {
              const isSel = selected.includes(p.id);
              const img = p.images?.[0]?.url;
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.7}
                  onPress={() => toggle(p.id)}
                  style={[
                    styles.itemRow,
                    isSel && { backgroundColor: colors.primary + '10' },
                  ]}>
                  {img ? (
                    <Image
                      source={{
                        uri: img.startsWith('/') ? `${API_URL}${img}` : img,
                      }}
                      style={styles.itemImg}
                    />
                  ) : (
                    <View style={[styles.itemImg, styles.itemImgFallback]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {p.title}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {Number(p.price).toLocaleString('es')} XAF
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.itemCheck,
                      isSel && { backgroundColor: colors.primary },
                    ]}>
                    {isSel && <Check size={14} color="#ffffff" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.footerCount}>
            <Text style={{ fontFamily: 'Manrope-Bold', color: colors.onSurface }}>
              {selected.length}
            </Text>{' '}
            / {limit} seleccionados
          </Text>
          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            activeOpacity={0.85}>
            {saving && <ActivityIndicator size="small" color="#ffffff" />}
            <Text style={styles.saveBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginTop: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.primary + '0A',
      borderWidth: 0.5,
      borderColor: colors.primary + '30',
    },
    cardTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 11,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 10,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surfaceContainerLowest,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
    },
    barText: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 13,
      color: colors.onSurface,
    },
    chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
    chipText: { fontFamily: 'Manrope-Bold', fontSize: 11 },

    sheet: { flex: 1, backgroundColor: colors.surface },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.outlineVariant + '4d',
    },
    sheetTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 16,
      color: colors.onSurface,
    },
    sheetSubtitle: {
      fontFamily: 'Manrope-Regular',
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    orderBox: {
      backgroundColor: colors.surfaceContainerLow,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.outlineVariant + '4d',
    },
    orderLabel: {
      fontFamily: 'Manrope-Bold',
      fontSize: 10,
      color: colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
    },
    orderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surfaceContainerLowest,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      marginBottom: 6,
    },
    orderIdx: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    orderIdxText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 11,
      color: colors.primary,
    },
    orderTitle: {
      fontFamily: 'Manrope-Regular',
      fontSize: 13,
      color: colors.onSurface,
      flex: 1,
    },
    orderBtn: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },

    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.outlineVariant + '2a',
    },
    itemImg: { width: 44, height: 44, borderRadius: 8 },
    itemImgFallback: { backgroundColor: colors.surfaceContainerLow },
    itemTitle: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 14,
      color: colors.onSurface,
    },
    itemPrice: {
      fontFamily: 'Manrope-Regular',
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    itemCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    empty: {
      fontFamily: 'Manrope-Regular',
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      paddingVertical: 40,
      paddingHorizontal: 16,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: colors.surface,
      borderTopWidth: 0.5,
      borderTopColor: colors.outlineVariant + '4d',
    },
    footerCount: {
      fontFamily: 'Manrope-Regular',
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
    },
    saveBtnText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 14,
      color: '#ffffff',
    },
  });
