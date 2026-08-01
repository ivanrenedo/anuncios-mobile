import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Linking,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Star,
  Crown,
  MapPin,
  Phone,
  Heart,
  BadgeCheck,
  Flag,
  PackageX,
  Bed,
  Bath,
  Ruler,
  Building,
  Calendar,
  Gauge,
  Fuel,
  Cog,
  ExternalLink,
  Eye,
  Clock,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import ProductImage from '@/components/ProductImage';
import SafetyModal, { SafetyModalMode } from '@/components/SafetyModal';
import ReportSheet from '@/components/ReportSheet';
import { ArrowUpCircle, MessageCircle, Zap } from 'lucide-react-native';
import { useProduct, useViewProduct, useContactProduct, useRelatedProducts } from '@/hooks/useProducts';
import { useSellerRating } from '@/hooks/useReviews';
import { useFavoriteToggle } from '@/hooks/useFavorites';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { useAuth } from '@/hooks/useAuth';
import { API_URL, SHARE_URL, resolveImage } from '@/lib/config';
import { useBusinessContact } from '@/hooks/useBusinessContact';
import { useShare } from '@/hooks/useShare';
import Skeleton from '@/components/Skeleton';
import { fmtPrice, type ProductCardItem } from '@/components/ProductCard';
import ProductRail from '@/components/ProductRail';
import { getViewerKey } from '@/lib/viewer';
import ImageViewing from 'react-native-image-viewing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function toCardItem(p: any): ProductCardItem {
  const img = p.images?.[0]?.url || '';
  return {
    id: p.id,
    title: p.title,
    price: fmtPrice(Number(p.price)),
    priceRaw: Number(p.price),
    location: p.city,
    seller: p.seller?.name,
    sellerId: p.seller?.id,
    avatar: resolveImage(p.seller?.avatarUrl),
    verified: p.seller?.verified,
    sellerPlan: p.seller?.effectivePlan ?? p.seller?.plan,
    image: img.startsWith('/') ? `${API_URL}${img}` : img,
    condition: p.condition,
    discount: p.discount,
    categoryLabel: p.category?.label,
    operation: p.propertyDetail?.operation ?? p.vehicleDetail?.operation,
    offerType: p.serviceDetail?.offerType,
    isBoosted: p.boostedUntil ? new Date(p.boostedUntil) > new Date() : false,
    postedAgo: timeAgo(p.createdAt),
  };
}

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

export function fmtNumber(n: number) {
  return `${Math.round(n).toLocaleString('es')} XAF`;
}

function ColorsCell({ colors, styles }: { colors: string[]; styles: any }) {
  return (
    <View style={styles.colorsCell}>
      <Text style={styles.specCellLabel}>
        {colors.length === 1 ? 'Color' : 'Colores'}
      </Text>
      <View style={styles.colorsRow}>
        {colors.map((c, i) => (
          <View
            key={`${c}-${i}`}
            style={[styles.colorSwatchLg, { backgroundColor: c }]}
          />
        ))}
      </View>
    </View>
  );
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { product: apiProduct, loading, refetch: refetchProduct } = useProduct(id || '');
  const { trackView } = useViewProduct();
  const { trackContact } = useContactProduct();
  // One contact stat per screen visit, no matter how many times the buttons
  // are tapped (the safety modal invites re-taps).
  const contactTracked = React.useRef<string | null>(null);
  const registerContactOnce = () => {
    if (!id || contactTracked.current === id) return;
    contactTracked.current = id;
    trackContact(id);
  };
  const { isFavorite, toggleFavorite } = useFavoriteToggle();
  const { isAuthenticated, user: me } = useAuth();
  const { average: sellerAvg, refetch: refetchRating } = useSellerRating(apiProduct?.seller?.id || '');
  const categoryId = apiProduct?.category?.id || '';
  const productTitle = apiProduct?.title || '';
  const { products: relatedRaw, loading: relatedLoading, refetch: refetchRelated } = useRelatedProducts(productTitle, categoryId);

  // Precio, disponibilidad, favoritos y rating del vendedor pueden cambiar
  // desde otras sesiones — recarga al volver a la ficha.
  useRefetchOnFocus([refetchProduct, refetchRating, refetchRelated]);

  const relatedItems = relatedRaw
    .filter((p: any) => p.id !== id)
    .slice(0, 10)
    .map(toCardItem);
  const mkt = apiProduct?.marketplaceDetail;
  const veh = apiProduct?.vehicleDetail;
  const prop = apiProduct?.propertyDetail;
  const svc = apiProduct?.serviceDetail;
  const job = apiProduct?.jobDetail;
  const operationLabel = veh?.operation || prop?.operation || null;

  const [refreshing, setRefreshing] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [modal, setModal] = useState<SafetyModalMode | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [descNeedsToggle, setDescNeedsToggle] = useState<boolean | null>(null);

  const { phone: contactNumber } = useBusinessContact();

  // Track view once per listing — the ref guard survives re-mounts and any
  // double-invoked effect, and the backend also dedups per visitor (6h window).
  const tracked = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!id || tracked.current === id) return;
    tracked.current = id;
    getViewerKey()
      .then((key) => trackView(id, key))
      .catch(() => {});
  }, [id]);

  // Loading / not-found states — no local mock fallback anymore.
  if (loading && !apiProduct) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top, height: 44 + insets.top }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} activeOpacity={0.8}>
            <ChevronLeft size={22} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerBtn} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 44 + insets.top }}>
          <Skeleton style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85, borderRadius: 0 }} />
          <View style={{ padding: 16, gap: 12 }}>
            <Skeleton style={{ height: 24, width: '75%', borderRadius: 8 }} />
            <Skeleton style={{ height: 30, width: '45%', borderRadius: 8 }} />
            <Skeleton style={{ height: 14, width: '30%', borderRadius: 6 }} />
            <View style={{ height: 8 }} />
            <Skeleton style={{ height: 80, borderRadius: 16 }} />
            <View style={{ height: 4 }} />
            <Skeleton style={{ height: 16, width: '100%', borderRadius: 6 }} />
            <Skeleton style={{ height: 16, width: '90%', borderRadius: 6 }} />
            <Skeleton style={{ height: 16, width: '60%', borderRadius: 6 }} />
          </View>
        </ScrollView>
      </View>
    );
  }
  if (!apiProduct) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top, height: 44 + insets.top }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} activeOpacity={0.8}>
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
  const liked = isFavorite(id || '');

  const abs = (u?: string | null) =>
    !u ? u : u.startsWith('/') ? `${API_URL}${u}` : u;
  const media: {
    uri: string;
    type: 'image' | 'video';
    videoUri?: string;
  }[] = apiProduct.images?.length
    ? apiProduct.images.map((img: any) => {
        const isVideo = img.type === 'video';
        const primary = abs(img.url) || '';
        const thumb = abs(img.thumbnailUrl) || undefined;
        return isVideo
          ? { uri: thumb ?? primary, type: 'video' as const, videoUri: primary }
          : { uri: primary, type: 'image' as const };
      })
    : [];
  const images = media.map((m) => m.uri);

  const priceNum = Number(apiProduct.price);
  const discountPct = apiProduct.discount ?? 0;
  const hasDiscount = priceNum > 0 && discountPct > 0 && discountPct < 100;
  const product = {
    id: apiProduct.id,
    title: apiProduct.title,
    subtitle: apiProduct.category?.label || '',
    price: hasDiscount
      ? Math.round(priceNum * (1 - discountPct / 100))
      : priceNum,
    originalPrice: hasDiscount ? fmtNumber(priceNum) : undefined,
    discount: hasDiscount ? `-${discountPct}%` : undefined,
    condition: apiProduct.condition || '',
    description: apiProduct.description || 'Sin descripción.',
    images,
    seller: {
      name: apiProduct.seller?.name || 'Vendedor',
      avatar: apiProduct.seller?.avatarUrl || undefined,
      rating: sellerAvg,
      verified: apiProduct.seller?.verified ?? false,
      plan: apiProduct.seller?.effectivePlan ?? apiProduct.seller?.plan ?? 'FREE',
      phone: apiProduct.seller?.phone || undefined
    },
    location: apiProduct.city || 'Guinea Ecuatorial',
    postedAgo: timeAgo(apiProduct.createdAt),
    views: apiProduct.views ?? 0,
    favorites: apiProduct.favoritesCount ?? 0,
    isBoosted: apiProduct.boostedUntil ? new Date(apiProduct.boostedUntil) > new Date() : false,
    attributes:
      apiProduct.attributes?.map((a: any) => ({ label: a.label, value: a.value })) || [],
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImage(index);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try { await Promise.all([refetchProduct(), refetchRating(), refetchRelated()]); } catch {}
    setRefreshing(false);
  };

  const { share } = useShare();
  const onShare = () =>
    share({ type: 'product', id: product.id, title: product.title, price: fmtNumber(product.price) });

  return (
    <View style={styles.root}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 44 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} activeOpacity={0.8}>
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
        contentContainerStyle={{ paddingTop: 44 + insets.top, paddingBottom: 100 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Gallery */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={styles.galleryScroll}>
            {media.length > 0 ? (
              media.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.9}
                  onPress={() => {
                    if (m.type === 'video' && m.videoUri) {
                      // No inline player yet — hand off to the system video app
                      // so users can at least watch it. Follow-up: inline
                      // <Video> with expo-av / expo-video.
                      Linking.openURL(m.videoUri).catch(() => {});
                    } else {
                      setActiveImage(i);
                      setGalleryOpen(true);
                    }
                  }}>
                  <Image source={{ uri: m.uri }} style={styles.galleryImage} />
                  {m.type === 'video' && (
                    <View style={styles.videoPlayOverlay} pointerEvents="none">
                      <View style={styles.videoPlayCircle}>
                        <Text style={styles.videoPlayIcon}>▶</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <ProductImage uri={null} style={styles.galleryImage} iconSize={48} />
            )}
          </ScrollView>

          {/* Favorite */}
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => { if (id) toggleFavorite(id); }}
            activeOpacity={0.85}>
            <Heart
              size={20}
              color={liked ? '#e53935' : '#ffffff'}
              fill={liked ? '#e53935' : 'transparent'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>

          {/* Dots */}
          {media.length > 1 && (
            <View style={styles.dots}>
              {media.map((_, i) => (
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
          {product.isBoosted && (
            <View style={styles.boostedPill}>
              <Zap size={12} color="#7C3AED" fill="#7C3AED" strokeWidth={2} />
              <Text style={styles.boostedPillText}>Anuncio destacado</Text>
            </View>
          )}
          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.tagLine}>
            <Text style={styles.tagText}>{product.subtitle}</Text>
            {(operationLabel || svc?.offerType) && (
              <>
                <View style={styles.tagDot} />
                <Text style={[
                  styles.tagText,
                  styles.tagOp,
                  veh && { color: '#8c5000' },
                  svc && { color: '#006b5e' },
                ]}>
                  {svc?.offerType || operationLabel}
                </Text>
              </>
            )}
            {product.condition ? (
              <>
                <View style={styles.tagDot} />
                <Text style={styles.tagText}>{product.condition}</Text>
              </>
            ) : null}
          </View>
          
          {priceNum > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.price}>{fmtNumber(product.price)}</Text>
            {product.originalPrice && (
              <Text style={styles.priceOriginal}>{product.originalPrice}</Text>
            )}
            {product.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{product.discount}</Text>
              </View>
            )}
          </View>
          )}

          {/* Location + meta inline */}
          <View style={styles.metaInlineRow}>
            <View style={styles.metaInlineItem}>
              <MapPin size={13} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
              {prop && prop.address && ( <Text style={styles.metaInlineText}>{prop.address}&nbsp;,</Text>)}
              <Text style={styles.metaInlineText}>{product.location}</Text>
            </View>
            <View style={styles.metaInlineItem}>
              <Eye size={13} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
              <Text style={styles.metaInlineText}>{product.views}</Text>
            </View>
            <View style={styles.metaInlineItem}>
              <Heart size={13} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
              <Text style={styles.metaInlineText}>{product.favorites}</Text>
            </View>
            <View style={styles.metaInlineItem}>
              <Clock size={13} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
              <Text style={styles.metaInlineText}>{product.postedAgo}</Text>
            </View>
          </View>

          {/* Seller mini */}
          {sellerId !== me?.id && (
            <TouchableOpacity
              style={styles.sellerMini}
              activeOpacity={0.7}
              disabled={!sellerId}
              onPress={() =>
                sellerId &&
                router.push({ pathname: '/user/[id]', params: { id: sellerId } })
              }>
              <View style={styles.sellerMiniAvatarWrap}>
                <Image source={{ uri: product.seller.avatar }} style={styles.sellerMiniAvatar} />
                {product.seller.verified && (
                  <View style={styles.sellerMiniVerified}>
                    <BadgeCheck size={11} color="#ffffff" fill={colors.primary} />
                  </View>
                )}
              </View>
              <View style={styles.sellerMiniInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.sellerMiniName}>{product.seller.name}</Text>
                  {product.seller.plan === 'PREMIUM' && (
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown size={9} color="#ffffff" fill="#ffffff" strokeWidth={2} />
                    </View>
                  )}
                  {product.seller.plan === 'STAR' && (
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center' }}>
                      <Star size={9} color="#ffffff" fill="#ffffff" strokeWidth={2} />
                    </View>
                  )}
                </View>
                <View style={styles.sellerMiniRatingRow}>
                  <Star size={11} color={colors.tertiaryContainer} fill={colors.tertiaryContainer} strokeWidth={0} />
                  <Text style={styles.sellerMiniRating}>{product.seller.rating.toFixed(1)}</Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.onSurfaceVariant + '88'} strokeWidth={1.8} />
            </TouchableOpacity>
          )}
          
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text
            style={styles.description}
            numberOfLines={descExpanded ? undefined : 6}
            onTextLayout={(e) => {
              if (descNeedsToggle === null && e.nativeEvent.lines.length >= 6)
                setDescNeedsToggle(true);
            }}>
            {product.description}
          </Text>
          {descNeedsToggle && (
            <TouchableOpacity
              style={styles.descToggle}
              activeOpacity={0.7}
              onPress={() => setDescExpanded((v) => !v)}>
              <Text style={styles.descToggleText}>
                {descExpanded ? 'Ver menos' : 'Ver más'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.attrGrid}>
            {product.attributes.map((attr: { label: string; value: string }) => (
              <View key={attr.label} style={styles.attrCard}>
                <Text style={styles.attrLabel}>{attr.label}</Text>
                <Text style={styles.attrValue}>{attr.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Marketplace detail ── */}
        {mkt && (mkt.brand || mkt.model || (mkt.colors && mkt.colors.length > 0)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles del producto</Text>
            <View style={styles.specGrid}>
              {mkt.brand ? (
                <View style={styles.specCell}>
                  <Text style={styles.specCellLabel}>Marca</Text>
                  <Text style={styles.specCellValue}>{mkt.brand}</Text>
                </View>
              ) : null}
              {mkt.model ? (
                <View style={styles.specCell}>
                  <Text style={styles.specCellLabel}>Modelo</Text>
                  <Text style={styles.specCellValue}>{mkt.model}</Text>
                </View>
              ) : null}
            </View>
            {mkt.colors && mkt.colors.length > 0 && (
              <ColorsCell colors={mkt.colors} styles={styles} />
            )}
          </View>
        )}

        {/* ── Vehicle detail ── */}
        {veh && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ficha técnica</Text>
            <View style={styles.specGrid}>
              {veh.year != null && (
                <View style={styles.specIconCell}>
                  <Calendar size={16} color="#8c5000" strokeWidth={1.5} />
                  <View>
                    <Text style={styles.specCellLabel}>Año</Text>
                    <Text style={styles.specCellValue}>{veh.year}</Text>
                  </View>
                </View>
              )}
              {veh.kilometrage != null && (
                <View style={styles.specIconCell}>
                  <Gauge size={16} color="#8c5000" strokeWidth={1.5} />
                  <View>
                    <Text style={styles.specCellLabel}>Kilometraje</Text>
                    <Text style={styles.specCellValue}>{Number(veh.kilometrage).toLocaleString()} km</Text>
                  </View>
                </View>
              )}
              {veh.engine ? (
                <View style={styles.specIconCell}>
                  <Fuel size={16} color="#8c5000" strokeWidth={1.5} />
                  <View>
                    <Text style={styles.specCellLabel}>Motor</Text>
                    <Text style={styles.specCellValue}>{veh.engine}</Text>
                  </View>
                </View>
              ) : null}
              {veh.transmission ? (
                <View style={styles.specIconCell}>
                  <Cog size={16} color="#8c5000" strokeWidth={1.5} />
                  <View>
                    <Text style={styles.specCellLabel}>Transmisión</Text>
                    <Text style={styles.specCellValue}>{veh.transmission}</Text>
                  </View>
                </View>
              ) : null}
            </View>
            {(veh.brand || veh.model) && (
              <View style={styles.specGrid}>
                {veh.brand ? (
                  <View style={styles.specCell}>
                    <Text style={styles.specCellLabel}>Marca</Text>
                    <Text style={styles.specCellValue}>{veh.brand}</Text>
                  </View>
                ) : null}
                {veh.model ? (
                  <View style={styles.specCell}>
                    <Text style={styles.specCellLabel}>Modelo</Text>
                    <Text style={styles.specCellValue}>{veh.model}</Text>
                  </View>
                ) : null}
              </View>
            )}
            {veh.colors && veh.colors.length > 0 && (
              <ColorsCell colors={veh.colors} styles={styles} />
            )}
          </View>
        )}

        {/* ── Property detail ── */}
        {prop && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Características</Text>
            <View style={styles.specGrid}>
              {prop.bedrooms > 0 && (
                <View style={styles.specIconCell}>
                  <Bed size={16} color="#5F5E5A" strokeWidth={1.5} />
                  <View>
                    <Text style={styles.specCellLabel}>Dormitorios</Text>
                    <Text style={styles.specCellValue}>{prop.bedrooms}</Text>
                  </View>
                </View>
              )}
              {prop.bathrooms > 0 && (
                <View style={styles.specIconCell}>
                  <Bath size={16} color="#5F5E5A" strokeWidth={1.5} />
                  <View>
                    <Text style={styles.specCellLabel}>Baños</Text>
                    <Text style={styles.specCellValue}>{prop.bathrooms}</Text>
                  </View>
                </View>
              )}
              {prop.surface > 0 && (
                <View style={styles.specIconCell}>
                  <Ruler size={16} color="#5F5E5A" strokeWidth={1.5} />
                  <View>
                    <Text style={styles.specCellLabel}>Superficie</Text>
                    <Text style={styles.specCellValue}>{prop.surface} m²</Text>
                  </View>
                </View>
              )}
              {prop.floor > 0 && (
                <View style={styles.specIconCell}>
                  <Building size={16} color="#5F5E5A" strokeWidth={1.5} />
                  <View>
                    <Text style={styles.specCellLabel}>Planta</Text>
                    <Text style={styles.specCellValue}>{prop.floor}ª</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Job detail ── */}
        {job?.link && (
          <TouchableOpacity
            style={styles.jobLink}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(job.link!)}>
            <ExternalLink size={14} color={colors.primary} strokeWidth={1.8} />
            <Text style={styles.jobLinkText}>Ir al sitio web</Text>
          </TouchableOpacity>
        )}

        {/* Destacar anuncio — CTA para el propietario */}
        {sellerId === me?.id && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.boostCard}
              activeOpacity={0.8}
              onPress={() => {
                const msg = encodeURIComponent(
                  `Hola, quiero destacar mi anuncio "${product.title}" (${SHARE_URL}/product/${product.id}) durante 7 días.`,
                );
                Linking.openURL(`https://wa.me/${contactNumber}?text=${msg}`).catch(() =>
                  Alert.alert('Error', 'No se pudo abrir WhatsApp.'),
                );
              }}>
              <View style={styles.boostIconWrap}>
                <ArrowUpCircle size={20} color="#7C3AED" strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.boostTitle}>Destacar este anuncio</Text>
                <Text style={styles.boostDesc}>
                  Aparece en las primeras posiciones durante 7 días por solo 1.000 XAF
                </Text>
              </View>
              <MessageCircle size={16} color="#7C3AED" strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        )}

        {/* Reportar anuncio */}
        {sellerId !== me?.id && (
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
                Denunciar anuncio
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Related products */}
        {(relatedItems.length > 0 || relatedLoading) && (
          <View style={{ marginTop: 24 }}>
            <ProductRail
              title="Anuncios relacionados"
              icon="tag"
              items={relatedItems}
              loading={relatedLoading}
              cardWidth={160}
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => { registerContactOnce(); setModal('call'); }}
          activeOpacity={0.88}>
          <Phone size={20} color="#ffffff" strokeWidth={2} />
          <Text style={styles.callBtnText}>Llamar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={() => { registerContactOnce(); setModal('whatsapp'); }}
          activeOpacity={0.88}>
          <WhatsAppSvg />
          <Text style={styles.whatsappBtnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      <SafetyModal
        visible={modal !== null}
        mode={modal ?? 'tips'}
        onClose={() => setModal(null)}
        phoneNumber={product.seller.phone}
        whatsappNumber={product.seller.phone?.replace(/[^0-9]/g, '')}
        whatsappMessage={`Hola, me interesa tu anuncio: ${product.title} — ${SHARE_URL}/product/${product.id}`}
      />

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        type="product"
        targetId={id || ''}
      />

      <ImageViewing
        images={media
          .filter((m) => m.type === 'image')
          .map((m) => ({ uri: m.uri }))}
        imageIndex={activeImage}
        visible={galleryOpen}
        onRequestClose={() => setGalleryOpen(false)}
        HeaderComponent={() => (
          <View style={{ paddingTop: insets.top + 8, paddingRight: 16, alignItems: 'flex-end' }}>
            <TouchableOpacity
              onPress={() => setGalleryOpen(false)}
              activeOpacity={0.8}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', lineHeight: 20 }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
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
    videoPlayOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.15)',
    },
    videoPlayCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    videoPlayIcon: {
      color: '#ffffff',
      fontSize: 30,
      marginLeft: 4,
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
    tagLine: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    tagDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.onSurfaceVariant + '66',
    },
    tagText: {
      fontFamily: 'Manrope-Regular',
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    tagOp: {
      fontFamily: 'Manrope-SemiBold',
    },
    title: {
      fontFamily: 'Manrope-Bold',
      fontSize: 24,
      color: colors.onSurface,
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 10,
    },
    price: {
      fontFamily: 'Manrope-Bold',
      fontSize: 28,
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
    metaInlineRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 12,
      marginTop: 4,
    },
    metaInlineItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaInlineText: {
      fontFamily: 'Manrope-Regular',
      fontSize: 13,
      color: colors.onSurfaceVariant + '99',
    },
    sellerMini: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 12,
    },
    sellerMiniAvatarWrap: {
      position: 'relative',
    },
    sellerMiniAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
    },
    sellerMiniVerified: {
      position: 'absolute',
      bottom: -1,
      right: -1,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sellerMiniInfo: {
      flex: 1,
    },
    sellerMiniName: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 13,
      color: colors.onSurface,
    },
    sellerMiniRatingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 1,
    },
    sellerMiniRating: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 11,
      color: colors.tertiary,
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
    descToggle: {
      marginTop: 6,
    },
    descToggleText: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 14,
      color: colors.primary,
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
    specGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    specCell: {
      width: '47%',
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 12,
      padding: 12,
    },
    specIconCell: {
      width: '47%',
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    specCellLabel: {
      fontFamily: 'Manrope-Regular',
      fontSize: 11,
      color: colors.onSurfaceVariant,
    },
    specCellValue: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 14,
      color: colors.onSurface,
      marginTop: 2,
    },
    colorsCell: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 12,
      padding: 12,
      marginTop: 10,
    },
    colorsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    colorSwatchLg: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 0.5,
      borderColor: 'rgba(0,0,0,0.15)',
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 12,
    },
    addressText: {
      fontFamily: 'Manrope-Regular',
      fontSize: 13,
      color: colors.onSurfaceVariant,
      flex: 1,
    },
    svcCard: {
      backgroundColor: '#006b5e0d',
      borderLeftWidth: 3,
      borderLeftColor: '#006b5e',
      padding: 12,
      borderRadius: 0,
    },
    svcCardValue: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 15,
      color: colors.onSurface,
      marginTop: 2,
    },
    boostedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: '#7C3AED' + '14',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      marginBottom: 8,
    },
    boostedPillText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 11,
      color: '#7C3AED',
      letterSpacing: 0.3,
    },
    boostCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#7C3AED' + '0a',
      borderRadius: 14,
      padding: 16,
      borderWidth: 0.5,
      borderColor: '#7C3AED' + '22',
    },
    boostIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#7C3AED' + '18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    boostTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 14,
      color: colors.onSurface,
      marginBottom: 2,
    },
    boostDesc: {
      fontFamily: 'Manrope-Regular',
      fontSize: 12,
      color: colors.onSurfaceVariant,
      lineHeight: 17,
    },
    jobLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    jobLinkText: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 14,
      color: colors.primary,
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
