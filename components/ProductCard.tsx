import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MapPin, BadgeCheck, Clock, Star, Crown, Zap, Flame, Pin } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import Skeleton from '@/components/Skeleton';
import ProductImage from '@/components/ProductImage';
import { useAuth } from '@/hooks/useAuth';

export interface ProductCardItem {
  id: string;
  title: string;
  price: string;
  image: string;
  avatar?: string;
  seller?: string;
  sellerId?: string;
  location?: string;
  condition?: string;
  verified?: boolean;
  sellerPlan?: 'FREE' | 'BASIC' | 'STAR' | 'PREMIUM';
  isBoosted?: boolean;
  promo?: string;
  promoColor?: string;
  discount?: number;
  priceRaw?: number;
  /** v2 Fase 7a — server-authoritative 48h chip anchor. Card renders the
   *  chip only if this is in the future AND sellerPlan ∈ {STAR, PREMIUM}. */
  priceReducedUntil?: string | null;
  categoryLabel?: string;
  operation?: string;
  offerType?: string;
  postedAgo?: string;
}

interface Props {
  item: ProductCardItem;
  liked?: boolean;
  onLike?: () => void;
  onPress: () => void;
  /** Fixed width (for horizontal scrolls). Omit to use flex:1 inside a row. */
  width?: number;
  /** Override the price color (e.g. category accent) */
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
  /** v2 Fase 11.2 — muestra el badge 📌 en la esquina cuando el producto
   *  está fijado en el perfil del vendedor. */
  isPinned?: boolean;
  /** v2 Fase 11.3 — muestra el badge ⚡ cuando el producto está en el pool
   *  de auto-bump del vendedor. */
  isAutoBumped?: boolean;
}

export function fmtNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')} mill`;
  return Math.round(n).toLocaleString('es');
}
 
export function fmtPrice(n: number) {
  return `${fmtNumber(n)} XFA`;
}

function ProductCardImpl({
  item,
  liked = false,
  onLike,
  onPress,
  width,
  accentColor,
  style,
  isPinned = false,
  isAutoBumped = false,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  const { user } = useAuth();

  const showPrice = (item.priceRaw ?? 0) > 0;
  const hasDiscount = showPrice && (item.discount ?? 0) > 0 && (item.discount ?? 0) < 100;
  const finalPrice = hasDiscount && item.priceRaw
    ? fmtPrice(Math.round(item.priceRaw * (1 - (item.discount ?? 0) / 100)))
    : item.price;

  // v2 Fase 7a — chip "Rebajado" (48h). Gate por plan del vendedor: solo
  // STAR/PREMIUM lo enseñan aunque el timestamp esté seteado en cualquier
  // producto rebajado (BASIC/FREE nunca).
  const showRebajadoChip =
    !!item.priceReducedUntil &&
    new Date(item.priceReducedUntil) > new Date() &&
    (item.sellerPlan === 'STAR' || item.sellerPlan === 'PREMIUM');

  const tags: { label: string; bg: string; color: string }[] = [];
  if (item.operation) tags.push({ label: item.operation, bg: '#E1F5EE', color: '#0F6E56' });
  if (item.offerType) tags.push({ label: item.offerType, bg: '#EEEDFE', color: '#534AB7' });
  if (item.categoryLabel) tags.push({ label: item.categoryLabel, bg: '#E6F1FB', color: '#185FA5' });
 
  // Option A boost design: badges stack below the "Destacado" pill, so every
  // top-left overlay shifts one slot down per layer above it.
  const overlayLayers =
    (item.isBoosted ? 1 : 0) + (item.promo || hasDiscount ? 1 : 0);

  return (
    <TouchableOpacity
      style={[width ? { width } : styles.flex, item.isBoosted && styles.isBoosted, style ]}
      activeOpacity={0.92}
      onPress={onPress}>
      <View style={styles.imageWrap}>
        <ProductImage uri={item.image} style={styles.image} />
        {item.isBoosted && (
          <View style={styles.boostedBadge}>
            <Zap size={10} color="#ffffff" fill="#ffffff" strokeWidth={2} />
            <Text style={styles.boostedText}>Destacado</Text>
          </View>
        )}
        {!!item.promo && (
          <View style={[styles.badge, { backgroundColor: item.promoColor }, item.isBoosted && { top: 34 }]}>
            <Text style={styles.badgeText}>{item.promo}</Text>
          </View>
        )}
        {!item.promo && hasDiscount && (
          <View style={[styles.discountBadge, item.isBoosted && { top: 34 }]}>
            <Text style={styles.discountBadgeText}>-{item.discount}%</Text>
          </View>
        )}
        {tags.length > 0 && (
          <View style={[styles.tagsOverlay, overlayLayers > 0 && { top: 8 + overlayLayers * 26 }]}>
            {tags.map((t) => (
              <View key={t.label} style={[styles.tag, { backgroundColor: t.bg + 'ea' }]}>
                <Text style={[styles.tagText, { color: t.color }]}>{t.label}</Text>
              </View>
            ))}
          </View>
        )}
        {item.condition && (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{item.condition}</Text>
          </View>
        )}
        {/* v2 Fase 11.2/11.3 — badges pin y auto-bump del owner */}
        {(isPinned || isAutoBumped) && (
          <View style={styles.ownerBadgesCol}>
            {isPinned && (
              <View style={[styles.ownerBadge, { backgroundColor: colors.primary }]}>
                <Pin size={11} color="#ffffff" fill="#ffffff" strokeWidth={2.5} />
              </View>
            )}
            {isAutoBumped && (
              <View style={[styles.ownerBadge, { backgroundColor: '#F5A623' }]}>
                <Zap size={11} color="#ffffff" fill="#ffffff" strokeWidth={2.5} />
              </View>
            )}
          </View>
        )}
        {onLike && ( 
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={onLike}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Heart
              size={20}
              color={liked ? colors.error : '#ffffff'}
              fill={liked ? colors.error : 'transparent'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.infoZone}>
        {showPrice && (hasDiscount ? (
          <View style={styles.priceRow}>
            <Text
              style={[styles.price, { color: colors.error }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}>
              {finalPrice}
            </Text>
            <Text style={styles.priceOriginal}>
              {item.price}
            </Text>
            {showRebajadoChip && (
              <View style={styles.rebajadoChip}>
                <Flame size={9} color="#EA580C" strokeWidth={2.5} />
                <Text style={styles.rebajadoChipText}>Rebajado</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.priceRow}>
            <Text
              style={[styles.price, accentColor ? { color: accentColor } : null]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}>
              {item.price}
            </Text>
            {showRebajadoChip && (
              <View style={styles.rebajadoChip}>
                <Flame size={9} color="#EA580C" strokeWidth={2.5} />
                <Text style={styles.rebajadoChipText}>Rebajado</Text>
              </View>
            )}
          </View>
        ))}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {(item.location || item.postedAgo) && (
          <View style={styles.locationRow}>
            {item.location && (
              <>
                <MapPin size={11} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
                <Text style={styles.location} numberOfLines={1}>
                  {item.location}
                </Text>
              </>
            )}
            {item.location && item.postedAgo && (
              <Text style={styles.metaDot}>·</Text>
            )}
            {item.postedAgo && (
              <>
                <Clock size={10} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
                <Text style={styles.location} numberOfLines={1}>
                  {item.postedAgo}
                </Text>
              </>
            )}
          </View>
        )}
        {item.seller && (
          <TouchableOpacity
            style={styles.sellerRow}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              user?.id === item.sellerId ? router.push('/(tabs)/profile')  : router.push(`/user/${item.sellerId}`)
            }}>
            {item.avatar && <Image source={{ uri: item.avatar }} style={styles.avatar} />}
            <Text style={styles.sellerName} numberOfLines={1}>
              {item.seller}
            </Text>
            {item.sellerPlan === 'PREMIUM' && (
              <View style={styles.planBadgePremium}>
                <Crown size={9} color="#ffffff" fill="#ffffff" strokeWidth={2} />
              </View>
            )}
            {item.sellerPlan === 'STAR' && ( 
              <View style={styles.planBadgeStar}>
                <Star size={9} color="#ffffff" fill="#ffffff" strokeWidth={2} />
              </View>
            )}
            {item.verified && (
              <BadgeCheck
                size={12}
                color="#ffffff"
                style={styles.verified}
                fill={colors.primary}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * Memoized so re-renders of the parent list (favorite toggle, scroll, etc.)
 * skip cards whose props didn't change. `item` is a fresh object per parent
 * render, so we do a shallow compare of the fields the card actually reads.
 *
 * `onLike` and `onPress` are intentionally NOT compared: every caller passes
 * a fresh inline arrow (`() => toggleFavorite(item.id)`, `() => router.push(...)`),
 * so referential comparison would always miss and defeat the memo. Their
 * behavior is a pure function of `item.id`, so skipping when the item is
 * unchanged is safe in this codebase.
 */
const ProductCard = React.memo(ProductCardImpl, (prev, next) => {
  if (prev.liked !== next.liked) return false;
  if (prev.width !== next.width) return false;
  if (prev.accentColor !== next.accentColor) return false;
  const a = prev.item;
  const b = next.item;
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.price === b.price &&
    a.image === b.image &&
    a.avatar === b.avatar &&
    a.seller === b.seller &&
    a.sellerId === b.sellerId &&
    a.location === b.location &&
    a.condition === b.condition &&
    a.verified === b.verified &&
    a.sellerPlan === b.sellerPlan &&
    a.isBoosted === b.isBoosted &&
    a.promo === b.promo &&
    a.discount === b.discount &&
    a.priceRaw === b.priceRaw &&
    a.categoryLabel === b.categoryLabel &&
    a.operation === b.operation &&
    a.offerType === b.offerType &&
    a.postedAgo === b.postedAgo
  );
});

export default ProductCard;

/** Loading placeholder matching ProductCard's shape (image + 2 text lines). */
export function ProductCardSkeleton({ width }: { width?: number }) {
  return (
    <View style={width ? { width } : { flex: 1 }}>
      <Skeleton style={{ aspectRatio: 1, borderRadius: 16, marginBottom: 8 }} />
      <Skeleton style={{ height: 16, width: '90%', borderRadius: 6, marginBottom: 6 }} />
      <Skeleton style={{ height: 16, width: '55%', borderRadius: 6 }} />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  flex: {
    flex: 1,
    width: '100%'
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    marginBottom: 10,
    position: 'relative',
    backgroundColor: colors.surfaceContainerLow,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  conditionText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 10,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 8,
  },
  discountBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  tagsOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    maxWidth: '70%',
    zIndex: 8,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 10,
  },
  infoZone: {
    flexGrow: 1,
    gap: 4,
    paddingHorizontal: 6,
    paddingBottom: 2
  },
  title: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  price: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: colors.primary,
    lineHeight: 22
  },
  priceOriginal: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant + '88',
    textDecorationLine: 'line-through',
  },
  ownerBadgesCol: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    flexDirection: 'column',
    gap: 4,
  },
  ownerBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  rebajadoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#EA580C22',
  },
  rebajadoChipText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 9,
    color: '#EA580C',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 11,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap'
  },
  location: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant + '99',
  },
  metaDot: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant + '66',
    marginHorizontal: 2,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
    marginBottom: 6,
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '33',
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  sellerName: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    width: 90
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
    zIndex: 8
  },
  verified: {
    position: "absolute",
    bottom: -4,
    left: 12,
    zIndex: 8
  },
  badgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#ffffff',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  boostedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    zIndex: 9,
  },
  boostedText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 9,
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  planBadgeStar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBadgePremium: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  isBoosted: {
    boxShadow: '#7C3AED 0px 1px 1px, #7C3AED 0px 0px 1px 1px',
    borderRadius: 16,
    position: 'relative',
  }
});
