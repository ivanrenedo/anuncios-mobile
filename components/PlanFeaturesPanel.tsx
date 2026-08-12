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
import {
  Pin,
  Zap,
  X,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react-native';
import { colors, useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { PINNED_PRODUCTS, MY_AUTO_BUMP_SLOTS } from '@/graphql/queries';
import { SET_PINNED_PRODUCTS } from '@/graphql/mutations';
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
 * v2 Fase 13 mobile — espejo del shop web.
 *
 * Add/remove de pins y auto-bump vive SOLO en los botones de cada card del
 * perfil (Fase 11.3). Este panel es informativo, con una única acción
 * secundaria: reordenar pins (solo si hay ≥2). Se retiró ProductPickerSheet
 * — el bulk-select se sacrificó a favor de una sola forma de pinear.
 */
export default function PlanFeaturesPanel({
  userId,
  effectivePlan,
  products,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const limits = PLAN_LIMITS[effectivePlan] ?? PLAN_LIMITS.FREE;
  const [reorderOpen, setReorderOpen] = useState(false);

  const { data: pinnedData } = useQuery<any>(PINNED_PRODUCTS, {
    variables: { userId },
    skip: !userId || limits.pinned === 0,
    fetchPolicy: 'cache-and-network',
  });
  const { data: slotsData } = useQuery<any>(MY_AUTO_BUMP_SLOTS, {
    skip: limits.slots === 0,
    fetchPolicy: 'cache-and-network',
  });

  const pinned = (pinnedData?.pinnedProducts ?? []) as Array<{
    id: string;
    title: string;
    images?: { url: string }[];
  }>;
  const slotCount: number = (slotsData?.myAutoBumpSlots ?? []).length;

  if (limits.pinned === 0 && limits.slots === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Ventajas de tu plan</Text>
      <View style={styles.row}>
        {pinned.length >= 2 && (
          <TouchableOpacity
            style={styles.reorderChip}
            activeOpacity={0.85}
            onPress={() => setReorderOpen(true)}>
            <ArrowUpDown size={11} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.reorderChipText}>Reordenar</Text>
          </TouchableOpacity>
        )}
        {limits.pinned > 0 && (
          <View style={styles.item}>
            <Pin size={14} color="#7C3AED" strokeWidth={2} />
            <Text style={styles.itemText}>
              Anuncios fijados{' '}
              <Text style={styles.itemStrong}>
                {pinned.length}/{limits.pinned}
              </Text>
            </Text>
          </View>
        )}
        {limits.slots > 0 && (
          <View style={styles.item}>
            <Zap size={14} color="#F5A623" strokeWidth={2} />
            <Text style={styles.itemText}>
              Auto-bump {limits.cadence}{' '}
              <Text style={styles.itemStrong}>
                {slotCount}/{limits.slots}
              </Text>
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.hint}>
        Fija o activa auto-bump con los botones de cada anuncio.
      </Text>

      <ReorderPinsSheet
        visible={reorderOpen}
        onClose={() => setReorderOpen(false)}
        pinned={pinned}
        products={products}
      />
    </View>
  );
}

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  pinned: Array<{ id: string; title: string; images?: { url: string }[] }>;
  products: Props['products'];
}

function ReorderPinsSheet({ visible, onClose, pinned, products }: SheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<string[]>(() => pinned.map((p) => p.id));

  React.useEffect(() => {
    if (visible) setOrder(pinned.map((p) => p.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const productMap = useMemo(() => {
    const m = new Map<string, Props['products'][number] | (typeof pinned)[number]>();
    for (const p of products) m.set(p.id, p);
    for (const p of pinned) if (!m.has(p.id)) m.set(p.id, p);
    return m;
  }, [products, pinned]);

  const [setPinnedMut, { loading: saving }] = useMutation(SET_PINNED_PRODUCTS, {
    refetchQueries: ['PinnedProducts'],
    awaitRefetchQueries: true,
  });

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[idx], next[j]] = [next[j], next[idx]];
    setOrder(next);
  };

  const onSave = async () => {
    try {
      await setPinnedMut({ variables: { productIds: order } });
      onClose();
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e, 'No se pudo guardar el orden.'));
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
            <Text style={styles.sheetTitle}>Reordenar anuncios fijados</Text>
            <Text style={styles.sheetSubtitle}>
              Cambia el orden con las flechas. Para fijar o quitar, usa el
              botón de la card.
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.onSurface} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          {order.map((id, idx) => {
            const p = productMap.get(id);
            const img = p?.images?.[0]?.url;
            return (
              <View key={id} style={styles.itemRow}>
                <View style={styles.orderIdx}>
                  <Text style={styles.orderIdxText}>{idx + 1}</Text>
                </View>
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
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {p?.title ?? 'Anuncio'}
                </Text>
                <TouchableOpacity
                  onPress={() => move(idx, -1)}
                  disabled={idx === 0}
                  style={[styles.arrowBtn, idx === 0 && { opacity: 0.3 }]}>
                  <ChevronUp size={16} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => move(idx, 1)}
                  disabled={idx === order.length - 1}
                  style={[
                    styles.arrowBtn,
                    idx === order.length - 1 && { opacity: 0.3 },
                  ]}>
                  <ChevronDown size={16} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.cancelBtn}
            activeOpacity={0.85}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            activeOpacity={0.85}>
            {saving && <ActivityIndicator size="small" color="#ffffff" />}
            <Text style={styles.saveBtnText}>Guardar orden</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      padding: 12,
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
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 12,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    itemText: {
      fontFamily: 'Manrope-Regular',
      fontSize: 13,
      color: colors.onSurface,
    },
    itemStrong: {
      fontFamily: 'Manrope-Bold',
    },
    reorderChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginLeft: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: "#7C3AED",
    },
    reorderChipText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 12,
      color: "#ffffff",
    },
    hint: {
      fontFamily: 'Manrope-Regular',
      fontSize: 10,
      color: colors.onSurfaceVariant,
      marginTop: 8,
    },

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
      lineHeight: 17,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '55',
      borderRadius: 12,
      padding: 8,
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
    itemImg: { width: 40, height: 40, borderRadius: 8 },
    itemImgFallback: { backgroundColor: colors.surfaceContainerLow },
    itemTitle: {
      flex: 1,
      fontFamily: 'Manrope-SemiBold',
      fontSize: 13,
      color: colors.onSurface,
    },
    arrowBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },

    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: colors.surface,
      borderTopWidth: 0.5,
      borderTopColor: colors.outlineVariant + '4d',
    },
    cancelBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    cancelBtnText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 14,
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
