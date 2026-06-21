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
  KeyboardAvoidingView,
  Alert,
  Dimensions,
  BackHandler,
  Modal,
  Animated,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
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
} from 'lucide-react-native';
import { colors, useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';
import SwipeableSheet from '@/components/SwipeableSheet';
import { useAuth } from '@/hooks/useAuth';
import { useCreateProduct } from '@/hooks/useProducts';
import { useCategoryTree } from '@/hooks/useCategories';
import { uploadImages } from '@/lib/upload';
import Spinner from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';

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
  inmobiliaria: {
    label: 'Inmobiliaria',
    subtitle: 'Pisos, casas, locales y terrenos',
    Icon: Building2,
    color: colors.tertiary,
  },
  empleo: {
    label: 'Empleo',
    subtitle: 'Publica una oferta o búscala',
    Icon: Briefcase,
    color: colors.error,
  },
};

const CITIES = [
  'Malabo',
  'Bata',
  'Ebibeyin',
  'Mongomo',
  'Luba',
  'Aconibe',
  'Evinayong',
];

const CONDITIONS_FULL = [
  'Sin abrir',
  'Nuevo',
  'Como nuevo',
  'En buen estado',
  'En condiciones aceptables',
  'Lo ha dado todo',
];

const PROPERTY_CONDITIONS = ['Obra nueva', 'Buen estado', 'A reformar'];
const PROPERTY_OPERATIONS = ['Venta', 'Alquiler'];
const PROPERTY_TYPES = [
  'Piso',
  'Casa',
  'Habitación',
  'Local/Oficina',
  'Garaje',
  'Terreno',
  'Trastero',
];

const VEHICLE_TYPES = [
  'Coche',
  'Moto/Bicicleta',
  'Camión',
  'Herramientas y accesorios',
  'Alquiler de vehículos',
  'Barco',
];
const ENGINE_TYPES = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'GLP'];
const TRANSMISSION_TYPES = ['Manual', 'Automático'];

const SERVICE_CATEGORIES = [
  'Limpieza',
  'Mudanzas',
  'Reparación',
  'Belleza',
  'Clases particulares',
  'Eventos',
  'Negocios y gestiones comerciales',
  'Salud',
  'Tecnología',
  'Otros',
];
const SERVICE_OPTIONS = ['Oferta', 'Demanda'];

const JOB_CATEGORIES = ['Oferta de empleo', 'Busco empleo', 'Practicas'];

const STOCK_PHOTOS = [
  'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/812264/pexels-photo-812264.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
];

type FormState = Record<string, any>;

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { isAuthenticated } = useAuth();
  const { create, loading: publishing } = useCreateProduct();
  const [kind, setKind] = useState<Kind | null>(null);
  const [form, setForm] = useState<FormState>({ photos: [] });
  const [previewOpen, setPreviewOpen] = useState(false);

  const setField = (k: string, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Intercept hardware / gesture back: reset kind to null instead of leaving
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (previewOpen) {
          setPreviewOpen(false);
          return true;
        }
        if (kind) {
          setKind(null);
          setForm({ photos: [] });
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [kind, previewOpen])
  );

  const reset = () => {
    setKind(null);
    setForm({ photos: [] });
    setPreviewOpen(false);
  };

  const onPublish = async () => {
    if (!form.categoryId) {
      Alert.alert('Falta la categoría', 'Selecciona una categoría para tu anuncio.');
      return;
    }
    try {
      let imageUrls: string[] = [];
      if (form.photos && form.photos.length > 0) {
        const realPhotos = form.photos.filter((p: string) => !p.startsWith('https://images.pexels'));
        if (realPhotos.length > 0) {
          imageUrls = await uploadImages(realPhotos);
        } else {
          imageUrls = form.photos;
        }
      }

      const input: any = {
        title: form.title || 'Sin título',
        price: parseFloat(String(form.price || '0').replace(/\./g, '').replace(',', '.')),
        description: form.description,
        condition: form.condition,
        city: form.city,
        imageUrls,
      };

      if (form.categoryId) input.categoryId = form.categoryId;

      if (kind === 'MarketPlace' && (form.brand || form.model)) {
        input.marketplaceDetail = { brand: form.brand, model: form.model };
      } else if (kind === 'vehiculos') {
        input.vehicleDetail = {
          vehicleType: form.vehicleType, brand: form.brand, model: form.model,
          year: form.year ? parseInt(form.year) : undefined,
          transmission: form.transmission, engine: form.engine,
        };
      } else if (kind === 'inmobiliaria') {
        input.propertyDetail = {
          operation: form.operation, propertyType: form.propertyType,
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
          bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
          address: form.address,
        };
      } else if (kind === 'servicios') {
        input.serviceDetail = { serviceType: form.serviceType, offerType: form.offerType };
      } else if (kind === 'empleo') {
        input.jobDetail = { jobType: form.jobType, link: form.link };
      }

      await create(input);
      Alert.alert('Publicado', 'Tu anuncio ha sido publicado.', [{ text: 'OK', onPress: reset }]);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'No se pudo publicar el anuncio.'));
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
            Inicia sesión para publicar anuncios y empezar a vender en Market EG.
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

  if (!kind) {
    return <KindPicker insets={insets} onPick={setKind} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}>
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
          Publicar {KIND_META[kind].label.toLowerCase()}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 110,
        }}
        keyboardShouldPersistTaps="handled">
        <PhotoPicker
          photos={form.photos ?? []}
          setPhotos={(p) => setField('photos', p)}
        />

        <CategoryField form={form} setField={setField} />

        {kind === 'MarketPlace' && (
          <ProductoForm form={form} setField={setField} />
        )}
        {kind === 'vehiculos' && (
          <VehiculoForm form={form} setField={setField} />
        )}
        {kind === 'servicios' && (
          <ServicioForm form={form} setField={setField} />
        )}
        {kind === 'inmobiliaria' && (
          <InmobiliariaForm form={form} setField={setField} />
        )}
        {kind === 'empleo' && (
          <EmpleoForm form={form} setField={setField} />
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <RipplePress
          style={styles.publishBtn}
          borderRadius={14}
          rippleColor="rgba(255,255,255,0.25)"
          onPress={() => setPreviewOpen(true)}>
          <Eye size={20} color="#ffffff" strokeWidth={2} />
          <Text style={styles.publishBtnText}>Revisar y publicar</Text>
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
      />
    </KeyboardAvoidingView>
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
  const { colors } = useTheme();
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
}

/**
 * Category selector backed by the real `categoryTree` from the API.
 * Stores the chosen node's id in `categoryId` (required by the backend) and a
 * human label in `categoryLabel` (for the preview).
 */
function CategoryField({ form, setField }: FormProps) {
  const { tree } = useCategoryTree();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const [root, setRoot] = useState<any>(null);

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
    <Field label="Categoría">
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
            ? tree.map((r: any) => (
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

function ProductoForm({ form, setField }: FormProps) {
  return (
    <>
      <Field label="Título">
        <Input
          placeholder="Ej: iPhone 15 Pro 256GB"
          value={form.title}
          onChangeText={(v) => setField('title', v)}
        />
      </Field>

      <Field label="Descripción">
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

      <Field label="Estado">
        <Select
          options={CONDITIONS_FULL}
          value={form.condition}
          onChange={(v) => setField('condition', v)}
          placeholder="Selecciona el estado"
          title="Estado del producto"
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

      <Field label="Ciudad">
        <Select
          options={CITIES}
          value={form.city}
          onChange={(v) => setField('city', v)}
          placeholder="Selecciona la ciudad"
          title="Ciudad"
        />
      </Field>
    </>
  );
}

function VehiculoForm({ form, setField }: FormProps) {
  return (
    <>
      <Field label="Tipo de vehículo">
        <Select
          options={VEHICLE_TYPES}
          value={form.vehicleType}
          onChange={(v) => setField('vehicleType', v)}
          placeholder="Selecciona el tipo"
          title="Tipo de vehículo"
        />
      </Field>

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
        <Field label="Cambio" style={{ flex: 1 }}>
          <Select
            options={TRANSMISSION_TYPES}
            value={form.transmission}
            onChange={(v) => setField('transmission', v)}
            placeholder="Tipo"
            title="Cambio"
          />
        </Field>
      </RowFields>

      <Field label="Motor">
        <Select
          options={ENGINE_TYPES}
          value={form.engine}
          onChange={(v) => setField('engine', v)}
          placeholder="Selecciona el tipo de motor"
          title="Motor"
        />
      </Field>

      <Field label="Estado">
        <Select
          options={CONDITIONS_FULL}
          value={form.condition}
          onChange={(v) => setField('condition', v)}
          placeholder="Selecciona el estado"
          title="Estado del vehículo"
        />
      </Field>

      <Field label="Título">
        <Input
          placeholder="Ej: Toyota Hilux 2020 4x4"
          value={form.title}
          onChangeText={(v) => setField('title', v)}
        />
      </Field>

      <Field label="Descripción">
        <Textarea
          placeholder="Kilometraje, mantenimiento, equipamiento…"
          value={form.description}
          onChangeText={(v) => setField('description', v)}
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

      <Field label="Ciudad">
        <Select
          options={CITIES}
          value={form.city}
          onChange={(v) => setField('city', v)}
          placeholder="Selecciona la ciudad"
          title="Ciudad"
        />
      </Field>
    </>
  );
}

function ServicioForm({ form, setField }: FormProps) {
  return (
    <>
      <Field label="Servicio">
        <Select
          options={SERVICE_CATEGORIES}
          value={form.service}
          onChange={(v) => setField('service', v)}
          placeholder="Selecciona el servicio"
          title="Listado de servicios"
        />
      </Field>
      <Field label="Categoría">
        <Select
          options={SERVICE_OPTIONS}
          value={form.category}
          onChange={(v) => setField('category', v)}
          placeholder="¿Buscas u ofreces?"
          title="Categoría de servicios"
        />
      </Field>
      <Field label="Título">
        <Input
          placeholder="Ej: Electricista a domicilio"
          value={form.title}
          onChangeText={(v) => setField('title', v)}
        />
      </Field>

      <Field label="Descripción">
        <Textarea
          placeholder="Experiencia, horarios, qué incluye el servicio…"
          value={form.description}
          onChangeText={(v) => setField('description', v)}
        />
      </Field>

      <Field label="Precio (XAF)">
        <Input
          placeholder="0"
          value={form.price}
          onChangeText={(v) => setField('price', onlyNumeric(v))}
          keyboardType="numeric"
        />
      </Field>

      <Field label="Ciudad">
        <Select
          options={CITIES}
          value={form.city}
          onChange={(v) => setField('city', v)}
          placeholder="Selecciona la ciudad"
          title="Ciudad"
        />
      </Field>
    </>
  );
}

function InmobiliariaForm({ form, setField }: FormProps) {
  return (
    <>
      <Field label="Operación">
        <Select
          options={PROPERTY_OPERATIONS}
          value={form.operation}
          onChange={(v) => setField('operation', v)}
          placeholder="Venta o alquiler"
          title="Operación"
        />
      </Field>

      <Field label="Tipo de inmueble">
        <Select
          options={PROPERTY_TYPES}
          value={form.propertyType}
          onChange={(v) => setField('propertyType', v)}
          placeholder="Selecciona el tipo"
          title="Tipo de inmueble"
        />
      </Field>

      <Field label="Estado">
        <Select
          options={PROPERTY_CONDITIONS}
          value={form.condition}
          onChange={(v) => setField('condition', v)}
          placeholder="Selecciona el estado"
          title="Estado del inmueble"
        />
      </Field>

      <RowFields>
        <Field label="Habitaciones" style={{ flex: 1 }}>
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

      <Field label="Título">
        <Input
          placeholder="Ej: Piso 3 hab. centro Malabo"
          value={form.title}
          onChangeText={(v) => setField('title', v)}
        />
      </Field>

      <Field label="Descripción">
        <Textarea
          placeholder="Superficie, planta, año, características…"
          value={form.description}
          onChangeText={(v) => setField('description', v)}
        />
      </Field>

      <Field label="Precio (XAF)">
        <Input
          placeholder="0"
          value={form.price}
          onChangeText={(v) => setField('price', onlyNumeric(v))}
          keyboardType="numeric"
        />
      </Field>

      <Field label="Dirección">
        <Input
          placeholder="Calle, barrio, referencia"
          value={form.address}
          onChangeText={(v) => setField('address', v)}
        />
      </Field>

      <Field label="Ciudad">
        <Select
          options={CITIES}
          value={form.city}
          onChange={(v) => setField('city', v)}
          placeholder="Selecciona la ciudad"
          title="Ciudad"
        />
      </Field>
    </>
  );
}

function EmpleoForm({ form, setField }: FormProps) {
  return (
    <>
      <Field label="Categoría">
        <Select
          options={JOB_CATEGORIES}
          value={form.category}
          onChange={(v) => setField('category', v)}
          placeholder="¿Buscas u ofreces?"
          title="Categoría"
        />
      </Field>

      <Field label="Título">
        <Input
          placeholder="Ej: Camarero/a a media jornada"
          value={form.title}
          onChangeText={(v) => setField('title', v)}
        />
      </Field>

      <Field label="Descripción">
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

      <Field label="Ciudad">
        <Select
          options={CITIES}
          value={form.city}
          onChange={(v) => setField('city', v)}
          placeholder="Selecciona la ciudad"
          title="Ciudad"
        />
      </Field>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview modal
// ─────────────────────────────────────────────────────────────────────────────

function getPreviewFields(
  kind: Kind,
  form: FormState
): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const add = (label: string, raw: unknown) => {
    if (raw === undefined || raw === null || raw === '') return;
    out.push({ label, value: String(raw) });
  };
  const fmtPrice = (v: unknown) =>
    v ? `${Number(v).toLocaleString('es-GQ')} XAF` : undefined;

  add('Categoría', form.categoryLabel);

  switch (kind) {
    case 'MarketPlace':
      add('Título', form.title);
      add('Marca', form.brand);
      add('Modelo', form.model);
      add('Estado', form.condition);
      add('Precio', fmtPrice(form.price));
      add('Descuento', form.discount ? `${form.discount}%` : undefined);
      add('Ciudad', form.city);
      add('Descripción', form.description);
      break;
    case 'vehiculos':
      add('Tipo de vehículo', form.vehicleType);
      add('Marca', form.brand);
      add('Modelo', form.model);
      add('Año', form.year);
      add('Cambio', form.transmission);
      add('Motor', form.engine);
      add('Estado', form.condition);
      add('Título', form.title);
      add('Precio', fmtPrice(form.price));
      add('Descuento', form.discount ? `${form.discount}%` : undefined);
      add('Ciudad', form.city);
      add('Descripción', form.description);
      break;
    case 'servicios':
      add('Servicio', form.service);
      add('Modalidad', form.category);
      add('Título', form.title);
      add('Precio', fmtPrice(form.price));
      add('Ciudad', form.city);
      add('Descripción', form.description);
      break;
    case 'inmobiliaria':
      add('Operación', form.operation);
      add('Tipo de inmueble', form.propertyType);
      add('Estado', form.condition);
      add('Habitaciones', form.bedrooms > 0 ? form.bedrooms : undefined);
      add('Baños', form.bathrooms > 0 ? form.bathrooms : undefined);
      add('Título', form.title);
      add('Precio', fmtPrice(form.price));
      add('Dirección', form.address);
      add('Ciudad', form.city);
      add('Descripción', form.description);
      break;
    case 'empleo':
      add('Modalidad', form.category);
      add('Título', form.title);
      add('Enlace web', form.link);
      add('Ciudad', form.city);
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
}: {
  visible: boolean;
  kind: Kind;
  form: FormState;
  onClose: () => void;
  onPublish: () => void;
  loading?: boolean;
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

  const photos: string[] = form.photos ?? [];
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
          {photos.length > 0 ? (
            <View>
              <FlatList
                data={photos}
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
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={styles.pvPhoto}
                    resizeMode="cover"
                  />
                )}
              />
              {photos.length > 1 && (
                <View style={styles.pvDots}>
                  {photos.map((_, i) => (
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
                  {final.toLocaleString('es-GQ')} XAF
                </Text>
                {hasDiscount && (
                  <>
                    <Text style={styles.pvPriceOriginal}>
                      {raw.toLocaleString('es-GQ')} XAF
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
                  <Text style={styles.pvFieldValue} numberOfLines={2}>
                    {f.value}
                  </Text>
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
          <RipplePress
            style={styles.publishBtn}
            borderRadius={14}
            rippleColor="rgba(255,255,255,0.25)"
            onPress={() => {
              if (!loading) onPublish();
            }}>
            {loading ? (
              <Spinner color="#ffffff" />
            ) : (
              <Text style={styles.publishBtnText}>Publicar anuncio</Text>
            )}
          </RipplePress>
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
}: {
  label: string;
  children: React.ReactNode;
  style?: any;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[{ marginBottom: 18 }, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
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
  photos,
  setPhotos,
}: {
  photos: string[];
  setPhotos: (p: string[]) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const addPhoto = () => {
    const next = STOCK_PHOTOS[photos.length % STOCK_PHOTOS.length];
    setPhotos([...photos, next]);
  };
  const removePhoto = (i: number) =>
    setPhotos(photos.filter((_, idx) => idx !== i));

  return (
    <View style={{ marginBottom: 22 }}>
      <View style={styles.photoHeader}>
        <Text style={styles.fieldLabel}>Fotos</Text>
        <Text style={styles.photoCount}>{photos.length}/8</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
        {photos.map((uri, i) => (
          <View key={`${uri}-${i}`} style={styles.photoThumb}>
            <Image source={{ uri }} style={styles.photoImage} />
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
        ))}
        {photos.length < 8 && (
          <TouchableOpacity
            style={styles.photoAdd}
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
    fontSize: 32,
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
