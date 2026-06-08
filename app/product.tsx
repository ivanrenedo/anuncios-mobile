import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Star,
  Shield,
  MapPin,
  Phone,
  Heart,
  BadgeCheck,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/constants/theme';
import SafetyModal, { SafetyModalMode } from '@/components/SafetyModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GALLERY = [
  'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=800',
];

function WhatsAppSvg() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="white">
      <Path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.128l-.694 2.537 2.597-.681c.812.443 1.764.782 2.84.783h.001c3.181 0 5.766-2.586 5.767-5.766 0-3.18-2.585-5.767-5.768-5.767zm3.387 8.191c-.131.372-.767.712-1.056.747-.29.035-.577.062-1.62-.353-1.041-.416-2.132-1.731-2.658-2.433-.06-.081-.118-.158-.172-.226-.403-.523-.672-.871-.672-1.398 0-.528.273-.787.37-.891.085-.09.186-.135.279-.135.093 0 .186.002.251.004l.322.006c.107.001.21.002.298.221.112.273.384.935.417 1.002.033.066.054.143.01.23-.044.088-.066.143-.132.22-.066.077-.138.128-.197.197l-.273.334c-.074.074-.15.155-.064.302.086.148.38.627.815 1.014.56.499 1.03.654 1.178.727.148.073.234.061.32-.039.086-.1.371-.433.469-.581.099-.148.197-.124.333-.074.135.05 1.135.535 1.341.631.206.095.343.142.393.228.05.085.05.49-.081.862z" />
      <Path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.144c-1.657 0-3.213-.424-4.566-1.168l-4.149 1.087 1.107-4.048C3.54 15.592 3.045 13.927 3.045 12.15 3.045 7.129 7.134 3.04 12.155 3.04S21.265 7.129 21.265 12.15c-.001 5.021-4.09 9.11-9.11 9.11h-.155z" />
    </Svg>
  );
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [modal, setModal] = useState<SafetyModalMode | null>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImage(index);
  };

  return (
    <View style={styles.root}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 44 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Market EG</Text>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8}>
          <Share2 size={20} color={colors.primary} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 44 + insets.top, paddingBottom: 100 + insets.bottom }}>
        {/* Gallery */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={styles.galleryScroll}>
            {GALLERY.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.galleryImage} />
            ))}
          </ScrollView>

          {/* Favorite */}
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => setLiked((v) => !v)}
            activeOpacity={0.85}>
            <Heart
              size={20}
              color={liked ? '#e53935' : '#ffffff'}
              fill={liked ? '#e53935' : 'transparent'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>

          {/* Dots */}
          <View style={styles.dots}>
            {GALLERY.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeImage ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Product info */}
        <View style={styles.section}>
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>Nuevo</Text>
          </View>
          <Text style={styles.title}>Nike Air Zoom Pegasus 39</Text>
          <Text style={styles.subtitle}>Calzado de running de alto rendimiento para hombre</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>85.000 XAF</Text>
            <Text style={styles.priceOriginal}>105.000 XAF</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-19%</Text>
            </View>
          </View>
        </View>

        {/* Seller card */}
        <View style={styles.section}>
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatarWrap}>
              <Image
                source={{
                  uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
                }}
                style={styles.sellerAvatar}
              />
              <View style={styles.sellerVerified}>
                <BadgeCheck size={14} color="#ffffff" fill={colors.primary} strokeWidth={0} />
              </View>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>Jean-Pierre Nguema</Text>
              <View style={styles.sellerRatingRow}>
                <Star
                  size={12}
                  color={colors.tertiaryContainer}
                  fill={colors.tertiaryContainer}
                  strokeWidth={0}
                />
                <Text style={styles.sellerRating}>4.9</Text>
                <Text style={styles.sellerSales}>(128 ventas)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.profileBtn} activeOpacity={0.8}>
              <Text style={styles.profileBtnText}>Ver perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>
            Corre con total confianza y estilo. Estos Nike Air Zoom originales ofrecen una
            amortiguación reactiva excepcional para largas distancias. Su diseño transpirable
            mantiene tus pies frescos, mientras que la suela de tracción superior es ideal
            para las superficies de la ciudad.
          </Text>
          <View style={styles.attrGrid}>
            <View style={styles.attrCard}>
              <Text style={styles.attrLabel}>Talla</Text>
              <Text style={styles.attrValue}>42 (EU)</Text>
            </View>
            <View style={styles.attrCard}>
              <Text style={styles.attrLabel}>Estado</Text>
              <Text style={styles.attrValue}>Nuevo</Text>
            </View>
            <View style={styles.attrCard}>
              <Text style={styles.attrLabel}>Categoría</Text>
              <Text style={styles.attrValue}>Moda</Text>
            </View>
            <View style={styles.attrCard}>
              <Text style={styles.attrLabel}>Ubicación</Text>
              <Text style={styles.attrValue}>Malabo, GE</Text>
            </View>
          </View>
        </View>

        {/* Safety tip */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.safetyCard}
            onPress={() => setModal('tips')}
            activeOpacity={0.85}>
            <View style={styles.safetyIcon}>
              <Shield size={20} color={colors.tertiary} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.safetyTitle}>Consejos de Seguridad</Text>
              <Text style={styles.safetyText}>
                <Text style={styles.safetyBold}>Pago en persona únicamente.</Text>
                {' '}Nunca envíes dinero por adelantado. Toca para ver más consejos.
              </Text>
            </View>
            <ChevronRight size={18} color={colors.tertiary + '99'} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación del vendedor</Text>
          <View style={styles.mapWrap}>
            <Image
              source={{
                uri: 'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=800',
              }}
              style={styles.mapImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.25)']}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Pin overlay */}
            <View style={styles.mapPinWrap}>
              <View style={styles.mapPinOuter}>
                <View style={styles.mapPinInner} />
              </View>
            </View>
            {/* Location label */}
            <View style={styles.mapLabelWrap}>
              <MapPin size={13} color={colors.primary} strokeWidth={2} />
              <Text style={styles.mapLabelText}>Malabo, Guinea Ecuatorial</Text>
            </View>
          </View>
        </View>

        {/* Related listings hint */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Publicado hace 2 días</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>156 vistas</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>12 en favoritos</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => setModal('call')}
          activeOpacity={0.88}>
          <Phone size={20} color="#ffffff" strokeWidth={2} />
          <Text style={styles.callBtnText}>Llamar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={() => setModal('whatsapp')}
          activeOpacity={0.88}>
          <WhatsAppSvg />
          <Text style={styles.whatsappBtnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      <SafetyModal
        visible={modal !== null}
        mode={modal ?? 'tips'}
        onClose={() => setModal(null)}
      />
    </View>
  );
}

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
    backgroundColor: colors.surface + 'cc',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  headerBtn: {
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
  galleryContainer: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    backgroundColor: colors.surfaceContainer,
    position: 'relative',
  },
  galleryScroll: {
    flex: 1,
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
  },
  likeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  conditionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '1a',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  conditionText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontFamily: 'Manrope-Bold',
    fontSize: 26,
    color: colors.onSurface,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  price: {
    fontFamily: 'Manrope-Bold',
    fontSize: 32,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  priceOriginal: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant + '80',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: colors.error + '1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: colors.error,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sellerAvatarWrap: {
    position: 'relative',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  sellerVerified: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 20,
  },
  sellerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  sellerRating: {
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
    color: colors.tertiary,
  },
  sellerSales: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  profileBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHigh,
  },
  profileBtnText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  sectionTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 17,
    color: colors.onSurface,
    lineHeight: 22,
    marginBottom: 10,
  },
  description: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
    lineHeight: 24,
  },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  attrCard: {
    width: '47%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '22',
  },
  attrLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 16,
    marginBottom: 4,
  },
  attrValue: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 20,
  },
  safetyCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.tertiary + '0d',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.tertiary + '33',
    alignItems: 'center',
  },
  safetyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tertiary + '1a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  safetyTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.onTertiaryContainer,
    lineHeight: 20,
    marginBottom: 4,
  },
  safetyText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 19,
  },
  safetyBold: {
    fontFamily: 'Manrope-Bold',
    color: colors.onSurface,
  },
  mapWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 192,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapPinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -28,
    alignItems: 'center',
  },
  mapPinOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  mapPinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  mapLabelWrap: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerLowest + 'ee',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapLabelText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.onSurface,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaChip: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  metaChipText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface + 'ee',
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '4d',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  callBtn: {
    flex: 1,
    height: 52,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  whatsappBtn: {
    flex: 2,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsappBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: '#ffffff',
  },
});
