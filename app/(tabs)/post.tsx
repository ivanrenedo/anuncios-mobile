import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {
  Camera,
  Image as ImageIcon,
  ChevronRight,
  MapPin,
  Edit2,
  Shield,
  RocketIcon,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';

type Condition = 'Nuevo' | 'Como nuevo' | 'Usado';

const CONDITIONS: Condition[] = ['Nuevo', 'Como nuevo', 'Usado'];

const SAFETY_TIPS = [
  'No aceptes pagos por adelantado sin ver el producto.',
  'Queda en lugares públicos y concurridos de Malabo o Bata.',
  'Verifica el estado del artículo antes de realizar la transacción.',
];

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [condition, setCondition] = useState<Condition>('Nuevo');
  const [description, setDescription] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceContainerLow }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <View style={styles.headerLeft}>
          <RipplePress style={styles.closeBtn} borderRadius={18} rippleColor={colors.primary + '22'}>
            <X size={22} color={colors.primary} strokeWidth={2} />
          </RipplePress>
          <Text style={styles.headerTitle}>Vender artículo</Text>
        </View>
        <RipplePress borderRadius={8} rippleColor={colors.primary + '18'}>
          <Text style={styles.publishHeaderBtn}>Publicar</Text>
        </RipplePress>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 56 + insets.top + 16 }]}>

        {/* Photo Grid */}
        <View style={styles.photoSection}>
          <View style={styles.photoGrid}>
            {/* Cover slot */}
            <RipplePress style={styles.photoCover} borderRadius={12} rippleColor={colors.primary + '22'}>
              <Camera size={28} color={colors.primary} strokeWidth={1.5} />
              <Text style={styles.photoCoverLabel}>Portada</Text>
            </RipplePress>
            {/* Extra slots */}
            {[1, 2, 3, 4].map((i) => (
              <RipplePress key={i} style={styles.photoSlot} borderRadius={12} rippleColor={colors.primary + '15'}>
                <ImageIcon size={22} color={colors.outlineVariant} strokeWidth={1.5} />
              </RipplePress>
            ))}
          </View>
          <Text style={styles.photoHint}>
            Añade al menos una foto nítida de tu producto. Máximo 10 fotos.
          </Text>
        </View>

        {/* Product Details */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Título del anuncio"
              placeholderTextColor={colors.outlineVariant + '99'}
            />
          </View>
          <View style={styles.cardDivider} />
          <RipplePress style={[styles.cardRow, styles.cardRowAction]} borderRadius={0} rippleColor={colors.primary + '10'}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardRowLabel}>Categoría</Text>
              <Text style={styles.cardRowValue}>Seleccionar categoría</Text>
            </View>
            <ChevronRight size={18} color={colors.outlineVariant + '88'} strokeWidth={1.5} />
          </RipplePress>
        </View>

        {/* Pricing & Condition */}
        <View style={styles.card}>
          {/* Price */}
          <View style={[styles.cardRow, styles.cardRowSpaced]}>
            <Text style={styles.cardRowTitle}>Precio</Text>
            <View style={styles.priceInputRow}>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                placeholderTextColor={colors.outlineVariant + '66'}
                keyboardType="numeric"
                textAlign="right"
              />
              <Text style={styles.priceUnit}>XAF</Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          {/* Discount */}
          <View style={[styles.cardRow, styles.cardRowSpaced]}>
            <View>
              <Text style={styles.cardRowTitle}>Descuento</Text>
              <Text style={styles.cardRowLabel}>Porcentaje sugerido</Text>
            </View>
            <View style={styles.discountWrap}>
              <TextInput
                style={styles.discountInput}
                value={discount}
                onChangeText={setDiscount}
                placeholder="0"
                placeholderTextColor={colors.outlineVariant + '66'}
                keyboardType="numeric"
                textAlign="right"
              />
              <Text style={styles.discountUnit}>%</Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          {/* Condition */}
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardRowLabel}>Estado del producto</Text>
              <View style={styles.conditionRow}>
                {CONDITIONS.map((cond) => (
                  <Pressable
                    key={cond}
                    style={[styles.conditionBtn, condition === cond && styles.conditionBtnActive]}
                    onPress={() => setCondition(cond)}
                    android_ripple={{ color: colors.primary + '22' }}>
                    <Text style={[styles.conditionText, condition === cond && styles.conditionTextActive]}>
                      {cond}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.card}>
          <RipplePress style={[styles.cardRow, styles.cardRowSpaced]} borderRadius={0} rippleColor={colors.primary + '10'}>
            <View style={styles.locationLeft}>
              <MapPin size={20} color={colors.onSurfaceVariant} strokeWidth={1.5} />
              <View>
                <Text style={styles.cardRowLabel}>Ubicación</Text>
                <Text style={styles.cardRowTitle}>Malabo, Bioko Norte</Text>
              </View>
            </View>
            <Edit2 size={16} color={colors.outlineVariant + '88'} strokeWidth={1.5} />
          </RipplePress>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe tu producto con detalle (marca, modelo, uso...)"
            placeholderTextColor={colors.outlineVariant + '99'}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Safety Tips */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyHeader}>
            <Shield size={20} color={colors.tertiary} strokeWidth={1.5} />
            <Text style={styles.safetyTitle}>Consejos de seguridad</Text>
          </View>
          {SAFETY_TIPS.map((tip, i) => (
            <View key={i} style={styles.safetyRow}>
              <Text style={styles.safetyBullet}>•</Text>
              <Text style={styles.safetyText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <RipplePress
            style={styles.publishBtn}
            borderRadius={14}
            rippleColor="rgba(255,255,255,0.25)"
            onPress={() => {}}>
            <Text style={styles.publishBtnText}>Publicar Anuncio</Text>
            <RocketIcon size={18} color="#ffffff" strokeWidth={1.5} />
          </RipplePress>
          <Text style={styles.ctaDisclaimer}>
            Al publicar, aceptas nuestras Condiciones de Uso y Privacidad.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: colors.surface + 'e6',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  headerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  publishHeaderBtn: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Photo
  photoSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCover: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoCoverLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.primary,
  },
  photoSlot: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.outline,
    marginTop: 10,
    paddingHorizontal: 2,
  },
  // Card
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDivider: {
    height: 0.5,
    backgroundColor: colors.outlineVariant + '44',
    marginLeft: 16,
  },
  cardRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardRowAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardRowSpaced: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardRowLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.outline,
    marginBottom: 2,
  },
  cardRowValue: {
    fontFamily: 'Manrope-Regular',
    fontSize: 17,
    color: colors.onSurface,
  },
  cardRowTitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 17,
    color: colors.onSurface,
  },
  // Title input
  titleInput: {
    fontFamily: 'Manrope-Regular',
    fontSize: 17,
    color: colors.onSurface,
    padding: 0,
    width: '100%',
  },
  // Price
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceInput: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: colors.primary,
    minWidth: 80,
    padding: 0,
    textAlign: 'right',
  },
  priceUnit: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: colors.onSurface,
  },
  // Discount
  discountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  discountInput: {
    fontFamily: 'Manrope-Regular',
    fontSize: 17,
    color: colors.tertiary,
    width: 48,
    padding: 0,
    textAlign: 'right',
  },
  discountUnit: {
    fontFamily: 'Manrope-Regular',
    fontSize: 17,
    color: colors.tertiary,
  },
  // Condition
  conditionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  conditionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '44',
    overflow: 'hidden',
  },
  conditionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  conditionText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  conditionTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: '#ffffff',
  },
  // Location
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  // Description
  descInput: {
    fontFamily: 'Manrope-Regular',
    fontSize: 17,
    color: colors.onSurface,
    padding: 16,
    minHeight: 120,
  },
  // Safety
  safetyCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.tertiary + '12',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.tertiary + '33',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  safetyTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.tertiary,
  },
  safetyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  safetyBullet: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  safetyText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    flex: 1,
  },
  // CTA
  ctaSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  publishBtn: {
    height: 52,
    backgroundColor: colors.primaryContainer,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  publishBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: '#ffffff',
  },
  ctaDisclaimer: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.outline,
    textAlign: 'center',
    marginTop: 14,
  },
});
