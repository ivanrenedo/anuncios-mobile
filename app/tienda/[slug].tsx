import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import {
  ChevronLeft,
  Crown,
  BadgeCheck,
  MapPin,
  MessageCircle,
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { GET_USER, PINNED_PRODUCTS } from '@/graphql/queries';
import { useProductsBySeller } from '@/hooks/useProducts';
import { API_URL } from '@/lib/config';
import RipplePress from '@/components/RipplePress';
import Spinner from '@/components/Spinner';
import ProductCard, { fmtPrice } from '@/components/ProductCard';
import { timeAgo } from '@/lib/exploreUtils';

/**
 * v2 Fase 7b.1 — Premium storefront móvil.
 *
 * Slug acepta el user.id (vanity URLs quedan para v2.1 cuando `User.slug`
 * exista). Si el usuario no es Premium activo → redirect a /user/[id] para
 * que la ventaja "tienda propia" no aparezca en vendedores sin el plan.
 */
export default function TiendaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { slug } = useLocalSearchParams<{ slug?: string }>();

  const { data: userData, loading: userLoading } = useQuery<any>(GET_USER, {
    variables: { id: slug },
    skip: !slug,
    fetchPolicy: 'cache-and-network',
  });
  const user = userData?.user;

  const { products, loading: prodLoading } = useProductsBySeller(slug ?? '');
  const { data: pinnedData } = useQuery<any>(PINNED_PRODUCTS, {
    variables: { userId: slug },
    skip: !slug,
    fetchPolicy: 'cache-and-network',
  });
  const pinnedProducts: any[] = pinnedData?.pinnedProducts ?? [];

  const isPremiumActive =
    user &&
    user.plan === 'PREMIUM' &&
    (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());

  const activeProducts = useMemo(
    () => (products ?? []).filter((p: any) => p.status !== 'hide'),
    [products],
  );
  const pinnedIds = useMemo(
    () => new Set(pinnedProducts.map((p) => p.id)),
    [pinnedProducts],
  );

  const byCategory = useMemo(() => {
    const buckets = new Map<string, any[]>();
    for (const p of activeProducts) {
      if (pinnedIds.has(p.id)) continue;
      const label = p.category?.label ?? 'Otros';
      const bucket = buckets.get(label) ?? [];
      bucket.push(p);
      buckets.set(label, bucket);
    }
    return Array.from(buckets.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [activeProducts, pinnedIds]);

  if (!slug) return <Redirect href="/" />;

  if (userLoading || !user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Spinner color={colors.primary} />
      </View>
    );
  }

  if (!isPremiumActive) {
    // Non-Premium vendors no tienen tienda; bounce al perfil normal.
    return <Redirect href={{ pathname: '/user/[id]', params: { id: slug } }} />;
  }

  const verifiedSince = user.businessVerifiedAt
    ? new Date(user.businessVerifiedAt).toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  const mapItem = (p: any) => {
    const img = p.images?.[0]?.url || '';
    return {
      id: p.id,
      title: p.title,
      price: fmtPrice(Number(p.price)),
      priceRaw: Number(p.price),
      condition: p.condition,
      location: p.city || '',
      image: img.startsWith('/') ? `${API_URL}${img}` : img,
      discount: p.discount,
      isBoosted: p.boostedUntil ? new Date(p.boostedUntil) > new Date() : false,
      postedAgo: timeAgo(p.createdAt),
      priceReducedUntil: p.priceReducedUntil ?? null,
      sellerPlan: 'PREMIUM' as const,
    };
  };

  const openWhatsApp = () => {
    if (!user.phone) return;
    const msg = encodeURIComponent(
      `Hola, vi tu tienda en Bomelh — ${user.name}`,
    );
    Linking.openURL(
      `https://wa.me/${user.phone.replace(/[^0-9]/g, '')}?text=${msg}`,
    ).catch(() => Alert.alert('Error', 'No se pudo abrir WhatsApp.'));
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Cover + back button */}
        <View style={{ position: 'relative' }}>
          {user.coverUrl ? (
            <Image
              source={{
                uri: user.coverUrl.startsWith('/')
                  ? `${API_URL}${user.coverUrl}`
                  : user.coverUrl,
              }}
              style={styles.cover}
            />
          ) : (
            <View style={[styles.cover, styles.coverFallback]} />
          )}
          <RipplePress
            style={[styles.backBtn, { top: insets.top + 8 }]}
            borderRadius={20}
            rippleColor="rgba(255,255,255,0.2)"
            onPress={() => router.back()}>
            <ChevronLeft size={22} color="#ffffff" strokeWidth={2} />
          </RipplePress>
        </View>

        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            {user.avatarUrl ? (
              <Image
                source={{
                  uri: user.avatarUrl.startsWith('/')
                    ? `${API_URL}${user.avatarUrl}`
                    : user.avatarUrl,
                }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{user.name?.charAt(0)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {user.name}
                </Text>
                <View style={styles.premiumChip}>
                  <Crown size={11} color="#ffffff" strokeWidth={2.5} />
                  <Text style={styles.premiumChipText}>Premium</Text>
                </View>
                {user.verified && (
                  <BadgeCheck size={16} color={colors.primary} strokeWidth={2} />
                )}
              </View>
              {verifiedSince && (
                <Text style={styles.verifiedSince}>
                  Verificado desde {verifiedSince}
                </Text>
              )}
              {user.location && (
                <View style={styles.locationRow}>
                  <MapPin size={12} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                  <Text style={styles.location}>{user.location}</Text>
                </View>
              )}
              {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
              {user.phone && (
                <RipplePress
                  style={styles.waBtn}
                  borderRadius={12}
                  rippleColor="rgba(255,255,255,0.2)"
                  onPress={openWhatsApp}>
                  <MessageCircle size={14} color="#ffffff" strokeWidth={2} />
                  <Text style={styles.waBtnText}>Escribir por WhatsApp</Text>
                </RipplePress>
              )}
            </View>
          </View>
        </View>

        {/* Pinned */}
        {pinnedProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📌 Destacados de la tienda</Text>
            <View style={styles.gridRow2}>
              {pinnedProducts.map(mapItem).map((item: any) => (
                <View key={item.id} style={styles.gridCell}>
                  <ProductCard
                    item={item}
                    onPress={() =>
                      router.push({ pathname: '/product/[id]', params: { id: item.id } })
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Catalogue by category */}
        {prodLoading && activeProducts.length === 0 && (
          <View style={styles.center}>
            <Spinner color={colors.primary} />
          </View>
        )}
        {!prodLoading &&
          byCategory.length === 0 &&
          pinnedProducts.length === 0 && (
            <Text style={styles.empty}>
              Esta tienda aún no tiene anuncios publicados.
            </Text>
          )}
        {byCategory.map(([label, items]) => (
          <View key={label} style={styles.section}>
            <Text style={styles.sectionTitle}>{label}</Text>
            <View style={styles.gridRow2}>
              {items.map(mapItem).map((item: any) => (
                <View key={item.id} style={styles.gridCell}>
                  <ProductCard
                    item={item}
                    onPress={() =>
                      router.push({ pathname: '/product/[id]', params: { id: item.id } })
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    cover: { width: '100%', height: 180 },
    coverFallback: { backgroundColor: colors.primary },
    backBtn: {
      position: 'absolute',
      left: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCard: {
      backgroundColor: colors.surfaceContainerLowest,
      marginHorizontal: 16,
      marginTop: -32,
      borderRadius: 20,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    headerRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
    avatar: { width: 72, height: 72, borderRadius: 18 },
    avatarFallback: {
      backgroundColor: colors.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontFamily: 'Manrope-Bold',
      fontSize: 28,
      color: colors.primary,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    name: {
      fontFamily: 'Manrope-Bold',
      fontSize: 20,
      color: colors.onSurface,
      letterSpacing: -0.3,
      flexShrink: 1,
    },
    premiumChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#7C3AED',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    premiumChipText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 11,
      color: '#ffffff',
    },
    verifiedSince: {
      fontFamily: 'Manrope-Bold',
      fontSize: 10,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 4,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    location: {
      fontFamily: 'Manrope-Regular',
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    bio: {
      fontFamily: 'Manrope-Regular',
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 8,
      lineHeight: 19,
    },
    waBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      marginTop: 10,
    },
    waBtnText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 13,
      color: '#ffffff',
    },
    section: { paddingHorizontal: 16, paddingTop: 24 },
    sectionTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 16,
      color: colors.onSurface,
      marginBottom: 12,
      letterSpacing: -0.2,
    },
    gridRow2: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    gridCell: { width: '48%' },
    empty: {
      fontFamily: 'Manrope-Regular',
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      paddingVertical: 40,
      paddingHorizontal: 16,
    },
  });
