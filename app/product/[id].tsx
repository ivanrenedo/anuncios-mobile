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
  Share,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  Flag,
  PackageX,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import ProductImage from '@/components/ProductImage';
import SafetyModal, { SafetyModalMode } from '@/components/SafetyModal';
import ReportSheet from '@/components/ReportSheet';
import { useProduct, useViewProduct } from '@/hooks/useProducts';
import { useToggleFavorite, useIsFavorited } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/lib/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function WhatsAppSvg() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="white">
      <Path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.128l-.694 2.537 2.597-.681c.812.443 1.764.782 2.84.783h.001c3.181 0 5.766-2.586 5.767-5.766 0-3.18-2.585-5.767-5.768-5.767zm3.387 8.191c-.131.372-.767.712-1.056.747-.29.035-.577.062-1.62-.353-1.041-.416-2.132-1.731-2.658-2.433-.06-.081-.118-.158-.172-.226-.403-.523-.672-.871-.672-1.398 0-.528.273-.787.37-.891.085-.09.186-.135.279-.135.093 0 .186.002.251.004l.322.006c.107.001.21.002.298.221.112.273.384.935.417 1.002.033.066.054.143.01.23-.044.088-.066.143-.132.22-.066.077-.138.128-.197.197l-.273.334c-.074.074-.15.155-.064.302.086.148.38.627.815 1.014.56.499 1.03.654 1.178.727.148.073.234.061.32-.039.086-.1.371-.433.469-.581.099-.148.197-.124.333-.074.135.05 1.135.535 1.341.631.206.095.343.142.393.228.05.085.05.49-.081.862z" />
      <Path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.144c-1.657 0-3.213-.424-4.566-1.168l-4.149 1.087 1.107-4.048C3.54 15.592 3.045 13.927 3.045 12.15 3.045 7.129 7.134 3.04 12.155 3.04S21.265 7.129 21.265 12.15c-.001 5.021-4.09 9.11-9.11 9.11h-.155z" />
    </Svg>
  );
}

function timeAgo(iso?: string): string {
  if (!iso) return 'recientemente';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'recientemente';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'hace un momento';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} día${d > 1 ? 's' : ''}`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `hace ${mo} mes${mo > 1 ? 'es' : ''}`;
  const y = Math.floor(mo / 12);
  return `hace ${y} año${y > 1 ? 's' : ''}`;
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { product: apiProduct, loading } = useProduct(id || '');
  const { trackView } = useViewProduct();
  const { toggle: toggleFav } = useToggleFavorite();
  const { isFavorited } = useIsFavorited(id || '');
  const { isAuthenticated } = useAuth();
  // Category-specific detail tables (vehicle/property/service/job/marketplace).
  // Stored on publish and fetched in GET_PRODUCT, rendered here as a spec sheet.
  const detailPairs: { label: string; value: string }[] = [];
  if (apiProduct) {
    const push = (label: string, value: any) => {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        detailPairs.push({ label, value: String(value) });
      }
    };
    const m = apiProduct.marketplaceDetail;
    if (m) { push('Marca', m.brand); push('Modelo', m.model); }
    const v = apiProduct.vehicleDetail;
    if (v) {
      push('Tipo', v.vehicleType); push('Marca', v.brand); push('Modelo', v.model);
      push('Año', v.year); push('Transmisión', v.transmission); push('Motor', v.engine);
    }
    const p = apiProduct.propertyDetail;
    if (p) {
      push('Operación', p.operation); push('Tipo', p.propertyType);
      push('Dormitorios', p.bedrooms); push('Baños', p.bathrooms); push('Dirección', p.address);
    }
    const s = apiProduct.serviceDetail;
    if (s) { push('Tipo de servicio', s.serviceType); push('Modalidad', s.offerType); }
    const j = apiProduct.jobDetail;
    if (j) { push('Tipo de empleo', j.jobType); push('Enlace', j.link); }
  }

  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(isFavorited);
  const [modal, setModal] = useState<SafetyModalMode | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  // Track view on mount
  React.useEffect(() => {
    if (id) trackView(id);
  }, [id]);

  // Loading / not-found states — no local mock fallback anymore.
  if (loading && !apiProduct) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top, height: 44 + insets.top }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <ChevronLeft size={22} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cargando…</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }
  if (!apiProduct) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top, height: 44 + insets.top }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <ChevronLeft size={22} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>No disponible</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.centerFill}>
          <PackageX size={48} color={colors.onSurfaceVariant + '66'} strokeWidth={1.4} />
          <Text style={styles.stateTitle}>Anuncio no disponible</Text>
          <Text style={styles.stateDesc}>Este anuncio no existe o ha sido eliminado.</Text>
        </View>
      </View>
    );
  }

  const sellerId = apiProduct.seller?.id;

  const images: string[] = apiProduct.images?.length
    ? apiProduct.images.map((img: any) =>
        img.url.startsWith('/') ? `${API_URL}${img.url}` : img.url,
      )
    : [];

  const priceNum = Number(apiProduct.price);
  const discountPct = apiProduct.discount ?? 0;
  const product = {
    id: apiProduct.id,
    title: apiProduct.title,
    subtitle: apiProduct.category?.label || '',
    price: `${priceNum.toLocaleString('es')} XAF`,
    originalPrice:
      discountPct > 0
        ? `${Math.round(priceNum / (1 - discountPct / 100)).toLocaleString('es')} XAF`
        : undefined,
    discount: discountPct > 0 ? `-${discountPct}%` : undefined,
    condition: apiProduct.condition || '',
    description: apiProduct.description || 'Sin descripción.',
    images,
    seller: {
      name: apiProduct.seller?.name || 'Vendedor',
      avatar: apiProduct.seller?.avatarUrl || undefined,
      rating: 0,
      sales: 0,
      verified: apiProduct.seller?.verified ?? false,
    },
    location: apiProduct.city || 'Guinea Ecuatorial',
    postedAgo: timeAgo(apiProduct.createdAt),
    views: apiProduct.views ?? 0,
    favorites: apiProduct.favoritesCount ?? 0,
    attributes:
      apiProduct.attributes?.map((a: any) => ({ label: a.label, value: a.value })) || [],
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImage(index);
  };

  const onShare = async () => {
    try {
      await Share.share({
        title: 'Market EG',
        message: `Mira este anuncio en Market EG: ${product.title} — ${product.price}`,
      });
    } catch {
      // user dismissed / share unavailable
    }
  };

  return (
    <View style={styles.root}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 44 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.title}</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Compartir anuncio"
          onPress={onShare}>
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
            {product.images.length > 0 ? (
              product.images.map((uri: string, i: number) => (
                <Image key={i} source={{ uri }} style={styles.galleryImage} />
              ))
            ) : (
              <ProductImage uri={null} style={styles.galleryImage} iconSize={48} />
            )}
          </ScrollView>

          {/* Favorite */}
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => { setLiked((v: boolean) => !v); if (id) toggleFav(id); }}
            activeOpacity={0.85}>
            <Heart
              size={20}
              color={liked ? '#e53935' : '#ffffff'}
              fill={liked ? '#e53935' : 'transparent'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>

          {/* Dots */}
          {product.images.length > 1 && (
            <View style={styles.dots}>
              {product.images.map((_: string, i: number) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeImage ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product info */}
        <View style={styles.section}>
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{product.condition}</Text>
          </View>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.subtitle}>{product.subtitle}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price}</Text>
            {product.originalPrice && (
              <Text style={styles.priceOriginal}>{product.originalPrice}</Text>
            )}
            {product.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{product.discount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Seller card */}
        <View style={styles.section}>
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatarWrap}>
              <Image source={{ uri: product.seller.avatar }} style={styles.sellerAvatar} />
              {product.seller.verified && (
                <View style={styles.sellerVerified}>
                  <BadgeCheck size={14} color="#ffffff" fill={colors.primary} strokeWidth={0} />
                </View>
              )}
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.seller.name}</Text>
              <View style={styles.sellerRatingRow}>
                <Star
                  size={12}
                  color={colors.tertiaryContainer}
                  fill={colors.tertiaryContainer}
                  strokeWidth={0}
                />
                <Text style={styles.sellerRating}>{product.seller.rating.toFixed(1)}</Text>
                <Text style={styles.sellerSales}>({product.seller.sales} ventas)</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.profileBtn}
              activeOpacity={0.8}
              disabled={!sellerId}
              onPress={() =>
                sellerId &&
                router.push({ pathname: '/user/[id]', params: { id: sellerId } })
              }>
              <Text style={styles.profileBtnText}>Ver perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{product.description}</Text>
          <View style={styles.attrGrid}>
            {product.attributes.map((attr: { label: string; value: string }) => (
              <View key={attr.label} style={styles.attrCard}>
                <Text style={styles.attrLabel}>{attr.label}</Text>
                <Text style={styles.attrValue}>{attr.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category-specific spec sheet */}
        {detailPairs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ficha técnica</Text>
            <View style={styles.attrGrid}>
              {detailPairs.map((attr, i) => (
                <View key={`${attr.label}-${i}`} style={styles.attrCard}>
                  <Text style={styles.attrLabel}>{attr.label}</Text>
                  <Text style={styles.attrValue}>{attr.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
            <View style={styles.mapPinWrap}>
              <View style={styles.mapPinOuter}>
                <View style={styles.mapPinInner} />
              </View>
            </View>
            <View style={styles.mapLabelWrap}>
              <MapPin size={13} color={colors.primary} strokeWidth={2} />
              <Text style={styles.mapLabelText}>{product.location}</Text>
            </View>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Publicado {product.postedAgo}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{product.views} vistas</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{product.favorites} en favoritos</Text>
            </View>
          </View>
        </View>

        {/* Reportar anuncio */}
        <View style={styles.section}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 12,
            }}
            activeOpacity={0.8}
            onPress={() => {
              if (!isAuthenticated) {
                router.push('/login');
                return;
              }
              setReportOpen(true);
            }}>
            <Flag size={18} color={colors.error} strokeWidth={1.8} />
            <Text style={{ fontFamily: 'Manrope-SemiBold', fontSize: 14, color: colors.error }}>
              Reportar anuncio
            </Text>
          </TouchableOpacity>
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

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        type="product"
        targetId={id || ''}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      width: '100%',
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    centerFill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 10,
    },
    stateTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 17,
      color: colors.onSurface,
      marginTop: 6,
    },
    stateDesc: {
      fontFamily: 'Manrope-Regular',
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
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
      gap: 12,
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
      flex: 1,
      textAlign: 'center',
      fontFamily: 'Manrope-Bold',
      fontSize: 16,
      color: colors.onSurface,
      letterSpacing: -0.3,
    },
    galleryContainer: {
      width: '100%',
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
      backgroundColor: colors.tertiary + '14',
      borderRadius: 16,
      padding: 16,
      borderWidth: 0.5,
      borderColor: colors.tertiary + '40',
      alignItems: 'center',
    },
    safetyIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.tertiary + '26',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    safetyTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 14,
      color: colors.onSurface,
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
