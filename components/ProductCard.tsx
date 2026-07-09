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
import { Heart, MapPin, BadgeCheck, Clock } from 'lucide-react-native';
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
  promo?: string;
  promoColor?: string;
  discount?: number;
  priceRaw?: number;
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
}

export function fmtNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')} mill`;
  return Math.round(n).toLocaleString('es');
}
 
export function fmtPrice(n: number) {
  return `${fmtNumber(n)} XFA`;
}

export default function ProductCard({
  item,
  liked = false,
  onLike,
  onPress,
  width,
  accentColor,
  style,
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

  const tags: { label: string; bg: string; color: string }[] = [];
  if (item.operation) tags.push({ label: item.operation, bg: '#E1F5EE', color: '#0F6E56' });
  if (item.offerType) tags.push({ label: item.offerType, bg: '#EEEDFE', color: '#534AB7' });
  if (item.categoryLabel) tags.push({ label: item.categoryLabel, bg: '#E6F1FB', color: '#185FA5' });
  

  return (
    <TouchableOpacity
      style={[width ? { width } : styles.flex, style]}
      activeOpacity={0.92}
      onPress={onPress}>
      <View style={styles.imageWrap}>
        <ProductImage uri={item.image} style={styles.image} />
        {!!item.promo && (
          <View style={[styles.badge, { backgroundColor: item.promoColor }]}>
            <Text style={styles.badgeText}>{item.promo}</Text>
          </View>
        )}
        {!item.promo && hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{item.discount}%</Text>
          </View>
        )}
        {item.condition && (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{item.condition}</Text>
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
      {tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((t) => (
            <View key={t.label} style={[styles.tag, { backgroundColor: t.bg }]}>
              <Text style={[styles.tagText, { color: t.color }]}>{t.label}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      {showPrice && (hasDiscount ? (
        <View style={styles.priceRow}>
          <Text
            style={[styles.price, { color: colors.error }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}>
            {finalPrice}
          </Text>
          <Text style={styles.priceOriginal} numberOfLines={1}>
            {item.price}
          </Text>
        </View>
      ) : (
        <Text
          style={[styles.price, accentColor ? { color: accentColor } : null]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}>
          {item.price}
        </Text>
      ))}
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
    </TouchableOpacity>
  );
}

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
  },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    marginBottom: 8,
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
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  soldBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#ffffff',
    letterSpacing: 0.5,
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
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
  title: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.primary,
    lineHeight: 20,
  },
  priceOriginal: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant + '88',
    textDecorationLine: 'line-through',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
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
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 8,
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
    flex: 1,
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
});
