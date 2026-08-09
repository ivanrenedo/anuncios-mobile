import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Settings,
  Star,
  MapPin,
  ChevronRight,
  BadgeCheck,
  Share2,
  Mail,
  Phone,
  Lock,
  HelpCircle,
  LogOut,
  Package,
  Pencil,
  Trash2,
  ShieldCheck,
  FileText,
  Users,
  User,
  UserCheck,
  LogIn,
  X,
  Search,
  ArrowDownUp,
  ChevronDown,
  Crown,
  Zap,
  CreditCard,
  Eye,
  Heart,
  TrendingUp,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';
import ProductCard, { fmtPrice, fmtNumber } from '@/components/ProductCard';
import PlanFeaturesPanel from '@/components/PlanFeaturesPanel';
import Skeleton from '@/components/Skeleton';
import Spinner from '@/components/Spinner';
import SettingsModal, { Row, Section } from '@/components/SettingsModal';
import { useProfile, useDeleteAccount } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useProductsBySeller, useDeleteProduct, useMyViewsDaily } from '@/hooks/useProducts';
import { useCategoryTree, useCategoryRootMap, withAlpha } from '@/hooks/useCategories';
import { useReviewsBySeller, useSellerRating } from '@/hooks/useReviews';
import { useFollowers, useFollowing, useFollowersCount, useFollowingCount } from '@/hooks/useFollowers';
import { API_URL, resolveImage } from '@/lib/config';
import { useShare } from '@/hooks/useShare';
import { useVerificationRequest, useRequestVerification } from '@/hooks/useVerification';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import CenterSafetyModal from '@/components/CenterSafetyModal';
import ImageViewing from 'react-native-image-viewing';

const COVER_HEIGHT = 220;
const AVATAR_SIZE = 92;

const PREVIEW_LIMIT = 6;
const FOLLOWER_LIMIT = 8;


function timeAgo(iso?: string): string {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'hace un momento';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  const mo = Math.floor(d / 30);
  return `hace ${mo} meses`;
}

function StarRating({ rating }: { rating: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          color={i <= rating ? colors.tertiaryContainer : colors.outlineVariant}
          fill={i <= rating ? colors.tertiaryContainer : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, loading, refresh } = useProfile();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { isAuthenticated, signOut, user } = useAuth();
  const userId = user?.id || profile?.id || '';
  const { products: myProducts, loading: productsLoading, refetch: refetchProducts } = useProductsBySeller(userId);
  const { reviews: myReviews, loading: reviewsLoading, refetch: refetchReviews } = useReviewsBySeller(userId);
  const { average: avgRating, count: ratingCount, loading: ratingLoading } = useSellerRating(userId);
  const { followers: myFollowers, loading: followersLoading, refetch: refetchFollowers } = useFollowers(userId);
  const { following: myFollowing, loading: followingLoading, refetch: refetchFollowing } = useFollowing(userId);
  const { count: followersCountNum, refetch: refetchFollowersCount } = useFollowersCount(userId);
  const { count: followingCountNum, refetch: refetchFollowingCount } = useFollowingCount(userId);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [centerSafetyOpen, setcenterSafetyOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'logout' | 'delete' | null>(null);
  const [allProductsOpen, setAllProductsOpen] = useState(false);
  const [allFollowersOpen, setAllFollowersOpen] = useState(false);
  const [allFollowingOpen, setAllFollowingOpen] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [bioLines, setBioLines] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productPageSize, setProductPageSize] = useState(10);
  const [productCategoryId, setProductCategoryId] = useState<string | null>(null);
  const [followerSearch, setFollowerSearch] = useState('');
  const [followerPageSize, setFollowerPageSize] = useState(10);
  const [followerSort, setFollowerSort] = useState<'recent' | 'oldest'>('recent');
  const [followingSearch, setFollowingSearch] = useState('');
  const [followingPageSize, setFollowingPageSize] = useState(10);
  const [followingSort, setFollowingSort] = useState<'recent' | 'oldest'>('recent');
  const [allReviewsOpen, setAllReviewsOpen] = useState(false);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewPageSize, setReviewPageSize] = useState(10);
  const [reviewSort, setReviewSort] = useState<'recent' | 'oldest' | 'best' | 'worst'>('recent');
  const [reviewSortOpen, setReviewSortOpen] = useState(false);
  const { remove: deleteProduct } = useDeleteProduct();
  const { deleteAccount, loading: deletingAccount } = useDeleteAccount();
  const scrollY = useRef(new Animated.Value(0)).current;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), refetchProducts(), refetchReviews(), refetchFollowers(), refetchFollowing(), refetchVerification()]);
    } catch {}
    setRefreshing(false);
  };

  // Estado social del perfil visitado (seguidores, follow-back, reviews nuevas,
    // productos publicados/borrados) puede haber cambiado desde otra sesión.
    useRefetchOnFocus([
     refresh, refetchProducts, refetchReviews, refetchFollowers, refetchFollowing,
    ]);

  const { share } = useShare();
  const onShareProfile = () =>
    share({ type: 'profile', id: userId, name: profile?.name ?? 'este vendedor' });

  const { request: verificationRequest, refetch: refetchVerification } = useVerificationRequest();
  const { requestVerification } = useRequestVerification();

  const confirmDelete = (id: string, title: string) => {
    Alert.alert(
      'Eliminar anuncio',
      `¿Eliminar "${title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try { await deleteProduct(id); } catch {}
            setDeletingId(null);
          },
        },
      ],
    );
  };

  const { tree: categoryTree } = useCategoryTree();
  const categoryRootMap = useCategoryRootMap(categoryTree);

  const productItems = myProducts.map((p: any) => {
    const img = p.images?.[0]?.url || '';
    const catId = p.category?.id as string | undefined;
    return {
      id: p.id,
      title: p.title,
      price: fmtPrice(Number(p.price)),
      priceRaw: Number(p.price),
      location: p.city || '',
      condition: p.condition,
      status: p.status || 'active',
      image: img.startsWith('/') ? `${API_URL}${img}` : img,
      postedAgo: timeAgo(p.createdAt),
      views: Number(p.views) || 0,
      favorites: Number(p.favoritesCount) || 0,
      contacts: Number(p.contacts) || 0,
      impressions: Number(p.impressions) || 0,
      isBoosted: p.boostedUntil ? new Date(p.boostedUntil) > new Date() : false,
      categoryRootId: catId ? (categoryRootMap.get(catId) ?? catId) : null,
    };
  });

  // Only render chips for roots the seller actually has listings in — avoids
  // showing empty categories that just add clutter.
  const availableCategoryRoots = (() => {
    const usedRoots = new Set<string>();
    for (const p of productItems) {
      if (p.categoryRootId) usedRoots.add(p.categoryRootId);
    }
    return (categoryTree as any[])
      .filter((r) => usedRoots.has(r.id))
      .map((r) => ({ id: r.id, label: r.label as string, color: r.color as string | undefined }));
  })();

  // Effective plan comes from the server and accounts for expiry — an expired
  // STAR/PREMIUM behaves as FREE. Fall back to raw plan for older backends.
  const effectivePlan = profile?.effectivePlan ?? profile?.plan ?? 'FREE';
  const hasStatsAccess = effectivePlan === 'STAR' || effectivePlan === 'PREMIUM';
  // "Estadísticas completas" (top product + per-listing stats) is PREMIUM-only;
  // STAR gets the aggregate totals.
  const hasFullStats = effectivePlan === 'PREMIUM';
  const totalViews = productItems.reduce((s: number, p: any) => s + p.views, 0);
  const totalFavorites = productItems.reduce((s: number, p: any) => s + p.favorites, 0);
  const totalContacts = productItems.reduce((s: number, p: any) => s + p.contacts, 0);
  const totalImpressions = productItems.reduce((s: number, p: any) => s + p.impressions, 0);
  const topProduct = productItems.reduce(
    (best: any, p: any) => (p.views > (best?.views ?? 0) ? p : best),
    null,
  );
  const { daily: viewsDaily } = useMyViewsDaily(hasFullStats);
  const maxDaily = Math.max(1, ...viewsDaily.map((d: any) => d.count));

  const filteredProducts = productItems.filter((p: any) => {
    if (productCategoryId && p.categoryRootId !== productCategoryId) return false;
    const q = productSearch.trim().toLowerCase();
    if (q && !p.title.toLowerCase().includes(q)) return false;
    return true;
  });
  const paginatedProducts = filteredProducts.slice(0, productPageSize);
  const hasMoreProducts = filteredProducts.length > productPageSize;

  const reviewItems = myReviews.map((r: any) => ({
    id: r.id,
    author: r.author?.name || '',
    avatar: resolveImage(r.author?.avatarUrl) || '',
    rating: r.rating,
    text: r.text || '',
    date: r.createdAt ? timeAgo(r.createdAt) : '',
    createdAt: r.createdAt || '',
  }));

  const followerItems = (myFollowers ?? []).map((f: any) => ({
    id: f.id,
    userId: f.follower?.id || '',
    name: f.follower?.name || '',
    avatar: resolveImage(f.follower?.avatarUrl) || '',
    verified: f.follower?.verified ?? false,
    plan: f.follower?.effectivePlan ?? f.follower?.plan ?? 'FREE',
    location: f.follower?.location || '',
    since: f.createdAt ? timeAgo(f.createdAt) : '',
    createdAt: f.createdAt || '',
  }));

  const followingItems = (myFollowing ?? []).map((f: any) => ({
    id: f.id,
    userId: f.followed?.id || '',
    name: f.followed?.name || '',
    avatar: resolveImage(f.followed?.avatarUrl) || '',
    verified: f.followed?.verified ?? false,
    plan: f.followed?.effectivePlan ?? f.followed?.plan ?? 'FREE',
    location: f.followed?.location || '',
    since: f.createdAt ? timeAgo(f.createdAt) : '',
    createdAt: f.createdAt || '',
  }));

  const sortItems = (items: any[], sort: 'recent' | 'oldest') =>
    [...items].sort((a, b) => {
      const da = new Date(a.createdAt).getTime() || 0;
      const db = new Date(b.createdAt).getTime() || 0;
      return sort === 'recent' ? db - da : da - db;
    });

  const filteredFollowers = (() => {
    let list = followerSearch.trim()
      ? followerItems.filter((f: any) => f.name.toLowerCase().includes(followerSearch.trim().toLowerCase()))
      : followerItems;
    return sortItems(list, followerSort);
  })();
  const paginatedFollowers = filteredFollowers.slice(0, followerPageSize);
  const hasMoreFollowers = filteredFollowers.length > followerPageSize;

  const filteredFollowing = (() => {
    let list = followingSearch.trim()
      ? followingItems.filter((f: any) => f.name.toLowerCase().includes(followingSearch.trim().toLowerCase()))
      : followingItems;
    return sortItems(list, followingSort);
  })();
  const paginatedFollowing = filteredFollowing.slice(0, followingPageSize);
  const hasMoreFollowing = filteredFollowing.length > followingPageSize;

  const filteredReviews = (() => {
    let list = reviewSearch.trim()
      ? reviewItems.filter((r: any) => r.author.toLowerCase().includes(reviewSearch.trim().toLowerCase()))
      : reviewItems;
    return [...list].sort((a, b) => {
      if (reviewSort === 'best') return b.rating - a.rating;
      if (reviewSort === 'worst') return a.rating - b.rating;
      const da = new Date(a.createdAt).getTime() || 0;
      const db = new Date(b.createdAt).getTime() || 0;
      return reviewSort === 'recent' ? db - da : da - db;
    });
  })();
  const paginatedReviews = filteredReviews.slice(0, reviewPageSize);
  const hasMoreReviews = filteredReviews.length > reviewPageSize;

  const renderPairs = (items: any[]) => {
    const pairs: any[][] = [];
    for (let i = 0; i < items.length; i += 2) pairs.push(items.slice(i, i + 2));
    return pairs;
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [COVER_HEIGHT - 80, COVER_HEIGHT - 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const coverParallax = scrollY.interpolate({
    inputRange: [-100, 0, COVER_HEIGHT],
    outputRange: [-50, 0, COVER_HEIGHT * 0.4],
    extrapolate: 'clamp',
  });

  const coverScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolateRight: 'clamp',
  });

  if (!isAuthenticated) {
    return (
      <View style={[styles.root, styles.center]}>
        <View style={styles.authGate}>
          <View style={styles.authIconWrap}>
            <User size={48} color={colors.primary} strokeWidth={1.2} />
          </View>
          <Text style={styles.authTitle}>Tu perfil</Text>
          <Text style={styles.authDesc}>
            Inicia sesión para ver tu perfil, gestionar tus anuncios y conectar con compradores.
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

  if (loading || !profile) {
    return (
      <View style={styles.root}>
        <Skeleton style={{ height: COVER_HEIGHT, borderRadius: 0 }} />
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ marginTop: -(AVATAR_SIZE / 2) }}>
            <Skeleton
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
                borderWidth: 4,
                borderColor: colors.surface,
              }}
            />
          </View>
          <Skeleton style={{ height: 24, width: '55%', borderRadius: 8, marginTop: 14 }} />
          <Skeleton style={{ height: 14, width: '40%', borderRadius: 6, marginTop: 10 }} />
          <Skeleton style={{ height: 64, borderRadius: 16, marginTop: 22 }} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 22 }}>
            <Skeleton style={{ flex: 1, height: 150, borderRadius: 16 }} />
            <Skeleton style={{ flex: 1, height: 150, borderRadius: 16 }} />
          </View>
        </View>
      </View>
    );
  }

  const memberSince = new Date(profile.created_at).getFullYear();

  return (
    <View style={styles.root}>
      {/* Sticky compact header */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stickyHeader,
          {
            paddingTop: insets.top,
            height: 52 + insets.top,
            opacity: headerOpacity,
          },
        ]}>
        <Text style={styles.stickyHeaderTitle}>{profile.name}</Text>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Cover */}
        <View style={styles.coverWrap}>
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.cover}
            disabled={!profile.cover_url}
            onPress={() => {
              const uri = resolveImage(profile.cover_url);
              if (uri) setViewerUri(uri);
            }}>
            {profile.cover_url ? (
              <Animated.Image
                source={{ uri: resolveImage(profile.cover_url) }}
                style={[
                  StyleSheet.absoluteFillObject,
                  { transform: [{ translateY: coverParallax }, { scale: coverScale }] },
                ]}
              />
            ) : (
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: colors.surfaceContainerHigh, transform: [{ translateY: coverParallax }, { scale: coverScale }] },
                ]}
              />
            )}
          </TouchableOpacity>
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(0,0,0,0.35)', colors.surface]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <RipplePress
              style={styles.topBarBtn}
              borderRadius={18}
              rippleColor="rgba(255,255,255,0.2)"
              onPress={() => setSettingsOpen(true)}>
              <Settings size={20} color="#ffffff" strokeWidth={1.5} />
            </RipplePress>
          </View>
        </View>

        {/* Avatar bubble + edit button */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!profile.avatar_url}
              onPress={() => {
                const uri = resolveImage(profile.avatar_url);
                if (uri) setViewerUri(uri);
              }}>
              {profile.avatar_url ? (
                <Image source={{ uri: resolveImage(profile.avatar_url) }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }]}>
                  <User size={32} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                </View>
              )}
            </TouchableOpacity>
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <BadgeCheck size={16} color="#ffffff" fill={colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.avatarActions}>
            <RipplePress
              style={styles.editBtn}
              borderRadius={20}
              rippleColor="rgba(255,255,255,0.25)"
              onPress={() => router.push('/edit-profile')}>
              <Pencil size={14} color="#ffffff" strokeWidth={2} />
              <Text style={styles.editBtnText}>Editar perfil</Text>
            </RipplePress>
            <RipplePress
              style={styles.shareBtn}
              borderRadius={20}
              rippleColor={colors.primary + '18'}
              accessibilityLabel="Compartir perfil"
              onPress={onShareProfile}>
              <Share2 size={16} color={colors.primary} strokeWidth={1.7} />
            </RipplePress>
          </View>
        </View>

        {/* Name + location */}
        <View style={styles.nameBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}</Text>
            {profile.verified && (
              <View style={styles.verifiedChip}>
                <BadgeCheck size={11} color={colors.primary} strokeWidth={2} />
                <Text style={styles.verifiedChipText}>Verificado</Text>
              </View>
            )}
            {effectivePlan === 'STAR' && (
              <View style={styles.planChipStar}>
                <Star size={11} color="#F5A623" strokeWidth={2} fill="#F5A623" />
                <Text style={styles.planChipStarText}>Estrella</Text>
              </View>
            )}
            {effectivePlan === 'PREMIUM' && (
              <View style={styles.planChipPremium}>
                <Crown size={11} color="#7C3AED" strokeWidth={2} fill="#7C3AED" />
                <Text style={styles.planChipPremiumText}>Premium</Text>
              </View>
            )}
          </View>
          <View style={styles.locationRow}>
            <MapPin size={13} color={colors.onSurfaceVariant} strokeWidth={1.5} />
            <Text style={styles.locationText}>{profile.location}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.locationText}>Desde {memberSince}</Text>
          </View>
          {profile.bio ? (
            <>
              <Text
                style={styles.bio}
                numberOfLines={bioLines !== null && !bioExpanded ? 5 : undefined}
                onTextLayout={(e) => {
                  if (bioLines === null) setBioLines(e.nativeEvent.lines.length);
                }}>
                {profile.bio}
              </Text>
              {bioLines !== null && bioLines > 5 && (
                <TouchableOpacity activeOpacity={0.7} onPress={() => setBioExpanded(!bioExpanded)}>
                  <Text style={styles.bioToggle}>{bioExpanded ? 'Ver menos' : 'Ver más'}</Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}

          {(profile.show_email || profile.show_phone) && (
            <View style={styles.contactRow}>
              {profile.show_email && profile.email ? (
                <TouchableOpacity
                  style={styles.contactItem}
                  activeOpacity={0.6}
                  accessibilityRole="link"
                  accessibilityLabel={`Escribir a ${profile.email}`}
                  onPress={() =>
                    Linking.openURL(`mailto:${profile.email}`).catch(() =>
                      Alert.alert('No se pudo abrir', 'No hay app de correo configurada en el dispositivo.'),
                    )
                  }>
                  <Mail size={13} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                  <Text style={[styles.contactText, styles.contactTextLink]}>{profile.email}</Text>
                </TouchableOpacity>
              ) : null}
              {profile.show_phone && profile.phone ? (
                <TouchableOpacity
                  style={styles.contactItem}
                  activeOpacity={0.6}
                  accessibilityRole="link"
                  accessibilityLabel={`Llamar a ${profile.phone}`}
                  onPress={() =>
                    Linking.openURL(`tel:${String(profile.phone).replace(/\s+/g, '')}`).catch(() =>
                      Alert.alert('No se pudo abrir', 'Este dispositivo no puede realizar llamadas.'),
                    )
                  }>
                  <Phone size={13} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                  <Text style={[styles.contactText, styles.contactTextLink]}>{profile.phone}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>

        {/* Stat tabs */}
        <View style={styles.statTabs}>
          {[
            { value: fmtNumber(myProducts.length), label: 'Anuncios', isLoading: productsLoading },
            { value: avgRating > 0 ? avgRating.toFixed(1) : '-', label: 'Valoración', isLoading: ratingLoading },
            { value: fmtNumber(followersCountNum), label: 'Seguidores', isLoading: followersLoading },
            { value: fmtNumber(followingCountNum), label: 'Siguiendo', isLoading: followingLoading },
          ].map(({ value, label, isLoading }, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.statTab, activeTab === i && styles.statTabActive]}
              onPress={() => setActiveTab(i)}
              activeOpacity={0.7}>
              {isLoading
                ? <Spinner color={activeTab === i ? colors.primary : colors.onSurfaceVariant} size={14} />
                : <Text style={[styles.statTabValue, activeTab === i && styles.statTabValueActive]}>{value}</Text>
              }
              <Text style={styles.statTabLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 0 ? (
          productsLoading ? (
            <View style={styles.spinnerWrap}><Spinner color={colors.primary} /></View>
          ) : <View style={styles.grid}>
            {productItems.length > 0 && (hasStatsAccess ? (
              <View style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <TrendingUp size={16} color={colors.primary} strokeWidth={1.8} />
                  <Text style={styles.statsTitle}>Estadísticas</Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statsItem}>
                    <Eye size={16} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                    <Text style={styles.statsValue}>{fmtNumber(totalViews)}</Text>
                    <Text style={styles.statsLabel}>Visitas</Text>
                  </View>
                  <View style={styles.statsDivider} />
                  <View style={styles.statsItem}>
                    <Heart size={16} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                    <Text style={styles.statsValue}>{fmtNumber(totalFavorites)}</Text>
                    <Text style={styles.statsLabel}>Favoritos</Text>
                  </View>
                  {hasFullStats && (
                    <>
                      <View style={styles.statsDivider} />
                      <View style={styles.statsItem}>
                        <Phone size={16} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                        <Text style={styles.statsValue}>{fmtNumber(totalContacts)}</Text>
                        <Text style={styles.statsLabel}>Contactos</Text>
                      </View>
                      <View style={styles.statsDivider} />
                      <View style={styles.statsItem}>
                        <Search size={16} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                        <Text style={styles.statsValue}>{fmtNumber(totalImpressions)}</Text>
                        <Text style={styles.statsLabel}>Búsquedas</Text>
                      </View>
                    </>
                  )}
                </View>
                {hasFullStats && viewsDaily.length > 0 && (
                  <View style={styles.statsChart}>
                    <Text style={styles.statsChartTitle}>Visitas últimos 7 días</Text>
                    <View style={styles.statsChartBars}>
                      {viewsDaily.map((d: any) => (
                        <View key={d.date} style={styles.statsChartCol}>
                          <View style={styles.statsChartBarTrack}>
                            <View
                              style={[
                                styles.statsChartBar,
                                { height: `${Math.max(4, (d.count / maxDaily) * 100)}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.statsChartDay}>
                            {new Date(d.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'narrow' })}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {hasFullStats && topProduct && topProduct.views > 0 && (
                  <View style={styles.statsTopRow}>
                    <Text style={styles.statsTopText}>
                      Más visto: <Text style={styles.statsTopName}>{topProduct.title}</Text>
                      {' '}({fmtNumber(topProduct.views)} visitas)
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.statsLocked}
                activeOpacity={0.8}
                onPress={() => router.push('/plans')}>
                <View style={styles.statsLockedIcon}>
                  <Lock size={18} color={colors.primary} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statsLockedTitle}>Estadísticas de tus anuncios</Text>
                  <Text style={styles.statsLockedDesc}>
                    Visitas, favoritos y tu anuncio más popular. Disponible con el plan Estrella.
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.primary} strokeWidth={2} />
              </TouchableOpacity>
            ))}
            {/* v2 Fase 10b — panel plan-gateado para gestionar pins y auto-bump */}
            {profile?.id && (
              <PlanFeaturesPanel
                userId={profile.id}
                effectivePlan={effectivePlan}
                products={myProducts as any}
              />
            )}
            {renderPairs(productItems.slice(0, PREVIEW_LIMIT)).map((pair, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {pair.map((item: any) => (
                  <View key={item.id} style={styles.cardWrap}>
                    <ProductCard
                      item={item}
                      onPress={() =>
                        router.push({ pathname: '/product/[id]', params: { id: item.id } })
                      }
                    />
                    {deletingId === item.id && (
                      <View style={styles.deletingOverlay}>
                        <ActivityIndicator size="small" color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        activeOpacity={0.8}
                        onPress={() => router.push({ pathname: '/edit-listing/[id]', params: { id: item.id } })}>
                        <Pencil size={13} color="#ffffff" strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, styles.cardActionDanger]}
                        activeOpacity={0.8}
                        disabled={deletingId !== null}
                        onPress={() => confirmDelete(item.id, item.title)}>
                        <Trash2 size={13} color="#ffffff" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                    {hasFullStats && (
                      <View style={styles.cardStats}>
                        <Eye size={12} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                        <Text style={styles.cardStatsText}>{fmtNumber(item.views)}</Text>
                        <Heart size={12} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                        <Text style={styles.cardStatsText}>{fmtNumber(item.favorites)}</Text>
                      </View>
                    )}
                  </View>
                ))}
                {pair.length === 1 && <View style={styles.cardPlaceholder} />}
              </View>
            ))}
            {productItems.length > PREVIEW_LIMIT && (
              <TouchableOpacity
                style={styles.seeAllBottom}
                activeOpacity={0.7}
                onPress={() => setAllProductsOpen(true)}>
                <Text style={styles.seeAllText}>Ver todos los anuncios</Text>
                <Text style={styles.seeAllCount}>({productItems.length})</Text>
                <ChevronRight size={14} color={colors.primary} strokeWidth={2} />
              </TouchableOpacity>
            )}
            {productItems.length === 0 && (
              <View style={styles.emptyState}>
                <Package size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>Sin anuncios en esta sección</Text>
              </View>
            )}
          </View>
        ) : activeTab === 1 ? (
          reviewsLoading ? (
            <View style={styles.spinnerWrap}><Spinner color={colors.primary} /></View>
          ) : <View style={styles.reviewsList}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingValue}>{avgRating > 0 ? avgRating.toFixed(1) : '-'}</Text>
              <View>
                <StarRating rating={Math.round(avgRating)} />
                <Text style={styles.ratingMeta}>Basado en {ratingCount} valoraciones</Text>
              </View>
            </View>
            {reviewItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Star size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>Aún no tienes valoraciones</Text>
              </View>
            ) : (
              <>
                {reviewItems.slice(0, FOLLOWER_LIMIT).map((rev: any) => (
                  <View key={rev.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Image source={{ uri: rev.avatar }} style={styles.reviewAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewAuthor}>{rev.author}</Text>
                        <StarRating rating={rev.rating} />
                      </View>
                      <Text style={styles.reviewDate}>{rev.date}</Text>
                    </View>
                    <Text style={styles.reviewText}>{rev.text}</Text>
                  </View>
                ))}
                {reviewItems.length > FOLLOWER_LIMIT && (
                  <RipplePress
                    style={styles.seeAllBottom}
                    borderRadius={14}
                    rippleColor={colors.primary + '18'}
                    onPress={() => setAllReviewsOpen(true)}>
                    <Text style={styles.seeAllText}>Ver todas las valoraciones</Text>
                    <Text style={styles.seeAllCount}>({reviewItems.length})</Text>
                    <ChevronRight size={16} color={colors.primary} strokeWidth={2} />
                  </RipplePress>
                )}
              </>
            )}
          </View>
        ) : activeTab === 2 ? (
          followersLoading ? (
            <View style={styles.spinnerWrap}><Spinner color={colors.primary} /></View>
          ) : <View style={styles.followersList}>
            <View style={styles.followersHeader}>
              <View style={styles.followersIconWrap}>
                <Users size={20} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.followersTitle}>{fmtNumber(followersCountNum)} seguidores</Text>
                <Text style={styles.followersMeta}>Personas que confían en este perfil</Text>
              </View>
            </View>
            {followerItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>Aún no tienes seguidores</Text>
              </View>
            ) : (
              <>
                <View style={styles.followersCard}>
                  {followerItems.slice(0, FOLLOWER_LIMIT).map((f: any, i: number) => {
                    const visible = followerItems.slice(0, FOLLOWER_LIMIT);
                    const last = i === visible.length - 1;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        activeOpacity={0.7}
                        onPress={() => f.userId && router.push(`/user/${f.userId}`)}
                        style={[styles.followerRow, !last && styles.followerRowBorder]}>
                        <View style={styles.followerAvatarWrap}>
                          <Image source={{ uri: f.avatar }} style={styles.followerAvatar} />
                          {f.verified && (
                            <View style={styles.followerVerified}>
                              <BadgeCheck
                                size={12}
                                color="#ffffff"
                                fill={colors.primary}
                              />
                            </View>
                          )}
                        </View>
                        <View style={styles.followerInfo}>
                          <View style={styles.followerNameRow}>
                            <Text style={styles.followerName} numberOfLines={1}>
                              {f.name}
                            </Text>
                            {f.plan === 'STAR' && (
                              <View style={styles.planBadgeStar}><Star size={9} color="#ffffff" fill="#ffffff" strokeWidth={2} /></View>
                            )}
                            {f.plan === 'PREMIUM' && (
                              <View style={styles.planBadgePremium}><Crown size={9} color="#ffffff" fill="#ffffff" strokeWidth={2} /></View>
                            )}
                          </View>
                          <View style={styles.followerMetaRow}>
                            <MapPin
                              size={10}
                              color={colors.onSurfaceVariant + '99'}
                              strokeWidth={1.5}
                            />
                            <Text style={styles.followerMeta} numberOfLines={1}>
                              {f.location} · {f.since}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {followerItems.length > FOLLOWER_LIMIT && (
                  <TouchableOpacity
                    style={styles.seeAllBottom}
                    activeOpacity={0.7}
                    onPress={() => setAllFollowersOpen(true)}>
                    <Text style={styles.seeAllText}>Ver todos los seguidores</Text>
                    <Text style={styles.seeAllCount}>({followersCountNum})</Text>
                    <ChevronRight size={14} color={colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        ) : activeTab === 3 ? (
          followingLoading ? (
            <View style={styles.spinnerWrap}><Spinner color={colors.primary} /></View>
          ) : <View style={styles.followersList}>
            <View style={styles.followersHeader}>
              <View style={styles.followersIconWrap}>
                <UserCheck size={20} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.followersTitle}>{fmtNumber(followingCountNum)} siguiendo</Text>
                <Text style={styles.followersMeta}>Personas que sigues</Text>
              </View>
            </View>
            {followingItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>Aún no sigues a nadie</Text>
              </View>
            ) : (
              <>
                <View style={styles.followersCard}>
                  {followingItems.slice(0, FOLLOWER_LIMIT).map((f: any, i: number) => {
                    const visible = followingItems.slice(0, FOLLOWER_LIMIT);
                    const last = i === visible.length - 1;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        activeOpacity={0.7}
                        onPress={() => f.userId && router.push(`/user/${f.userId}`)}
                        style={[styles.followerRow, !last && styles.followerRowBorder]}>
                        <View style={styles.followerAvatarWrap}>
                          <Image source={{ uri: f.avatar }} style={styles.followerAvatar} />
                          {f.verified && (
                            <View style={styles.followerVerified}>
                              <BadgeCheck
                                size={12}
                                color="#ffffff"
                                fill={colors.primary}
                              />
                            </View>
                          )}
                        </View>
                        <View style={styles.followerInfo}>
                          <View style={styles.followerNameRow}>
                            <Text style={styles.followerName} numberOfLines={1}>
                              {f.name}
                            </Text>
                            {f.plan === 'STAR' && (
                              <View style={styles.planBadgeStar}><Star size={9} color="#ffffff" fill="#ffffff" strokeWidth={2} /></View>
                            )}
                            {f.plan === 'PREMIUM' && (
                              <View style={styles.planBadgePremium}><Crown size={9} color="#ffffff" fill="#ffffff" strokeWidth={2} /></View>
                            )}
                          </View>
                          <View style={styles.followerMetaRow}>
                            <MapPin
                              size={10}
                              color={colors.onSurfaceVariant + '99'}
                              strokeWidth={1.5}
                            />
                            <Text style={styles.followerMeta} numberOfLines={1}>
                              {f.location} · {f.since}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {followingItems.length > FOLLOWER_LIMIT && (
                  <TouchableOpacity
                    style={styles.seeAllBottom}
                    activeOpacity={0.7}
                    onPress={() => setAllFollowingOpen(true)}>
                    <Text style={styles.seeAllText}>Ver todos los que sigues</Text>
                    <Text style={styles.seeAllCount}>({followingCountNum})</Text>
                    <ChevronRight size={14} color={colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        ) : null}

        {/* Plan upgrade banner */}
        {effectivePlan !== 'PREMIUM' && (
          <View style={styles.upgradeBanner}>
            <View style={styles.upgradeBannerIcon}>
              <Zap size={22} color="#ffffff" strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeBannerTitle}>
                {effectivePlan === 'FREE' ? 'Haz crecer tu negocio' : 'Pasa a Premium'}
              </Text>
              <Text style={styles.upgradeBannerDesc}>
                {effectivePlan === 'FREE'
                  ? 'Más anuncios, insignias y visibilidad desde 3.000 XAF/mes'
                  : 'Anuncios ilimitados, prioridad en portada y estadísticas completas'}
              </Text>
            </View>
            <RipplePress
              style={styles.upgradeBannerBtn}
              borderRadius={10}
              rippleColor="rgba(255,255,255,0.25)"
              onPress={() => router.push('/plans')}>
              <Text style={styles.upgradeBannerBtnText}>Ver planes</Text>
            </RipplePress>
          </View>
        )}
        
        {/* Verification */}
        {!profile.verified && (() => {
          const cooldownDays = verificationRequest?.status === 'rejected' && verificationRequest.reviewedAt
            ? Math.ceil(7 - (Date.now() - new Date(verificationRequest.reviewedAt).getTime()) / 86_400_000)
            : 0;
          const onCooldown = cooldownDays > 0;

          return (
            <Section title="Verificación">
              <Row
                icon={BadgeCheck}
                label={
                  verificationRequest?.status === 'pending'
                    ? 'Verificación en revisión'
                    : onCooldown
                      ? `Reintentar en ${cooldownDays} día${cooldownDays === 1 ? '' : 's'}`
                      : verificationRequest?.status === 'rejected'
                        ? 'Reintentar verificación'
                        : 'Verificar mi cuenta'
                }
                value={verificationRequest?.status === 'pending' ? 'Pendiente' : undefined}
                onPress={() => {
                  if (verificationRequest?.status === 'pending') return;
                  if (onCooldown) {
                    Alert.alert('Espera un poco', `Podrás reintentar en ${cooldownDays} día${cooldownDays === 1 ? '' : 's'}.`);
                    return;
                  }
                  const missing: string[] = [];
                  if (!profile.phone) missing.push('teléfono verificado');
                  if (!profile.email) missing.push('email confirmado');
                  if (!profile.avatar_url) missing.push('foto de perfil');
                  if (!profile.name || profile.name.trim().length < 3) missing.push('nombre completo');
                  if (missing.length > 0) {
                    Alert.alert('Completa tu perfil', `Para verificarte necesitas: ${missing.join(', ')}.`);
                    return;
                  }
                  Alert.alert(
                    'Solicitar verificación',
                    'Tu perfil será revisado por nuestro equipo. Recibirás una notificación con el resultado.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Solicitar',
                        onPress: async () => {
                          try {
                            await requestVerification();
                            Alert.alert('Solicitud enviada', 'Te notificaremos cuando sea revisada.');
                          } catch (e: any) {
                            Alert.alert('Error', e?.message || 'No se pudo enviar la solicitud.');
                          }
                        },
                      },
                    ],
                  );
                }}
                last
              />
            </Section>
          );
        })()}

        {/* Mi plan */}
        <Section title="Suscripción">
          <Row
            icon={CreditCard}
            label="Mi plan"
            value={effectivePlan === 'FREE' ? 'Gratis' : effectivePlan === 'STAR' ? 'Estrella' : 'Premium'}
            onPress={() => router.push('/plans')}
            last
          />
        </Section>

        {/* Support */}
        <Section title="Soporte y legal">
          <Row icon={ShieldCheck} label="Centro de seguridad" onPress={() => setcenterSafetyOpen(true)} />
          <Row icon={HelpCircle} label="Centro de ayuda" onPress={() => router.push('/help')} />
          <Row icon={FileText} label="Términos y condiciones" onPress={() => router.push('/terms')} />
          <Row icon={Lock} label="Política de privacidad" onPress={() => router.push('/privacy')} last />
        </Section>

        {/* Danger zone */}
        <Section title="Cuenta" danger>
          <Row
            icon={LogOut}
            label="Cerrar sesión"
            danger
            onPress={() => setConfirmAction('logout')}
          />
          <Row
            icon={Trash2}
            label="Eliminar cuenta"
            danger
            onPress={() => setConfirmAction('delete')}
            last
          />
        </Section>

        <Text style={styles.version}>Bomelh · v1.0.0</Text>
      </Animated.ScrollView>

      {/* Gate modal subtrees so the heavy contents (ScrollView + filter chips
          + lists) only mount while the modal is open. Native <Modal> keeps
          rendering its children even when visible=false. */}
      {settingsOpen && (
        <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}
      {centerSafetyOpen && (
        <CenterSafetyModal
          visible={centerSafetyOpen}
          onClose={() => setcenterSafetyOpen(false)}
        />
      )}

      <ImageViewing
        images={viewerUri ? [{ uri: viewerUri }] : []}
        imageIndex={0}
        visible={!!viewerUri}
        onRequestClose={() => setViewerUri(null)}
        HeaderComponent={() => (
          <View style={{ paddingTop: insets.top + 8, paddingRight: 16, alignItems: 'flex-end' }}>
            <TouchableOpacity
              onPress={() => setViewerUri(null)}
              activeOpacity={0.8}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="#ffffff" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        )}
      />


      {/* All products modal */}
      {allProductsOpen && (
      <Modal
        visible={allProductsOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setAllProductsOpen(false); setProductSearch(''); setProductPageSize(10); setProductCategoryId(null); }}>
        <View style={[styles.allProductsModal, { paddingTop: insets.top }]}>
          <View style={styles.allProductsHeader}>
            <Text style={styles.allProductsTitle}>
              Mis anuncios ({productItems.length})
            </Text>
            <TouchableOpacity
              style={styles.allProductsClose}
              activeOpacity={0.7}
              onPress={() => { setAllProductsOpen(false); setProductSearch(''); setProductPageSize(10); setProductCategoryId(null); }}>
              <X size={20} color={colors.onSurface} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <View style={styles.productSearchWrap}>
            <Search size={16} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
            <TextInput
              style={styles.productSearchInput}
              placeholder="Buscar por título..."
              placeholderTextColor={colors.onSurfaceVariant + '66'}
              value={productSearch}
              onChangeText={(t) => { setProductSearch(t); setProductPageSize(10); }}
            />
            {productSearch.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setProductSearch(''); setProductPageSize(10); }}>
                <X size={16} color={colors.onSurfaceVariant} strokeWidth={1.8} />
              </TouchableOpacity>
            )}
          </View>
          {availableCategoryRoots.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={styles.categoryChipsRow}>
              {(() => {
                const allActive = productCategoryId === null;
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setProductCategoryId(null); setProductPageSize(10); }}
                    style={[
                      styles.categoryChip,
                      allActive && {
                        borderColor: colors.primary,
                        backgroundColor: withAlpha(colors.primary, '14'),
                      },
                    ]}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.categoryChipText,
                        allActive && { color: colors.primary, fontFamily: 'Manrope-SemiBold' },
                      ]}>
                      Todas
                    </Text>
                  </TouchableOpacity>
                );
              })()}
              {availableCategoryRoots.map((cat) => {
                const active = productCategoryId === cat.id;
                const accent = cat.color || colors.primary;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.8}
                    onPress={() => { setProductCategoryId(cat.id); setProductPageSize(10); }}
                    style={[
                      styles.categoryChip,
                      active && {
                        borderColor: accent,
                        backgroundColor: withAlpha(accent, '14'),
                      },
                    ]}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.categoryChipText,
                        active && { color: accent, fontFamily: 'Manrope-SemiBold' },
                      ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.allProductsGrid}
            showsVerticalScrollIndicator={false}>
            {paginatedProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>
                  {productSearch.trim()
                    ? 'Sin resultados'
                    : productCategoryId
                    ? 'Sin anuncios en esta categoría'
                    : 'Sin anuncios publicados'}
                </Text>
              </View>
            ) : (
              <>
                {renderPairs(paginatedProducts).map((pair, rowIdx) => (
                  <View key={rowIdx} style={styles.gridRow}>
                    {pair.map((item: any) => (
                      <View key={item.id} style={styles.cardWrap}>
                        <ProductCard
                          item={item}
                          onPress={() => {
                            setAllProductsOpen(false);
                            router.push({ pathname: '/product/[id]', params: { id: item.id } });
                          }}
                        />
                        {deletingId === item.id && (
                          <View style={styles.deletingOverlay}>
                            <ActivityIndicator size="small" color={colors.primary} />
                          </View>
                        )}
                        <View style={styles.cardActions}>
                          <TouchableOpacity
                            style={styles.cardActionBtn}
                            activeOpacity={0.8}
                            onPress={() => {
                              setAllProductsOpen(false);
                              router.push({ pathname: '/edit-listing/[id]', params: { id: item.id } });
                            }}>
                            <Pencil size={13} color="#ffffff" strokeWidth={2} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.cardActionBtn, styles.cardActionDanger]}
                            activeOpacity={0.8}
                            disabled={deletingId !== null}
                            onPress={() => confirmDelete(item.id, item.title)}>
                            <Trash2 size={13} color="#ffffff" strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                        {hasFullStats && (
                          <View style={styles.cardStats}>
                            <Eye size={12} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                            <Text style={styles.cardStatsText}>{fmtNumber(item.views)}</Text>
                            <Heart size={12} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                            <Text style={styles.cardStatsText}>{fmtNumber(item.favorites)}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                    {pair.length === 1 && <View style={styles.cardPlaceholder} />}
                  </View>
                ))}
                {hasMoreProducts && (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    activeOpacity={0.8}
                    onPress={() => setProductPageSize((s) => s + 10)}>
                    <Text style={styles.loadMoreText}>
                      Ver más ({filteredProducts.length - productPageSize} restantes)
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
      )}

      {/* All followers modal */}
      {allFollowersOpen && (
      <Modal
        visible={allFollowersOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setAllFollowersOpen(false); setFollowerSearch(''); setFollowerPageSize(10); setFollowerSort('recent'); }}>
        <View style={[styles.allProductsModal, { paddingTop: insets.top }]}>
          <View style={styles.allProductsHeader}>
            <Text style={styles.allProductsTitle}>
              Seguidores ({followersCountNum})
            </Text>
            <TouchableOpacity
              style={styles.allProductsClose}
              activeOpacity={0.7}
              onPress={() => { setAllFollowersOpen(false); setFollowerSearch(''); setFollowerPageSize(10); setFollowerSort('recent'); }}>
              <X size={20} color={colors.onSurface} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <View style={styles.productSearchWrap}>
            <Search size={16} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
            <TextInput
              style={styles.productSearchInput}
              placeholder="Buscar por nombre..."
              placeholderTextColor={colors.onSurfaceVariant + '66'}
              value={followerSearch}
              onChangeText={(t) => { setFollowerSearch(t); setFollowerPageSize(10); }}
            />
            {followerSearch.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setFollowerSearch(''); setFollowerPageSize(10); }}>
                <X size={16} color={colors.onSurfaceVariant} strokeWidth={1.8} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.sortRow}>
            <ArrowDownUp size={14} color={colors.onSurfaceVariant} strokeWidth={1.8} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.sortChip, followerSort === 'recent' && styles.sortChipActive]}
              onPress={() => setFollowerSort('recent')}>
              <Text style={[styles.sortChipText, followerSort === 'recent' && styles.sortChipTextActive]}>Recientes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.sortChip, followerSort === 'oldest' && styles.sortChipActive]}
              onPress={() => setFollowerSort('oldest')}>
              <Text style={[styles.sortChipText, followerSort === 'oldest' && styles.sortChipTextActive]}>Antiguos</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}>
            {paginatedFollowers.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>
                  {followerSearch.trim() ? 'Sin resultados' : 'Aún no tienes seguidores'}
                </Text>
              </View>
            ) : (
              <View style={styles.followersCard}>
                {paginatedFollowers.map((f: any, i: number) => {
                  const last = i === paginatedFollowers.length - 1;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setAllFollowersOpen(false);
                        if (f.userId) router.push(`/user/${f.userId}`);
                      }}
                      style={[styles.followerRow, !last && styles.followerRowBorder]}>
                      <View style={styles.followerAvatarWrap}>
                        <Image source={{ uri: f.avatar }} style={styles.followerAvatar} />
                        {f.verified && (
                          <View style={styles.followerVerified}>
                            <BadgeCheck
                              size={12}
                              color="#ffffff"
                              fill={colors.primary}
                            />
                          </View>
                        )}
                      </View>
                      <View style={styles.followerInfo}>
                        <View style={styles.followerNameRow}>
                          <Text style={styles.followerName} numberOfLines={1}>
                            {f.name}
                          </Text>
                          {f.plan === 'STAR' && (
                            <View style={styles.planBadgeStar}><Star size={9} color="#ffffff" fill="#ffffff" strokeWidth={2} /></View>
                          )}
                          {f.plan === 'PREMIUM' && (
                            <View style={styles.planBadgePremium}><Crown size={9} color="#ffffff" fill="#ffffff" strokeWidth={2} /></View>
                          )}
                        </View>
                        <View style={styles.followerMetaRow}>
                          <MapPin
                            size={10}
                            color={colors.onSurfaceVariant + '99'}
                            strokeWidth={1.5}
                          />
                          <Text style={styles.followerMeta} numberOfLines={1}>
                            {f.location} · {f.since}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {hasMoreFollowers && (
              <TouchableOpacity
                style={[styles.loadMoreBtn, { marginTop: 12 }]}
                activeOpacity={0.8}
                onPress={() => setFollowerPageSize((s) => s + 10)}>
                <Text style={styles.loadMoreText}>
                  Ver más ({filteredFollowers.length - followerPageSize} restantes)
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
      )}

      {/* All following modal */}
      {allFollowingOpen && (
      <Modal
        visible={allFollowingOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setAllFollowingOpen(false); setFollowingSearch(''); setFollowingPageSize(10); setFollowingSort('recent'); }}>
        <View style={[styles.allProductsModal, { paddingTop: insets.top }]}>
          <View style={styles.allProductsHeader}>
            <Text style={styles.allProductsTitle}>
              Siguiendo ({followingCountNum})
            </Text>
            <TouchableOpacity
              style={styles.allProductsClose}
              activeOpacity={0.7}
              onPress={() => { setAllFollowingOpen(false); setFollowingSearch(''); setFollowingPageSize(10); setFollowingSort('recent'); }}>
              <X size={20} color={colors.onSurface} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <View style={styles.productSearchWrap}>
            <Search size={16} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
            <TextInput
              style={styles.productSearchInput}
              placeholder="Buscar por nombre..."
              placeholderTextColor={colors.onSurfaceVariant + '66'}
              value={followingSearch}
              onChangeText={(t) => { setFollowingSearch(t); setFollowingPageSize(10); }}
            />
            {followingSearch.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setFollowingSearch(''); setFollowingPageSize(10); }}>
                <X size={16} color={colors.onSurfaceVariant} strokeWidth={1.8} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.sortRow}>
            <ArrowDownUp size={14} color={colors.onSurfaceVariant} strokeWidth={1.8} />
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.sortChip, followingSort === 'recent' && styles.sortChipActive]}
              onPress={() => setFollowingSort('recent')}>
              <Text style={[styles.sortChipText, followingSort === 'recent' && styles.sortChipTextActive]}>Recientes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.sortChip, followingSort === 'oldest' && styles.sortChipActive]}
              onPress={() => setFollowingSort('oldest')}>
              <Text style={[styles.sortChipText, followingSort === 'oldest' && styles.sortChipTextActive]}>Antiguos</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}>
            {paginatedFollowing.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>
                  {followingSearch.trim() ? 'Sin resultados' : 'Aún no sigues a nadie'}
                </Text>
              </View>
            ) : (
              <View style={styles.followersCard}>
                {paginatedFollowing.map((f: any, i: number) => {
                  const last = i === paginatedFollowing.length - 1;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setAllFollowingOpen(false);
                        if (f.userId) router.push(`/user/${f.userId}`);
                      }}
                      style={[styles.followerRow, !last && styles.followerRowBorder]}>
                      <View style={styles.followerAvatarWrap}>
                        <Image source={{ uri: f.avatar }} style={styles.followerAvatar} />
                        {f.verified && (
                          <View style={styles.followerVerified}>
                            <BadgeCheck
                              size={12}
                              color="#ffffff"
                              fill={colors.primary}
                            />
                          </View>
                        )}
                      </View>
                      <View style={styles.followerInfo}>
                        <View style={styles.followerNameRow}>
                          <Text style={styles.followerName} numberOfLines={1}>
                            {f.name}
                          </Text>
                          {f.plan === 'STAR' && (
                            <View style={styles.planBadgeStar}><Star size={9} color="#ffffff" fill="#ffffff" strokeWidth={2} /></View>
                          )}
                          {f.plan === 'PREMIUM' && (
                            <View style={styles.planBadgePremium}><Crown size={9} color="#ffffff" fill="#ffffff" strokeWidth={2} /></View>
                          )}
                        </View>
                        <View style={styles.followerMetaRow}>
                          <MapPin
                            size={10}
                            color={colors.onSurfaceVariant + '99'}
                            strokeWidth={1.5}
                          />
                          <Text style={styles.followerMeta} numberOfLines={1}>
                            {f.location} · {f.since}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {hasMoreFollowing && (
              <TouchableOpacity
                style={[styles.loadMoreBtn, { marginTop: 12 }]}
                activeOpacity={0.8}
                onPress={() => setFollowingPageSize((s) => s + 10)}>
                <Text style={styles.loadMoreText}>
                  Ver más ({filteredFollowing.length - followingPageSize} restantes)
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
      )}

      {/* All reviews modal */}
      {allReviewsOpen && (
      <Modal
        visible={allReviewsOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setAllReviewsOpen(false); setReviewSearch(''); setReviewPageSize(10); setReviewSort('recent'); setReviewSortOpen(false); }}>
        <View style={[styles.allProductsModal, { paddingTop: insets.top }]}>
          <View style={styles.allProductsHeader}>
            <Text style={styles.allProductsTitle}>
              Valoraciones ({reviewItems.length})
            </Text>
            <TouchableOpacity
              style={styles.allProductsClose}
              activeOpacity={0.7}
              onPress={() => { setAllReviewsOpen(false); setReviewSearch(''); setReviewPageSize(10); setReviewSort('recent'); setReviewSortOpen(false); }}>
              <X size={20} color={colors.onSurface} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <View style={styles.productSearchWrap}>
            <Search size={16} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
            <TextInput
              style={styles.productSearchInput}
              placeholder="Buscar por autor..."
              placeholderTextColor={colors.onSurfaceVariant + '66'}
              value={reviewSearch}
              onChangeText={(t) => { setReviewSearch(t); setReviewPageSize(10); }}
            />
            {reviewSearch.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setReviewSearch(''); setReviewPageSize(10); }}>
                <X size={16} color={colors.onSurfaceVariant} strokeWidth={1.8} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.selectWrap}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.selectBtn}
              onPress={() => setReviewSortOpen((o) => !o)}>
              <ArrowDownUp size={14} color={colors.primary} strokeWidth={1.8} />
              <Text style={styles.selectBtnText}>
                {{ recent: 'Más recientes', oldest: 'Más antiguos', best: 'Mejor valoración', worst: 'Peor valoración' }[reviewSort]}
              </Text>
              <ChevronDown
                size={16}
                color={colors.onSurfaceVariant}
                strokeWidth={1.8}
                style={reviewSortOpen ? { transform: [{ rotate: '180deg' }] } : undefined}
              />
            </TouchableOpacity>
            {reviewSortOpen && (
              <View style={styles.selectDropdown}>
                {([
                  { key: 'recent', label: 'Más recientes' },
                  { key: 'oldest', label: 'Más antiguos' },
                  { key: 'best', label: 'Mejor valoración' },
                  { key: 'worst', label: 'Peor valoración' },
                ] as const).map((opt, i, arr) => (
                  <TouchableOpacity
                    key={opt.key}
                    activeOpacity={0.7}
                    style={[styles.selectOption, i < arr.length - 1 && styles.selectOptionBorder]}
                    onPress={() => { setReviewSort(opt.key); setReviewSortOpen(false); }}>
                    <Text style={[styles.selectOptionText, reviewSort === opt.key && styles.selectOptionTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={[styles.ratingHeader, { marginHorizontal: 16, marginTop: 12 }]}>
            <Text style={styles.ratingValue}>{avgRating > 0 ? avgRating.toFixed(1) : '-'}</Text>
            <View>
              <StarRating rating={Math.round(avgRating)} />
              <Text style={styles.ratingMeta}>Basado en {ratingCount} valoraciones</Text>
            </View>
          </View>
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}>
            {paginatedReviews.length === 0 ? (
              <View style={styles.emptyState}>
                <Star size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>
                  {reviewSearch.trim() ? 'Sin resultados' : 'Aún no tienes valoraciones'}
                </Text>
              </View>
            ) : (
              <>
                {paginatedReviews.map((rev: any) => (
                  <View key={rev.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Image source={{ uri: rev.avatar }} style={styles.reviewAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewAuthor}>{rev.author}</Text>
                        <StarRating rating={rev.rating} />
                      </View>
                      <Text style={styles.reviewDate}>{rev.date}</Text>
                    </View>
                    <Text style={styles.reviewText}>{rev.text}</Text>
                  </View>
                ))}
                {hasMoreReviews && (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    activeOpacity={0.8}
                    onPress={() => setReviewPageSize((s) => s + 10)}>
                    <Text style={styles.loadMoreText}>
                      Ver más ({filteredReviews.length - reviewPageSize} restantes)
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
      )}

      {/* Confirmation modal */}
      {confirmAction !== null && (
      <Modal
        transparent
        visible={confirmAction !== null}
        animationType="fade"
        onRequestClose={() => setConfirmAction(null)}
        statusBarTranslucent>
        <Pressable style={styles.sheetBackdrop} onPress={() => setConfirmAction(null)}>
          <Pressable style={styles.confirmCard}>
            <View
              style={[
                styles.confirmIcon,
                {
                  backgroundColor:
                    confirmAction === 'delete'
                      ? colors.error + '15'
                      : colors.tertiary + '15',
                },
              ]}>
              {confirmAction === 'delete' ? (
                <Trash2 size={26} color={colors.error} strokeWidth={1.5} />
              ) : (
                <LogOut size={26} color={colors.tertiary} strokeWidth={1.5} />
              )}
            </View>
            <Text style={styles.confirmTitle}>
              {confirmAction === 'delete' ? 'Eliminar cuenta' : 'Cerrar sesión'}
            </Text>
            <Text style={styles.confirmDesc}>
              {confirmAction === 'delete'
                ? 'Esta acción no se puede deshacer. Se eliminarán todos tus anuncios y mensajes.'
                : 'Cerraremos tu sesión en este dispositivo. Podrás volver a entrar cuando quieras.'}
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setConfirmAction(null)}
                activeOpacity={0.8}>
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmAction,
                  {
                    backgroundColor:
                      confirmAction === 'delete' ? colors.error : colors.tertiary,
                  },
                ]}
                disabled={deletingAccount}
                onPress={async () => {
                  if (confirmAction === 'delete') {
                    const result = await deleteAccount();
                    setConfirmAction(null);
                    if (result.ok) {
                      signOut();
                    } else {
                      Alert.alert('Error', result.error);
                    }
                  } else {
                    signOut();
                    setConfirmAction(null);
                  }
                }}
                activeOpacity={0.85}>
                {deletingAccount ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmActionText}>
                    {confirmAction === 'delete' ? 'Eliminar' : 'Cerrar sesión'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
    zIndex: 100,
  },
  stickyHeaderTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  coverWrap: {
    height: COVER_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -(AVATAR_SIZE / 2),
    marginBottom: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.surfaceContainerLow,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  editBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
    color: '#ffffff',
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: {
    paddingHorizontal: 16,
    gap: 4,
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  name: {
    fontFamily: 'Manrope-Bold',
    fontSize: 24,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  verifiedChipText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  planChipStar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5A623' + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  planChipStarText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#F5A623',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  planChipPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED' + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  planChipPremiumText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#7C3AED',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  dot: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant + '88',
    marginHorizontal: 2,
  },
  bio: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
    marginTop: 8,
  },
  bioToggle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.primary,
    marginTop: 4,
  },
  contactRow: {
    gap: 6,
    marginTop: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  contactTextLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  badgesRow: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 18,
  },
  achBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  achText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  statTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 3,
  },
  statTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  statTabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  statTabValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: colors.onSurface,
    lineHeight: 22,
  },
  statTabValueActive: {
    color: colors.primary,
  },
  statTabLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  grid: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardPlaceholder: {
    flex: 1,
  },
  seeAllBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '66',
    backgroundColor: colors.surfaceContainerLowest,
  },
  seeAllText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  seeAllCount: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  cardWrap: {
    flex: 1,
    position: 'relative',
  },
  cardActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
    zIndex: 5,
  },
  cardActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionDanger: {
    backgroundColor: 'rgba(163,45,45,0.75)',
  },
  deletingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    zIndex: 10,
  },
  allProductsModal: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  allProductsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
  },
  allProductsTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  allProductsClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allProductsGrid: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  productSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  productSearchInput: {
    flex: 1,
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurface,
    padding: 0,
  },
  categoryChipsRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
    alignItems: 'flex-start',
  },
  categoryChip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '80',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryChipText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    lineHeight: 16,
    color: colors.onSurfaceVariant,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  loadMoreText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  sortChipActive: {
    backgroundColor: colors.primary + '18',
    borderColor: colors.primary + '44',
  },
  sortChipText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  sortChipTextActive: {
    color: colors.primary,
  },
  selectWrap: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    zIndex: 10,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  selectBtnText: {
    flex: 1,
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.onSurface,
  },
  selectDropdown: {
    marginTop: 4,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
    overflow: 'hidden',
  },
  selectOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectOptionBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '22',
  },
  selectOptionText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  selectOptionTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: colors.primary,
  },
  spinnerWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
  },
  reviewsList: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 18,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
    marginBottom: 4,
  },
  ratingValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: 36,
    color: colors.tertiary,
    lineHeight: 40,
    letterSpacing: -1,
  },
  ratingMeta: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewAuthor: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.onSurface,
    marginBottom: 3,
  },
  reviewDate: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant + '80',
  },
  reviewText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  followersList: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  followersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  followersIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followersTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  followersMeta: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  followersCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
    overflow: 'hidden',
  },
  followerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  followerRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '33',
  },
  followerAvatarWrap: {
    width: 44,
    height: 44,
    position: 'relative',
  },
  followerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '44',
  },
  followerVerified: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  followerInfo: {
    flex: 1,
    gap: 3,
  },
  followerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  followerName: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  followerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  followerMeta: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant + '99',
    flexShrink: 1,
  },
  menuSection: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  menuGroupTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: colors.onSurfaceVariant + '99',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  menuCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
    overflow: 'hidden',
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '22',
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryContainer + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconWrapDanger: {
    backgroundColor: colors.errorContainer + '44',
  },
  menuLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
    flex: 1,
  },
  menuLabelDanger: {
    color: colors.error,
    fontFamily: 'Manrope-SemiBold',
  },
  menuBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  menuBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    color: colors.onPrimaryContainer,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkChip: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  checkChipText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  version: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.outlineVariant,
    textAlign: 'center',
    paddingTop: 22,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  confirmCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  confirmTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: colors.onSurface,
  },
  confirmDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  confirmAction: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmActionText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  authGate: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  authIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary + '0f',
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  upgradeBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBannerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  upgradeBannerDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    lineHeight: 17,
  },
  upgradeBannerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
  },
  upgradeBannerBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  statsCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
    gap: 12,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statsDivider: {
    width: 0.5,
    height: 36,
    backgroundColor: colors.outlineVariant + '55',
  },
  statsValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: 20,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  statsLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  statsChart: {
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '33',
    paddingTop: 10,
    marginBottom: 10,
  },
  statsChartTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 8,
  },
  statsChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 64,
  },
  statsChartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  statsChartBarTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  statsChartBar: {
    width: '70%',
    borderRadius: 4,
    backgroundColor: colors.primary + 'cc',
    minHeight: 2,
  },
  statsChartDay: {
    fontFamily: 'Manrope-Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant + '99',
    marginTop: 4,
  },
  statsTopRow: {
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '33',
    paddingTop: 10,
  },
  statsTopText: {
    flexWrap: 'wrap',
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  statsTopName: {
    fontFamily: 'Manrope-SemiBold',
    color: colors.onSurface,
  },
  statsLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary + '08',
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.primary + '22',
  },
  statsLockedIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsLockedTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  statsLockedDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 17,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  cardStatsText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginRight: 6,
  },
});
