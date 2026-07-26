import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  Alert,
  Dimensions,
  BackHandler,
  Modal,
  Animated,
  FlatList,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Camera,
  ShoppingBag,
  Car,
  Wrench,
  Building2,
  Briefcase,
  Minus,
  Check,
  MapPin,
  Eye,
  ImageIcon,
  LogIn,
  Play,
} from 'lucide-react-native';
import { colors, useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';
import SwipeableSheet from '@/components/SwipeableSheet';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCreateProduct, useUpdateProduct, useProduct, useProductsBySeller } from '@/hooks/useProducts';
import { useCategoryTree } from '@/hooks/useCategories';
import type { ImagePickerAsset } from 'expo-image-picker';
import {
  uploadMedia,
  generateVideoThumbnail,
  type MediaAsset,
} from '@/lib/upload';
import { resolveImage } from '@/lib/config';
import Spinner from '@/components/Spinner';
import ColorPicker from '@/components/ColorPicker';
import { fmtPrice as fmtPriceCompact } from '@/components/ProductCard';
import { getErrorMessage } from '@/lib/errors';

const MAX_PHOTOS = 4;
const MAX_PHOTO_MB = 2;

// expo-image-picker is a native module (requireNativeModule at import). Load it
// defensively so an outdated binary (built before it was added) degrades
// gracefully instead of crashing the Publicar screen. A fresh dev build enables it.
let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  ImagePicker = null;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Domain config
// ─────────────────────────────────────────────────────────────────────────────

type Kind = 'MarketPlace' | 'vehiculos' | 'servicios' | 'inmobiliaria' | 'empleo';

const KIND_META: Record<
  Kind,
  { label: string; subtitle: string; Icon: any; color: string }
> = {
  MarketPlace: {
    label: 'MarketPlace',
    subtitle: 'Vende artículos nuevos o de segunda mano',
    Icon: ShoppingBag,
    color: colors.primary,
  },
    inmobiliaria: {
    label: 'Inmobiliaria',
    subtitle: 'Pisos, casas, locales y terrenos',
    Icon: Building2,
    color: colors.outline,
  },
  vehiculos: {
    label: 'Vehículos',
    subtitle: 'Coches, motos, camiones y más',
    Icon: Car,
    color: colors.tertiary,
  },
  servicios: {
    label: 'Servicios',
    subtitle: 'Ofrece tu trabajo o profesionalidad',
    Icon: Wrench,
    color: colors.secondary,
  },
  empleo: {
    label: 'Empleo',
    subtitle: 'Publica una oferta o búscala',
    Icon: Briefcase,
    color: colors.error,
  },
};


const CONDITIONS_FULL = [
  'Sin abrir',
  'Nuevo',
  'Como nuevo',
  'Buen estado',
  'aceptable',
  'Lo ha dado todo',
];

const CONDITIONS_VEHICLE = [
  'Nuevo',
  'Buen estado',
  'Para piezas',
];

const PROPERTY_CONDITIONS = ['Obra nueva', 'Buen estado', 'A reformar'];
const PROPERTY_OPERATIONS = ['Venta', 'Alquiler'];


const ENGINE_TYPES = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'GLP'];
const TRANSMISSION_TYPES = ['Manual', 'Automático'];


const SERVICE_OPTIONS = ['Oferta', 'Demanda'];

type FormState = Record<string, any>;

function getMissingFields(kind: Kind, form: FormState): string[] {
  const missing: string[] = [];
  const check = (val: unknown, label: string) => {
    if (val === undefined || val === null || val === '') missing.push(label);
  };

  if (!form.media || form.media.length === 0) missing.push('Fotos');
  check(form.categoryId, 'Categoría');
  check(form.title, 'Título');
  check(form.description, 'Descripción');
  check(form.city, 'Ubicación');

  switch (kind) {
    case 'MarketPlace':
      check(form.condition, 'Estado');
      break;
    case 'vehiculos':
      check(form.condition, 'Estado');
      check(form.transmission, 'Cambio');
      check(form.engine, 'Motor');
      break;
    case 'servicios':
      check(form.offerType, 'Modalidad');
      break;
    case 'inmobiliaria':
      check(form.condition, 'Estado');
      if (!form.bedrooms || form.bedrooms <= 0) missing.push('Habitaciones');
      check(form.address, 'Dirección');
      break;
  }

  return missing;
}

function kindFromProduct(product: any): Kind {
  if (product.vehicleDetail) return 'vehiculos';
  if (product.propertyDetail) return 'inmobiliaria';
  if (product.serviceDetail) return 'servicios';
  if (product.jobDetail) return 'empleo';
  return 'MarketPlace';
}

function prefillForm(product: any): FormState {
  const media: MediaAsset[] =
    product.images
      ?.slice()
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map((i: any): MediaAsset | null => {
        const uri = resolveImage(i.url);
        if (!uri) return null;
        return {
          uri,
          type: i.type === 'video' ? 'video' : 'image',
          thumbnailUri: i.thumbnailUrl
            ? resolveImage(i.thumbnailUrl) ?? undefined
            : undefined,
        };
      })
      .filter(Boolean) ?? [];
  return {
    media,
    categoryId: product.category?.id,
    categoryLabel: product.category?.label,
    title: product.title ?? '',
    description: product.description ?? '',
    price: product.price ? String(product.price) : '',
    discount: product.discount ? String(product.discount) : '',
    condition: product.condition ?? '',
    city: product.city ?? '',
    brand: product.marketplaceDetail?.brand ?? product.vehicleDetail?.brand ?? '',
    model: product.marketplaceDetail?.model ?? product.vehicleDetail?.model ?? '',
    colors: (product.marketplaceDetail?.colors ?? product.vehicleDetail?.colors ?? []) as string[],
    operation: product.vehicleDetail?.operation ?? product.propertyDetail?.operation ?? '',
    year: product.vehicleDetail?.year ? String(product.vehicleDetail.year) : '',
    kilometrage: product.vehicleDetail?.kilometrage ? String(product.vehicleDetail.kilometrage) : '',
    transmission: product.vehicleDetail?.transmission ?? '',
    engine: product.vehicleDetail?.engine ?? '',
    bedrooms: product.propertyDetail?.bedrooms ? String(product.propertyDetail.bedrooms) : '',
    bathrooms: product.propertyDetail?.bathrooms ? String(product.propertyDetail.bathrooms) : '',
    floor: product.propertyDetail?.floor ? String(product.propertyDetail.floor) : '',
    surface: product.propertyDetail?.surface ? String(product.propertyDetail.surface) : '',
    address: product.propertyDetail?.address ?? '',
    offerType: product.serviceDetail?.offerType ?? '',
    link: product.jobDetail?.link ?? '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { isAuthenticated, user } = useAuth();
  const { profile } = useProfile();
  // `editId` from the /(tabs)/post?editId=… flow OR `id` when rendered by
  // the /edit-listing/[id] route. Same form, two entry points.
  const params = useLocalSearchParams<{ editId?: string; id?: string }>();
  const editId = params.editId || params.id;
  const isEdit = !!editId;
  const { product: editProduct, loading: loadingProduct } = useProduct(editId ?? '');
  const { create, loading: creating } = useCreateProduct();
  const { update, loading: updating } = useUpdateProduct();
  const { products: myProducts } = useProductsBySeller(user?.id ?? profile?.id ?? '');
  const publishing = isEdit ? updating : creating;
  const submittingRef = useRef(false);
  const [kind, setKind] = useState<Kind | null>(null);
  const [form, setForm] = useState<FormState>({ media: [] });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  // null = not uploading; 0-100 = uploading with that percent. Displayed on
  // the publish button in the preview modal so users know something's happening
  // during video uploads (they can take several seconds on mobile connections).
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const editPrefilled = useRef(false);

  const setField = (k: string, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (isEdit && editProduct && !editPrefilled.current) {
      editPrefilled.current = true;
      setKind(kindFromProduct(editProduct));
      setForm(prefillForm(editProduct));
    }
  }, [isEdit, editProduct]);

  // Intercept hardware / gesture back: reset kind to null instead of leaving
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (previewOpen) {
          setPreviewOpen(false);
          return true;
        }
        if (isEdit) {
          reset();
          return true;
        }
        if (kind) {
          setKind(null);
          setForm({ media: [] });
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [kind, previewOpen, isEdit])
  );

  const reset = () => {
    setKind(null);
    setForm({ media: [] });
    setPreviewOpen(false);
    setShowErrors(false);
    editPrefilled.current = false;
    if (isEdit) {
      // Edit was pushed on top of the caller (Perfil / Producto). Popping is
      // the correct return — leaves the caller intact instead of jumping to a
      // fresh Perfil tab that resets scroll.
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/profile' as any);
    } else {
      // Publish flow is on the Post tab — swap to Perfil without leaving the
      // form on the back stack, so a swipe-back doesn't re-open it.
      router.replace('/(tabs)/profile' as any);
    }
  };

  const PLAN_NAMES: Record<string, string> = { FREE: 'Gratis', STAR: 'Estrella', PREMIUM: 'Premium' };

  const onPublish = async () => {
    if (submittingRef.current) return;

    if (!isEdit) {
      // Server-provided limit for the *effective* plan (expired plans count
      // as FREE). Null means unlimited (PREMIUM).
      const plan = profile?.effectivePlan ?? profile?.plan ?? 'FREE';
      const limit = profile?.maxActiveProducts;
      if (limit != null && myProducts.length >= limit) {
        Alert.alert(
          'Límite de anuncios alcanzado',
          `Tu plan ${PLAN_NAMES[plan] ?? plan} permite hasta ${limit} anuncios activos. Mejora tu plan para publicar más.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ver planes', onPress: () => router.push('/plans') },
          ],
        );
        return;
      }
    }

    submittingRef.current = true;
    try {
      const assets: MediaAsset[] = form.media ?? [];
      setUploadPct(assets.length > 0 ? 0 : null);
      const uploaded =
        assets.length > 0
          ? await uploadMedia(assets, { onProgress: setUploadPct })
          : [];
      setUploadPct(null);

      const input: any = {
        title: form.title || 'Sin título',
        price: parseFloat(String(form.price || '0').replace(/\./g, '').replace(',', '.')),
        discount: form.discount ? parseInt(form.discount) : undefined,
        description: form.description,
        condition: form.condition,
        city: form.city,
        mediaItems: uploaded,
      };

      if (form.categoryId) input.categoryId = form.categoryId;

      const colorsArr: string[] | undefined =
        Array.isArray(form.colors) && form.colors.length > 0 ? form.colors : undefined;

      if (kind === 'MarketPlace' && (form.brand || form.model || colorsArr)) {
        input.marketplaceDetail = {
          brand: form.brand || undefined,
          model: form.model || undefined,
          colors: colorsArr,
        };
      } else if (kind === 'vehiculos') {
        input.vehicleDetail = {
          operation: form.operation || undefined,
          brand: form.brand || undefined,
          model: form.model || undefined,
          year: form.year ? parseInt(form.year) : undefined,
          kilometrage: form.kilometrage ? parseInt(form.kilometrage) : undefined,
          transmission: form.transmission || undefined,
          engine: form.engine || undefined,
          colors: colorsArr,
        };
      } else if (kind === 'inmobiliaria') {
        input.propertyDetail = {
          operation: form.operation || undefined,
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
          bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
          floor: form.floor ? parseInt(form.floor) : undefined,
          surface: form.surface ? parseInt(form.surface) : undefined,
          address: form.address || undefined,
        };
      } else if (kind === 'servicios') {
        input.serviceDetail = { offerType: form.offerType || undefined };
      } else if (kind === 'empleo') {
        input.jobDetail = { link: form.link || undefined };
      }

      if (isEdit) {
        await update(editId!, input);
        submittingRef.current = false;
        Alert.alert('Actualizado', 'Tu anuncio ha sido actualizado.', [
          { text: 'OK', onPress: reset },
        ]);
      } else {
        await create(input);
        submittingRef.current = false;
        Alert.alert('Publicado', 'Tu anuncio ha sido publicado.', [{ text: 'OK', onPress: reset }]);
      }
    } catch (err) {
      submittingRef.current = false;
      setUploadPct(null);
      Alert.alert('Error', getErrorMessage(err, isEdit ? 'No se pudo actualizar el anuncio.' : 'No se pudo publicar el anuncio.'));
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.root, { alignItems: 'center' as const, justifyContent: 'center' as const }]}>
        <View style={styles.authGate}>
          <View style={styles.authIconWrap}>
            <ShoppingBag size={48} color={colors.primary} strokeWidth={1.2} />
          </View>
          <Text style={styles.authTitle}>Publica tu anuncio</Text>
          <Text style={styles.authDesc}>
            Inicia sesión para publicar anuncios y empezar a vender en Bomelh.
          </Text>
          <RipplePress
            style={styles.authBtn}
            borderRadius={14}
            rippleColor="rgba(255,255,255,0.25)"
            onPress={() => router.push('/login')}>
            <LogIn size={18} color="#ffffff" strokeWidth={2} />
            <Text style={styles.authBtnText}>Iniciar sesión</Text>
          </RipplePress>
        </View>
      </View>
    );
  }

  if (isEdit && loadingProduct) {
    return (
      <View style={[styles.root, { alignItems: 'center' as const, justifyContent: 'center' as const }]}>
        <Spinner color={colors.primary} />
      </View>
    );
  }

  if (!kind) {
    return <KindPicker insets={insets} onPick={setKind} />;
  }

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: insets.top + 52 },
        ]}>
        <RipplePress
          style={styles.headerBtn}
          borderRadius={18}
          rippleColor={colors.primary + '18'}
          onPress={reset}>
          <ChevronLeft size={22} color={colors.onSurface} strokeWidth={2} />
        </RipplePress>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Editar anuncio' : `Publicar ${KIND_META[kind].label.toLowerCase()}`}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 110,
        }}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === 'ios' ? 40 : 80}
        enableOnAndroid>
        <PhotoPicker
          media={form.media ?? []}
          setMedia={(p) => setField('media', p)}
          showErrors={showErrors}
          maxPhotos={profile?.maxImagesPerProduct ?? MAX_PHOTOS}
        />

        <CategoryField form={form} setField={setField} kind={kind} showErrors={showErrors} />

        {kind === 'MarketPlace' && (
          <ProductoForm form={form} setField={setField} showErrors={showErrors} />
        )}
        {kind === 'vehiculos' && (
          <VehiculoForm form={form} setField={setField} showErrors={showErrors} />
        )}
        {kind === 'servicios' && (
          <ServicioForm form={form} setField={setField} showErrors={showErrors} />
        )}
        {kind === 'inmobiliaria' && (
          <InmobiliariaForm form={form} setField={setField} showErrors={showErrors} />
        )}
        {kind === 'empleo' && (
          <EmpleoForm form={form} setField={setField} showErrors={showErrors} />
        )}
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <RipplePress
          style={styles.publishBtn}
          borderRadius={14}
          rippleColor="rgba(255,255,255,0.25)"
          onPress={() => {
            const missing = getMissingFields(kind, form);
            if (missing.length > 0) {
              setShowErrors(true);
              Alert.alert(
                'Campos obligatorios',
                `Completa los siguientes campos:\n\n• ${missing.join('\n• ')}`,
              );
              return;
            }
            setPreviewOpen(true);
          }}>
          <Eye size={20} color="#ffffff" strokeWidth={2} />
          <Text style={styles.publishBtnText}>{isEdit ? 'Revisar y guardar' : 'Revisar y publicar'}</Text>
        </RipplePress>
      </View>

      {/* Full-sheet preview */}
      <PreviewModal
        visible={previewOpen}
        kind={kind}
        form={form}
        onClose={() => setPreviewOpen(false)}
        onPublish={onPublish}
        loading={publishing}
        uploadPct={uploadPct}
        isEdit={isEdit}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Kind picker
// ─────────────────────────────────────────────────────────────────────────────

function KindPicker({
  insets,
  onPick,
}: {
  insets: { top: number; bottom: number };
  onPick: (k: Kind) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Publicar anuncio</Text>
      <Text style={styles.pageSubtitle}>¿Qué quieres publicar hoy?</Text>

      <View style={styles.kindGrid}>
        {(Object.keys(KIND_META) as Kind[]).map((k) => {
          const meta = KIND_META[k];
          const Icon = meta.Icon;
          return (
            <RipplePress
              key={k}
              style={styles.kindTile}
              borderRadius={18}
              rippleColor={meta.color + '15'}
              onPress={() => onPick(k)}>
              <View
                style={[styles.kindIcon, { backgroundColor: meta.color + '15' }]}>
                <Icon size={26} color={meta.color} strokeWidth={1.6} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.kindLabel}>{meta.label}</Text>
                <Text style={styles.kindSubtitle}>{meta.subtitle}</Text>
              </View>
            </RipplePress>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-kind forms
// ─────────────────────────────────────────────────────────────────────────────

interface FormProps {
  form: FormState;
  setField: (k: string, v: any) => void;
  showErrors?: boolean;
}

const SPECIALIZED_LABELS = ['vehículos', 'inmobiliaria', 'servicios', 'empleo'];

const KIND_TO_CATEGORY: Record<Kind, string | null> = {
  vehiculos: 'vehículos',
  inmobiliaria: 'inmobiliaria',
  servicios: 'servicios',
  empleo: 'empleo',
  MarketPlace: null,
};

function filterTreeByKind(tree: any[], kind: Kind): any[] {
  const mapped = KIND_TO_CATEGORY[kind];
  if (mapped) {
    const match = tree.find((c: any) => c.label.toLowerCase() === mapped);
    return match ? [match] : [];
  }

  return tree.filter(
    (c: any) => !SPECIALIZED_LABELS.includes(c.label.toLowerCase()),
  );
}

/**
 * Category selector backed by the real `categoryTree` from the API.
 * Stores the chosen node's id in `categoryId` (required by the backend) and a
 * human label in `categoryLabel` (for the preview).
 */
function CategoryField({ form, setField, kind, showErrors }: FormProps & { kind: Kind; showErrors?: boolean }) {
  const { tree } = useCategoryTree();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const [root, setRoot] = useState<any>(null);

  const filtered = filterTreeByKind(tree, kind);

  const close = () => {
    setOpen(false);
    setRoot(null);
  };
  const choose = (categoryId: string, label: string) => {
    setField('categoryId', categoryId);
    setField('categoryLabel', label);
    close();
  };

  return (
    <Field label="Categoría" required error={showErrors && !form.categoryId}>
      <TouchableOpacity
        style={styles.select}
        activeOpacity={0.85}
        onPress={() => setOpen(true)}>
        <Text
          style={[styles.selectText, !form.categoryLabel && styles.selectPlaceholder]}
          numberOfLines={1}>
          {form.categoryLabel ?? 'Selecciona una categoría'}
        </Text>
        <ChevronDown size={18} color={colors.onSurfaceVariant} strokeWidth={1.8} />
      </TouchableOpacity>

      <SwipeableSheet visible={open} onClose={close} title={root ? root.label : 'Categoría'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: SCREEN_HEIGHT * 0.55 }}>
          {!root
            ? filtered.map((r: any) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.selectOption}
                  activeOpacity={0.7}
                  onPress={() =>
                    r.children?.length ? setRoot(r) : choose(r.id, r.label)
                  }>
                  <Text style={styles.selectOptionText}>{r.label}</Text>
                  {r.children?.length ? (
                    <ChevronRight
                      size={18}
                      color={colors.onSurfaceVariant}
                      strokeWidth={1.8}
                    />
                  ) : null}
                </TouchableOpacity>
              ))
            : (
              <>
                <TouchableOpacity
                  style={styles.selectOption}
                  activeOpacity={0.7}
                  onPress={() => setRoot(null)}>
                  <Text style={[styles.selectOptionText, { color: colors.primary }]}>
                    ‹ Volver
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectOption}
                  activeOpacity={0.7}
                  onPress={() => choose(root.id, root.label)}>
                  <Text style={styles.selectOptionText}>
                    Toda la categoría «{root.label}»
                  </Text>
                </TouchableOpacity>
                {root.children.map((c: any) => {
                  const active = form.categoryId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.selectOption}
                      activeOpacity={0.7}
                      onPress={() => choose(c.id, `${root.label} · ${c.label}`)}>
                      <Text
                        style={[
                          styles.selectOptionText,
                          active && styles.selectOptionTextActive,
                        ]}>
                        {c.label}
                      </Text>
                      {active && (
                        <Check size={18} color={colors.primary} strokeWidth={2.2} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
        </ScrollView>
      </SwipeableSheet>
    </Field>
  );
}

function ProductoForm({ form, setField, showErrors }: FormProps) {
  const e = showErrors;
  return (
    <>
      <Field label="Título" required error={e && !form.title}>
        <Input
          placeholder="Ej: iPhone 15 Pro 256GB"
          value={form.title}
          onChangeText={(v) => setField('title', v)}
        />
      </Field>

      <Field label="Descripción" required error={e && !form.description}>
        <Textarea
          placeholder="Detalles, motivo de venta, garantía…"
          value={form.description}
          onChangeText={(v) => setField('description', v)}
        />
      </Field>

      <RowFields>
        <Field label="Marca" style={{ flex: 1 }}>
          <Input
            placeholder="Iphone"
            value={form.brand}
            onChangeText={(v) => setField('brand', v)}
          />
        </Field>
        <Field label="Modelo" style={{ flex: 1 }}>
          <Input
            placeholder="15 Pro"
            value={form.model}
            onChangeText={(v) => setField('model', v)}
          />
        </Field>
      </RowFields>

      <Field label="Estado" required error={e && !form.condition}>
        <Select
          options={CONDITIONS_FULL}
          value={form.condition}
          onChange={(v) => setField('condition', v)}
          placeholder="Selecciona el estado"
          title="Estado del anuncio"
        />
      </Field>

      <Field label="Colores">
        <ColorField
          value={form.colors}
          onChange={(v) => setField('colors', v)}
        />
      </Field>

      <RowFields>
        <Field label="Precio (XAF)" style={{ flex: 1 }}>
          <Input
            placeholder="0"
            value={form.price}
            onChangeText={(v) => setField('price', onlyNumeric(v))}
            keyboardType="numeric"
          />
        </Field>
        <Field label="Descuento (%)" style={{ flex: 1 }}>
          <Input
            placeholder="0"
            value={form.discount}
            onChangeText={(v) => setField('discount', onlyNumeric(v))}
            keyboardType="numeric"
            maxLength={2}
          />
        </Field>
      </RowFields>

      <Field label="Ubicación (Ciudad)" required error={e && !form.city}>
        <Input
          placeholder="Ej: Malabo"
          value={form.city}
          onChangeText={(v) => setField('city', v)}
        />
      </Field>
    </>
  );
}

function VehiculoForm({ form, setField, showErrors }: FormProps) {
  const e = showErrors;
  return (
    <>
      <Field label="Título" required error={e && !form.title}>
        <Input
          placeholder="Ej: Toyota Hilux 2020 4x4"
          value={form.title}
          onChangeText={(v) => setField('title', v)}
        />
      </Field>

      <Field label="Descripción" required error={e && !form.description}>
        <Textarea
          placeholder="Kilometraje, mantenimiento, equipamiento…"
          value={form.description}
          onChangeText={(v) => setField('description', v)}
        />
      </Field>

      <RowFields>
        <Field label="Operación" style={{ flex: 1 }}>
          <Select
            options={PROPERTY_OPERATIONS}
            value={form.operation}
            onChange={(v) => setField('operation', v)}
            placeholder="Venta o alquiler"
            title="Operación"
          />
        </Field>
        <Field label="Estado" required error={e && !form.condition} style={{ flex: 1 }}>
          <Select
            options={CONDITIONS_VEHICLE}
            value={form.condition}
            onChange={(v) => setField('condition', v)}
            placeholder="Estado"
            title="Estado del vehículo"
          />
        </Field>
      </RowFields>

      <RowFields>
        <Field label="Marca" style={{ flex: 1 }}>
          <Input
            placeholder="Toyota"
            value={form.brand}
            onChangeText={(v) => setField('brand', v)}
          />
        </Field>
        <Field label="Modelo" style={{ flex: 1 }}>
          <Input
            placeholder="Hilux"
            value={form.model}
            onChangeText={(v) => setField('model', v)}
          />
        </Field>
      </RowFields>

      <RowFields>
        <Field label="Año" style={{ flex: 1 }}>
          <Input
            placeholder="2020"
            value={form.year}
            onChangeText={(v) => setField('year', onlyNumeric(v))}
            keyboardType="numeric"
            maxLength={4}
          />
        </Field>
        <Field label="Kilometraje" style={{ flex: 1 }}>
          <Input
            placeholder="0"
            value={form.kilometrage}
            onChangeText={(v) => setField('kilometrage', onlyNumeric(v))}
            keyboardType="numeric"
          />
        </Field>
      </RowFields>

      <RowFields>
        <Field label="Cambio" required error={e && !form.transmission} style={{ flex: 1 }}>
          <Select
            options={TRANSMISSION_TYPES}
            value={form.transmission}
            onChange={(v) => setField('transmission', v)}
            placeholder="Tipo"
            title="Cambio"
          />
        </Field>
        <Field label="Motor" required error={e && !form.engine} style={{ flex: 1 }}>
        <Select
          options={ENGINE_TYPES}
          value={form.engine}
          onChange={(v) => setField('engine', v)}
          placeholder="Tipo"
          title="Motor"
        />
        </Field>
      </RowFields>

      <Field label="Colores">
        <ColorField
          value={form.colors}
          onChange={(v) => setField('colors', v)}
        />
      </Field>

      <RowFields>
        <Field label="Precio (XAF)" style={{ flex: 1 }}>
          <Input
            placeholder="0"
            value={form.price}
            onChangeText={(v) => setField('price', onlyNumeric(v))}
            keyboardType="numeric"
          />
        </Field>
        <Field label="Descuento (%)" style={{ flex: 1 }}>
          <Input
            placeholder="0"
            value={form.discount}
            onChangeText={(v) => setField('discount', onlyNumeric(v))}
            keyboardType="numeric"
            maxLength={2}
          />
        </Field>
      </RowFields>

      <Field label="Ubicación (Ciudad)" required error={e && !form.city}>
        <Input
          placeholder="Ej: Malabo"
          value={form.city}
          onChangeText={(v) => setField('city', v)}
        />
      </Field>
    </>
  );
}

function ServicioForm({ form, setField, showErrors }: FormProps) {
  const e = showErrors;
  return (
    <>
     <Field label="Título" required error={e && !form.title}>
        <Input
          placeholder="Ej: Electricista a domicilio"
          value={form.title}
          onChangeText={(v) => setField('title', v)}
        />
      </Field>

      <Field label="Descripción" required error={e && !form.description}>
        <Textarea
          placeholder="Experiencia, horarios, qué incluye el servicio…"
          value={form.description}
          onChangeText={(v) => setField('description', v)}
        />
      </Field>

      <Field label="Modalidad" required error={e && !form.offerType}>
        <Select
          options={SERVICE_OPTIONS}
          value={form.offerType}
          onChange={(v) => setField('offerType', v)}
          placeholder="¿Buscas u ofreces?"
          title="Modalidad"
        />
      </Field>


      <RowFields>
        <Field label="Precio (XAF)" style={{ flex: 1 }}>
          <Input
            placeholder="0"
            value={form.price}
            onChangeText={(v) => setField('price', onlyNumeric(v))}
            keyboardType="numeric"
          />
        </Field>
        <Field label="Descuento (%)" style={{ flex: 1 }}>
          <Input
            placeholder="0"
            value={form.discount}
            onChangeText={(v) => setField('discount', onlyNumeric(v))}
            keyboardType="numeric"
            maxLength={2}
          />
        </Field>
      </RowFields>

      <Field label="Ubicación (Ciudad)" required error={e && !form.city}>
        <Input
          placeholder="Ej: Malabo"
          value={form.city}
          onChangeText={(v) => setField('city', v)}
        />
      </Field>
    </>
  );
}

function InmobiliariaForm({ form, setField, showErrors }: FormProps) {
  const e = showErrors;
  return (
    <>
    <Field label="Título" required error={e && !form.title}>
        <Input
          placeholder="Ej: Piso 3 hab. centro Malabo"
          value={form.title}
          onChangeText={(v) => setField('title', v)}
        />
      </Field>

      <Field label="Descripción" required error={e && !form.description}>
        <Textarea
          placeholder="Superficie, planta, año, características…"
          value={form.description}
          onChangeText={(v) => setField('description', v)}
        />
      </Field>

      <Field label="Operación">
        <Select
          options={PROPERTY_OPERATIONS}
          value={form.operation}
          onChange={(v) => setField('operation', v)}
          placeholder="Venta o alquiler"
          title="Operación"
        />
      </Field>

      <Field label="Estado" required error={e && !form.condition}>
        <Select
          options={PROPERTY_CONDITIONS}
          value={form.condition}
          onChange={(v) => setField('condition', v)}
          placeholder="Selecciona el estado"
          title="Estado del inmueble"
        />
      </Field>

      <RowFields>
        <Field label="Habitaciones" required error={e && (!form.bedrooms || form.bedrooms <= 0)} style={{ flex: 1 }}>
          <Stepper
            value={form.bedrooms ?? 0}
            onChange={(v) => setField('bedrooms', v)}
          />
        </Field>
        <Field label="Baños" style={{ flex: 1 }}>
          <Stepper
            value={form.bathrooms ?? 0}
            onChange={(v) => setField('bathrooms', v)}
          />
        </Field>
      </RowFields>

      <RowFields>
        <Field label="Planta" style={{ flex: 1 }}>
          <Stepper
            value={form.floor ?? 0}
            onChange={(v) => setField('floor', v)}
          />
        </Field>
        <Field label="Superficie (m²)" style={{ flex: 1 }}>
          <Input
            placeholder="0"
            value={form.surface}
            onChangeText={(v) => setField('surface', onlyNumeric(v))}
            keyboardType="numeric"
          />
        </Field>
      </RowFields>

      <RowFields>
        <Field label="Precio (XAF)" style={{ flex: 1 }}>
          <Input
            placeholder="0"
            value={form.price}
            onChangeText={(v) => setField('price', onlyNumeric(v))}
            keyboardType="numeric"
          />
        </Field>
        <Field label="Descuento (%)" style={{ flex: 1 }}>
          <Input
            placeholder="0"
            value={form.discount}
            onChangeText={(v) => setField('discount', onlyNumeric(v))}
            keyboardType="numeric"
            maxLength={2}
          />
        </Field>
      </RowFields>

      <Field label="Dirección" required error={e && !form.address}>
        <Input
          placeholder="Calle, barrio, referencia"
          value={form.address}
          onChangeText={(v) => setField('address', v)}
        />
      </Field>

      <Field label="Ubicación (Ciudad)" required error={e && !form.city}>
        <Input
          placeholder="Ej: Malabo"
          value={form.city}
          onChangeText={(v) => setField('city', v)}
        />
      </Field>
    </>
  );
}

function EmpleoForm({ form, setField, showErrors }: FormProps) {
  const e = showErrors;
  return (
    <>
      <Field label="Título" required error={e && !form.title}>
        <Input
          placeholder="Ej: Camarero/a a media jornada"
          value={form.title}
          onChangeText={(v) => setField('title', v)}
        />
      </Field>

      <Field label="Descripción" required error={e && !form.description}>
        <Textarea
          placeholder="Requisitos, salario, horarios, contacto…"
          value={form.description}
          onChangeText={(v) => setField('description', v)}
        />
      </Field>

      <Field label="Enlace web">
        <Input
          placeholder="Ej: https://eglng.com/es/careers"
          value={form.link}
          onChangeText={(v) => setField('link', v)}
        />
      </Field>

      <Field label="Ubicación (Ciudad)" required error={e && !form.city}>
        <Input
          placeholder="Ej: Malabo"
          value={form.city}
          onChangeText={(v) => setField('city', v)}
        />
      </Field>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview modal
// ─────────────────────────────────────────────────────────────────────────────

type PreviewField = { label: string; value: string; swatches?: string[] };

function getPreviewFields(kind: Kind, form: FormState): PreviewField[] {
  const out: PreviewField[] = [];
  const add = (label: string, raw: unknown) => {
    if (raw === undefined || raw === null || raw === '') return;
    out.push({ label, value: String(raw) });
  };
  const addColors = (raw: unknown) => {
    if (!Array.isArray(raw) || raw.length === 0) return;
    out.push({
      label: raw.length === 1 ? 'Color' : 'Colores',
      value: raw.join(', '),
      swatches: raw as string[],
    });
  };
  const fmtPrice = (v: unknown) =>
    v ? fmtPriceCompact(Number(v)) : undefined;

  add('Categoría', form.categoryLabel);

  switch (kind) {
    case 'MarketPlace':
      add('Título', form.title);
      add('Marca', form.brand);
      add('Modelo', form.model);
      add('Estado', form.condition);
      addColors(form.colors);
      add('Precio', fmtPrice(form.price));
      add('Descuento', form.discount ? `${form.discount}%` : undefined);
      add('Ubicación (Ciudad)', form.city);
      add('Descripción', form.description);
      break;
    case 'vehiculos':
      add('Operación', form.operation);
      add('Marca', form.brand);
      add('Modelo', form.model);
      add('Año', form.year);
      add('Kilometraje', form.kilometrage);
      add('Cambio', form.transmission);
      add('Motor', form.engine);
      add('Estado', form.condition);
      addColors(form.colors);
      add('Título', form.title);
      add('Precio', fmtPrice(form.price));
      add('Descuento', form.discount ? `${form.discount}%` : undefined);
      add('Ubicación (Ciudad)', form.city);
      add('Descripción', form.description);
      break;
    case 'servicios':
      add('Modalidad', form.offerType);
      add('Título', form.title);
      add('Precio', fmtPrice(form.price));
      add('Ubicación (Ciudad)', form.city);
      add('Descripción', form.description);
      break;
    case 'inmobiliaria':
      add('Operación', form.operation);
      add('Estado', form.condition);
      add('Habitaciones', form.bedrooms > 0 ? form.bedrooms : undefined);
      add('Baños', form.bathrooms > 0 ? form.bathrooms : undefined);
      add('Planta', form.floor > 0 ? form.floor : undefined);
      add('Superficie', form.surface ? `${form.surface} m²` : undefined);
      add('Título', form.title);
      add('Precio', fmtPrice(form.price));
      add('Dirección', form.address);
      add('Ubicación (Ciudad)', form.city);
      add('Descripción', form.description);
      break;
    case 'empleo':
      add('Título', form.title);
      add('Enlace web', form.link);
      add('Ubicación (Ciudad)', form.city);
      add('Descripción', form.description);
      break;
  }
  return out;
}

const PHOTO_WIDTH = Dimensions.get('window').width;

function PreviewModal({
  visible,
  kind,
  form,
  onClose,
  onPublish,
  loading,
  uploadPct,
  isEdit,
}: {
  visible: boolean;
  kind: Kind;
  form: FormState;
  onClose: () => void;
  onPublish: () => void;
  loading?: boolean;
  uploadPct?: number | null;
  isEdit?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (visible) {
      setActivePhoto(0);
      slideAnim.setValue(SCREEN_HEIGHT);
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 22,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const media: MediaAsset[] = form.media ?? [];
  const fields = getPreviewFields(kind, form);
  const meta = KIND_META[kind];
  const KindIcon = meta.Icon;

  const descField = fields.find((f) => f.label === 'Descripción');
  const shortFields = fields.filter(
    (f) => f.label !== 'Descripción' && f.label !== 'Título' && f.label !== 'Ciudad'
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}>
      <Animated.View
        style={[styles.pvRoot, { transform: [{ translateY: slideAnim }] }]}>
        {/* Header */}
        <View style={[styles.pvHeader, { paddingTop: insets.top }]}>
          <RipplePress
            style={styles.headerBtn}
            borderRadius={18}
            rippleColor={colors.primary + '18'}
            onPress={dismiss}>
            <ChevronLeft size={22} color={colors.onSurface} strokeWidth={2} />
          </RipplePress>
          <Text style={styles.pvHeaderTitle}>Revisar anuncio</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          {/* Photo carousel */}
          {media.length > 0 ? (
            <View>
              <FlatList
                data={media}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(
                    e.nativeEvent.contentOffset.x / PHOTO_WIDTH
                  );
                  setActivePhoto(idx);
                }}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item }) => {
                  const previewUri = item.type === 'video'
                    ? item.thumbnailUri ?? item.uri
                    : item.uri;
                  return (
                    <View>
                      <Image
                        source={{ uri: previewUri }}
                        style={styles.pvPhoto}
                        resizeMode="cover"
                      />
                      {item.type === 'video' && (
                        <View style={styles.pvPlayOverlay} pointerEvents="none">
                          <Play size={40} color="#ffffff" strokeWidth={2.4} fill="#ffffff" />
                        </View>
                      )}
                    </View>
                  );
                }}
              />
              {media.length > 1 && (
                <View style={styles.pvDots}>
                  {media.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.pvDot,
                        i === activePhoto && styles.pvDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.pvNoPhoto}>
              <ImageIcon
                size={40}
                color={colors.onSurfaceVariant + '44'}
                strokeWidth={1.2}
              />
              <Text style={styles.pvNoPhotoText}>Sin fotos</Text>
            </View>
          )}

          {/* Kind badge */}
          <View style={styles.pvBadgeRow}>
            <View style={[styles.pvBadge, { backgroundColor: meta.color + '15' }]}>
              <KindIcon size={16} color={meta.color} strokeWidth={1.8} />
              <Text style={[styles.pvBadgeText, { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>
          </View>

          {/* Title + price hero */}
          {form.title ? (
            <Text style={styles.pvTitle}>{form.title}</Text>
          ) : null}
          {form.price ? (() => {
            const raw = Number(form.price);
            const disc = form.discount ? Number(form.discount) : 0;
            const hasDiscount = disc > 0 && disc < 100;
            const final = hasDiscount ? Math.round(raw * (1 - disc / 100)) : raw;
            return (
              <View style={styles.pvPriceRow}>
                <Text style={styles.pvPrice}>
                  {fmtPriceCompact(final)}
                </Text>
                {hasDiscount && (
                  <>
                    <Text style={styles.pvPriceOriginal}>
                      {fmtPriceCompact(raw)}
                    </Text>
                    <View style={styles.pvDiscountBadge}>
                      <Text style={styles.pvDiscountText}>-{disc}%</Text>
                    </View>
                  </>
                )}
              </View>
            );
          })() : null}
          {form.city ? (
            <View style={styles.pvLocationRow}>
              <MapPin
                size={14}
                color={colors.onSurfaceVariant}
                strokeWidth={1.8}
              />
              <Text style={styles.pvLocationText}>{form.city}</Text>
            </View>
          ) : null}

          {/* Description */}
          {descField ? (
            <View style={styles.pvDescCard}>
              <Text style={styles.pvSectionLabel}>Descripción</Text>
              <Text style={styles.pvDescText}>{descField.value}</Text>
            </View>
          ) : null}

          {/* Divider */}
          <View style={styles.pvDivider} />

          {/* Detail fields */}
          {shortFields.length > 0 && (
            <View style={styles.pvFieldsCard}>
              <Text style={styles.pvSectionLabel}>Detalles del anuncio</Text>
              {shortFields.map((f, i) => (
                <View
                  key={f.label}
                  style={[
                    styles.pvFieldRow,
                    i === shortFields.length - 1 && { borderBottomWidth: 0 },
                  ]}>
                  <Text style={styles.pvFieldLabel}>{f.label}</Text>
                  {f.swatches ? (
                    <View style={styles.pvColorValue}>
                      {f.swatches.map((c, si) => (
                        <View
                          key={`${c}-${si}`}
                          style={[styles.colorSwatchSm, { backgroundColor: c }]}
                        />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.pvFieldValue} numberOfLines={2}>
                      {f.value}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Sticky footer */}
        <View
          style={[
            styles.pvFooter,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}>
          {(() => {
            // The button is busy from the moment the upload starts until the
            // mutation resolves. `loading` alone doesn't cover the upload
            // phase (create/update hasn't been called yet), so combine both.
            const busy = loading || uploadPct != null;
            return (
          <RipplePress
            style={[styles.publishBtn, busy && { opacity: 0.5 }]}
            borderRadius={14}
            rippleColor="rgba(255,255,255,0.25)"
            onPress={() => {
              if (!busy) onPublish();
            }}>
            {uploadPct != null ? (
              <Text style={styles.publishBtnText}>
                Subiendo… {uploadPct}%
              </Text>
            ) : loading ? (
              <Spinner color="#ffffff" />
            ) : (
              <Text style={styles.publishBtnText}>{isEdit ? 'Guardar cambios' : 'Publicar anuncio'}</Text>
            )}
          </RipplePress>
            );
          })()}
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared widgets
// ─────────────────────────────────────────────────────────────────────────────

function Field({
  label,
  children,
  style,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  style?: any;
  required?: boolean;
  error?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[{ marginBottom: 18 }, style]}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
      <View style={error ? styles.fieldError : undefined}>
        {children}
      </View>
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <TextInput
      {...props}
      style={[styles.input, props.style]}
      placeholderTextColor={colors.onSurfaceVariant + '88'}
    />
  );
}

function Textarea({
  value,
  onChangeText,
  placeholder,
}: {
  value?: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const len = (value ?? '').length;
  return (
    <View>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant + '88'}
        multiline
        maxLength={500}
      />
      <Text style={styles.counter}>{len}/500</Text>
    </View>
  );
}

function Select({
  options,
  value,
  onChange,
  placeholder,
  title,
}: {
  options: string[];
  value?: string;
  onChange: (v: string | undefined) => void;
  placeholder?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <>
      <TouchableOpacity
        style={styles.select}
        activeOpacity={0.85}
        onPress={() => setOpen(true)}>
        <Text
          style={[
            styles.selectText,
            !value && styles.selectPlaceholder,
          ]}
          numberOfLines={1}>
          {value ?? placeholder ?? 'Seleccionar'}
        </Text>
        <ChevronDown
          size={18}
          color={colors.onSurfaceVariant}
          strokeWidth={1.8}
        />
      </TouchableOpacity>

      <SwipeableSheet visible={open} onClose={() => setOpen(false)} title={title}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: SCREEN_HEIGHT * 0.55 }}>
          {options.map((opt) => {
            const active = value === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={styles.selectOption}
                activeOpacity={0.7}
                onPress={() => {
                  onChange(opt);
                  setOpen(false);
                }}>
                <Text
                  style={[
                    styles.selectOptionText,
                    active && styles.selectOptionTextActive,
                  ]}>
                  {opt}
                </Text>
                {active && (
                  <Check
                    size={18}
                    color={colors.primary}
                    strokeWidth={2.2}
                  />
                )}
              </TouchableOpacity>
            );
          })}
          {value && (
            <TouchableOpacity
              style={[styles.selectOption, { justifyContent: 'center' }]}
              activeOpacity={0.7}
              onPress={() => {
                onChange(undefined);
                setOpen(false);
              }}>
              <Text style={styles.selectClearText}>Quitar selección</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SwipeableSheet>
    </>
  );
}

const MAX_COLORS = 6;

function ColorField({
  value,
  onChange,
  max = MAX_COLORS,
}: {
  value?: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  const { colors: themeColors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string>('#FF3B30');

  const list = value ?? [];
  const canAdd = list.length < max;

  const openPicker = () => {
    setCurrent('#FF3B30');
    setOpen(true);
  };

  const addCurrent = () => {
    const hex = (current || '').toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(hex)) {
      setOpen(false);
      return;
    }
    if (list.map((c) => c.toUpperCase()).includes(hex) || list.length >= max) {
      setOpen(false);
      return;
    }
    onChange([...list, hex]);
    setOpen(false);
  };

  const removeAt = (i: number) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <>
      <View style={styles.colorList}>
        {list.map((c, i) => (
          <View key={`${c}-${i}`} style={styles.colorChip}>
            <View style={[styles.colorSwatchSm, { backgroundColor: c }]} />
            <Text style={styles.colorChipText}>{c.toUpperCase()}</Text>
            <TouchableOpacity
              style={styles.colorChipX}
              onPress={() => removeAt(i)}
              activeOpacity={0.85}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <X size={12} color="#ffffff" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        ))}
        {canAdd && (
          <TouchableOpacity
            style={styles.colorAdd}
            activeOpacity={0.85}
            onPress={openPicker}>
            <Plus size={16} color={themeColors.primary} strokeWidth={2} />
            <Text style={styles.colorAddText}>
              {list.length === 0 ? 'Añadir color' : 'Otro'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {list.length >= max && (
        <Text style={styles.colorMaxHint}>Máximo {max} colores</Text>
      )}

      <SwipeableSheet visible={open} onClose={() => setOpen(false)} title="Añadir color">
        <ColorPicker value={current} onChange={setCurrent} />
        <RipplePress
          style={styles.colorConfirmBtn}
          borderRadius={12}
          rippleColor="rgba(255,255,255,0.25)"
          onPress={addCurrent}>
          <Text style={styles.colorConfirmBtnText}>Añadir a la lista</Text>
        </RipplePress>
      </SwipeableSheet>
    </>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.stepper}>
      <RipplePress
        style={styles.stepperBtn}
        borderRadius={10}
        rippleColor={colors.primary + '18'}
        onPress={() => onChange(Math.max(0, value - 1))}>
        <Minus size={16} color={colors.onSurface} strokeWidth={2} />
      </RipplePress>
      <Text style={styles.stepperValue}>{value}</Text>
      <RipplePress
        style={styles.stepperBtn}
        borderRadius={10}
        rippleColor={colors.primary + '18'}
        onPress={() => onChange(value + 1)}>
        <Plus size={16} color={colors.onSurface} strokeWidth={2} />
      </RipplePress>
    </View>
  );
}

function RowFields({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;
}

function PhotoPicker({
  media,
  setMedia,
  showErrors,
  maxPhotos = MAX_PHOTOS,
}: {
  media: MediaAsset[];
  setMedia: (p: MediaAsset[]) => void;
  showErrors?: boolean;
  maxPhotos?: number;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const addAssets = async (assets: ImagePickerAsset[]) => {
    const room = maxPhotos - media.length;
    const accepted: MediaAsset[] = [];
    let tooBig = false;
    for (const a of assets.slice(0, room)) {
      // Videos get a higher ceiling since they naturally weigh more than an
      // image; anything over 50 MB is rejected so the presigned PUT stays
      // within reasonable time on a mobile connection.
      const isVideo = a.type === 'video';
      const maxBytes = (isVideo ? 50 : MAX_PHOTO_MB) * 1024 * 1024;
      if (a.fileSize != null && a.fileSize > maxBytes) {
        tooBig = true;
        continue;
      }
      let thumbnailUri: string | undefined;
      if (isVideo) {
        thumbnailUri = await generateVideoThumbnail(a.uri);
      }
      accepted.push({
        uri: a.uri,
        type: isVideo ? 'video' : 'image',
        thumbnailUri,
      });
    }
    if (accepted.length) setMedia([...media, ...accepted]);
    if (tooBig) {
      Alert.alert(
        'Archivo demasiado grande',
        `Las fotos no pueden pesar más de ${MAX_PHOTO_MB} MB y los vídeos no más de 50 MB.`,
      );
    } else if (assets.length > room) {
      Alert.alert(
        'Límite alcanzado',
        `Puedes subir un máximo de ${maxPhotos} archivos por anuncio.`,
      );
    }
  };

  const pickFromLibrary = async () => {
    if (!ImagePicker) {
      Alert.alert('Función no disponible', 'Actualiza la app para añadir archivos.');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso necesario', 'Concede acceso a tus fotos para añadir archivos.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      // Videos temporarily disabled — only images for now. The rest of the
      // media pipeline (upload, DB, gallery) still supports videos, so
      // re-enabling later is a one-line change here.
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: maxPhotos - media.length,
      quality: 0.7,
    });
    if (!res.canceled) await addAssets(res.assets);
  };

  const takePhoto = async () => {
    if (!ImagePicker) {
      Alert.alert('Función no disponible', 'Actualiza la app para añadir fotos.');
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso necesario', 'Concede acceso a la cámara para hacer una foto.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) await addAssets(res.assets);
  };

  const addPhoto = () => {
    if (media.length >= maxPhotos) {
      Alert.alert('Límite alcanzado', `Puedes subir un máximo de ${maxPhotos} archivos por anuncio.`);
      return;
    }
    Alert.alert('Añadir', undefined, [
      { text: 'Hacer una foto', onPress: takePhoto },
      { text: 'Elegir de la galería', onPress: pickFromLibrary },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const removePhoto = (i: number) =>
    setMedia(media.filter((_, idx) => idx !== i));

  return (
    <View style={{ marginBottom: 22 }}>
      <View style={styles.photoHeader}>
        <Text style={styles.fieldLabel}>
          Fotos<Text style={{ color: colors.error }}> *</Text>
        </Text>
        <Text style={[styles.photoCount, showErrors && media.length === 0 && { color: colors.error }]}>
          {media.length}/{maxPhotos}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
        {media.map((asset, i) => {
          // Videos show their generated thumbnail when available so the tile
          // isn't a blank grey square. Falls back to the video URI which some
          // platforms can render as a first-frame preview via <Image>.
          const previewUri = asset.type === 'video'
            ? asset.thumbnailUri ?? asset.uri
            : asset.uri;
          return (
            <View key={`${asset.uri}-${i}`} style={styles.photoThumb}>
              <Image source={{ uri: previewUri }} style={styles.photoImage} />
              {asset.type === 'video' && (
                <View style={styles.videoPlayOverlay} pointerEvents="none">
                  <Play size={22} color="#ffffff" strokeWidth={2.4} fill="#ffffff" />
                </View>
              )}
              {i === 0 && (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverBadgeText}>Portada</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() => removePhoto(i)}
                activeOpacity={0.85}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <X size={14} color="#ffffff" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          );
        })}
        {media.length < maxPhotos && (
          <TouchableOpacity
            style={[styles.photoAdd, showErrors && media.length === 0 && { borderColor: colors.error }]}
            activeOpacity={0.85}
            onPress={addPhoto}>
            <Camera size={22} color={colors.primary} strokeWidth={1.5} />
            <Text style={styles.photoAddText}>Añadir</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function onlyNumeric(s: string) {
  return s.replace(/[^\d]/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  headerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  pageTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 28,
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 6,
    marginBottom: 28,
  },
  // Kind picker
  kindGrid: {
    gap: 12,
  },
  kindTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 18,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  kindIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindLabel: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  kindSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  // Field
  fieldLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  fieldError: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  counter: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant + '99',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  // Select (closed button)
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    minHeight: 48,
  },
  selectText: {
    flex: 1,
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
  },
  selectPlaceholder: {
    color: colors.onSurfaceVariant + '88',
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '33',
  },
  selectOptionText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
  },
  selectOptionTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: colors.primary,
  },
  selectClearText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.error,
  },
  // Color swatch (used inside ColorField button)
  colorSwatchSm: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  colorList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    paddingRight: 26,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    position: 'relative' as const,
  },
  colorChipText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
  colorChipX: {
    position: 'absolute' as const,
    right: 4,
    top: 4,
    bottom: 4,
    width: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: colors.primary + '66',
    backgroundColor: colors.primary + '0d',
  },
  colorAddText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  colorMaxHint: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant + '99',
    marginTop: 6,
  },
  colorConfirmBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: 4,
    marginBottom: 8,
  },
  colorConfirmBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  stepperValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: colors.onSurface,
  },
  // Photos
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  photoCount: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.onSurfaceVariant + '99',
  },
  photoThumb: {
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 9,
    color: '#ffffff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  pvPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  photoAdd: {
    width: 96,
    height: 96,
    borderRadius: 14,
    borderWidth: 1.4,
    borderColor: colors.primary + '55',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary + '08',
  },
  photoAddText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  // Preview modal
  pvRoot: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  pvHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
  },
  pvHeaderTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  pvPhoto: {
    width: Dimensions.get('window').width,
    height: 280,
    backgroundColor: colors.surfaceContainerLow,
  },
  pvDots: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 12,
  },
  pvDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.outlineVariant + '66',
  },
  pvDotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  pvNoPhoto: {
    height: 180,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
  },
  pvNoPhotoText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant + '88',
  },
  pvBadgeRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pvBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pvBadgeText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
  },
  pvTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 22,
    color: colors.onSurface,
    letterSpacing: -0.4,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  pvPriceRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  pvPrice: {
    fontFamily: 'Manrope-Bold',
    fontSize: 28,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  pvPriceOriginal: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant + '80',
    textDecorationLine: 'line-through' as const,
  },
  pvDiscountBadge: {
    backgroundColor: colors.error + '1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pvDiscountText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: colors.error,
  },
  pvLocationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  pvLocationText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  pvDivider: {
    height: 0.5,
    backgroundColor: colors.outlineVariant + '44',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  pvFieldsCard: {
    marginHorizontal: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  pvSectionLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: colors.onSurfaceVariant + 'aa',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  pvFieldRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '22',
  },
  pvFieldLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  pvFieldValue: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    flex: 1,
    textAlign: 'right' as const,
  },
  pvColorValue: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    gap: 8,
    flex: 1,
  },
  pvDescCard: {
    marginHorizontal: 16,
    marginTop: 16,
    fontFamily: 'Manrope-SemiBold',
    fontSize: 17,
    color: colors.onSurface,
    lineHeight: 22,
    marginBottom: 10,
  },
  pvDescText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurface,
    lineHeight: 21,
  },
  pvFooter: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '4d',
  },
  // Footer
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '4d',
  },
  publishBtn: {
    height: 52,
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
  publishBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  authGate: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
    gap: 14,
  },
  authIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary + '0f',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  authTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 22,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  authDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
    textAlign: 'center' as const,
    lineHeight: 22,
    maxWidth: 280,
  },
  authBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: colors.primary,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  authBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});
