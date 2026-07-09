import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client/react';
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Mail,
  Phone as PhoneIcon,
  Star,
  Flag,
  UserPlus,
  UserCheck,
  Package,
  Users,
  Pencil,
  Trash2,
  Share2,
  ChevronRight,
  X,
  Search,
  ArrowDownUp,
  ChevronDown,
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { GET_USER } from '@/graphql/queries';
import { useProductsBySeller } from '@/hooks/useProducts';
import { useReviewsBySeller, useSellerRating, useCreateReview, useUpdateReview, useDeleteReview } from '@/hooks/useReviews';
import Spinner from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';
import {
  useFollowers,
  useFollowing,
  useFollowersCount,
  useFollowingCount,
  useIsFollowing,
  useFollowToggle,
} from '@/hooks/useFollowers';
import { useAuth } from '@/hooks/useAuth';
import ProductCard, { ProductCardSkeleton, fmtPrice, fmtNumber } from '@/components/ProductCard';
import RipplePress from '@/components/RipplePress';
import Skeleton from '@/components/Skeleton';
import ReportSheet from '@/components/ReportSheet';
import { useShare } from '@/hooks/useShare';
import { API_URL } from '@/lib/config';

const COVER_HEIGHT = 220;
const AVATAR_SIZE = 92;
const PREVIEW_LIMIT = 6;
const FOLLOWER_LIMIT = 8;

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `hace ${weeks} semanas`;
  const months = Math.floor(days / 30);
  return `hace ${months} meses`;
}

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          color={i <= rating ? colors.tertiaryContainer : colors.outlineVariant}
          fill={i <= rating ? colors.tertiaryContainer : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function PublicUserProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const userId = id || '';

  const { isAuthenticated, user: me } = useAuth();
  const isOwn = !!me?.id && me.id === userId;

  const { data, loading, refetch: refetchUser } = useQuery<any>(GET_USER, {
    variables: { id: userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });
  const user = data?.user;

  const { products, refetch: refetchProducts } = useProductsBySeller(userId);
  const { reviews, refetch: refetchReviews } = useReviewsBySeller(userId);
  const { average: avgRating, count: ratingCount } = useSellerRating(userId);
  const { followers, refetch: refetchFollowers } = useFollowers(userId);
  const { following: followingList, refetch: refetchFollowing } = useFollowing(userId);
  const { count: followersCount } = useFollowersCount(userId);
  const { count: followingCount } = useFollowingCount(userId);
  const { isFollowing } = useIsFollowing(isAuthenticated && !isOwn ? userId : '');
  const { follow, unfollow } = useFollowToggle();

  const { create: createReview, loading: submittingReview } = useCreateReview();
  const { update: updateReview, loading: updatingReview } = useUpdateReview();
  const { remove: deleteReview, loading: deletingReview } = useDeleteReview();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [following, setFollowing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [bioLines, setBioLines] = useState<number | null>(null);

  const [allProductsOpen, setAllProductsOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productPageSize, setProductPageSize] = useState(10);

  const [allFollowersOpen, setAllFollowersOpen] = useState(false);
  const [followerSearch, setFollowerSearch] = useState('');
  const [followerPageSize, setFollowerPageSize] = useState(10);
  const [followerSort, setFollowerSort] = useState<'recent' | 'oldest'>('recent');

  const [allFollowingOpen, setAllFollowingOpen] = useState(false);
  const [followingSearch, setFollowingSearch] = useState('');
  const [followingPageSize, setFollowingPageSize] = useState(10);
  const [followingSort, setFollowingSort] = useState<'recent' | 'oldest'>('recent');

  const [allReviewsOpen, setAllReviewsOpen] = useState(false);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewPageSize, setReviewPageSize] = useState(10);
  const [reviewSort, setReviewSort] = useState<'recent' | 'oldest' | 'best' | 'worst'>('recent');
  const [reviewSortOpen, setReviewSortOpen] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const hasAlreadyReviewed = reviews.some((r: any) => r.author?.id === me?.id);

  const { share } = useShare();
  const onShareProfile = () =>
    share({ type: 'profile', id: userId, name: user?.name ?? 'este vendedor' });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchUser(), refetchProducts(), refetchReviews(), refetchFollowers(), refetchFollowing()]);
    } catch {}
    setRefreshing(false);
  };

  useEffect(() => setFollowing(isFollowing), [isFollowing]);

  const onToggleFollow = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    const next = !following;
    setFollowing(next);
    try {
      if (next) await follow(userId);
      else await unfollow(userId);
    } catch { setFollowing(!next); }
  };

  const onSubmitReview = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (reviewRating === 0) {
      Alert.alert('Valoración', 'Selecciona una puntuación antes de enviar.');
      return;
    }
    try {
      if (editingReviewId) {
        await updateReview(editingReviewId, { rating: reviewRating, text: reviewText.trim() || undefined });
        setEditingReviewId(null);
        setReviewRating(0);
        setReviewText('');
        Alert.alert('Actualizado', 'Tu valoración ha sido actualizada.');
      } else {
        await createReview({ sellerId: userId, rating: reviewRating, text: reviewText.trim() || undefined });
        setReviewRating(0);
        setReviewText('');
        Alert.alert('Enviado', 'Tu valoración ha sido publicada.');
      }
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'No se pudo enviar la valoración.'));
    }
  };

  const onEditReview = (review: any) => {
    setEditingReviewId(review.id);
    setReviewRating(review.rating);
    setReviewText(review.text || ''); 
  };

  const onDeleteReview = (reviewId: string) => {
    Alert.alert('Eliminar valoración', '¿Estás seguro de que quieres eliminar tu valoración?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReview(reviewId);
            setEditingReviewId(null);
            setReviewRating(0);
            setReviewText('');
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err, 'No se pudo eliminar la valoración.'));
          }
        },
      },
    ]);
  };

  const onReport = () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setReportOpen(true);
  };

  const productItems = products.map((p: any) => {
    const img = p.images?.[0]?.url || '';
    return {
      id: p.id,
      title: p.title,
      price: fmtPrice(Number(p.price)),
      priceRaw: Number(p.price),
      location: p.city || '',
      image: img.startsWith('/') ? `${API_URL}${img}` : img,
      discount: p.discount,
      categoryLabel: p.category?.label,
      operation: p.propertyDetail?.operation,
      offerType: p.serviceDetail?.offerType,
      postedAgo: timeAgo(p.createdAt),
    };
  });

  const filteredProducts = productSearch.trim()
    ? productItems.filter((p: any) => p.title.toLowerCase().includes(productSearch.trim().toLowerCase()))
    : productItems;
  const paginatedProducts = filteredProducts.slice(0, productPageSize);
  const hasMoreProducts = filteredProducts.length > productPageSize;

  const reviewItems = reviews.map((r: any) => ({
    id: r.id,
    authorId: r.author?.id || '',
    author: r.author?.name || '',
    avatar: r.author?.avatarUrl || '',
    rating: r.rating,
    text: r.text || '',
    date: r.createdAt ? timeAgo(r.createdAt) : '',
    createdAt: r.createdAt || '',
    raw: r,
  }));

  const followerItems = (followers ?? []).map((f: any) => ({
    id: f.id,
    userId: f.follower?.id || '',
    name: f.follower?.name || '',
    avatar: f.follower?.avatarUrl || '',
    verified: f.follower?.verified ?? false,
    location: f.follower?.location || '',
    since: f.createdAt ? timeAgo(f.createdAt) : '',
    createdAt: f.createdAt || '',
  }));

  const followingItems = (followingList ?? []).map((f: any) => ({
    id: f.id,
    userId: f.followed?.id || '',
    name: f.followed?.name || '',
    avatar: f.followed?.avatarUrl || '',
    verified: f.followed?.verified ?? false,
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

  if (loading && !user) {
    return (
      <View style={styles.root}>
        <Skeleton style={{ height: COVER_HEIGHT, borderRadius: 0 }} />
        <View style={{ paddingHorizontal: 16, marginTop: -(AVATAR_SIZE / 2) }}>
          <Skeleton style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 4, borderColor: colors.surface }} />
          <Skeleton style={{ height: 24, width: '55%', borderRadius: 8, marginTop: 14 }} />
          <Skeleton style={{ height: 14, width: '40%', borderRadius: 6, marginTop: 10 }} />
          <Skeleton style={{ height: 64, borderRadius: 16, marginTop: 22 }} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 22 }}>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </View>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.notFound}>Usuario no encontrado.</Text>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={{ marginTop: 12 }}>
          <Text style={{ fontFamily: 'Manrope-Bold', fontSize: 14, color: colors.primary }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const memberSince = user.createdAt ? new Date(user.createdAt).getFullYear() : null;

  return (
    <View style={styles.root}>
      {/* Sticky compact header */}
      <Animated.View
        pointerEvents="none"
        style={[styles.stickyHeader, { paddingTop: insets.top, height: 52 + insets.top, opacity: headerOpacity }]}>
        <Text style={styles.stickyHeaderTitle}>{user.name}</Text>
      </Animated.View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        extraScrollHeight={80}
        enableOnAndroid
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={(e: any) => scrollY.setValue(e.nativeEvent.contentOffset.y)}>
        {/* Cover */}
        <View style={styles.coverWrap}>
          {user.coverUrl ? (
            <Animated.Image
              source={{ uri: user.coverUrl }}
              style={[styles.cover, { transform: [{ translateY: coverParallax }, { scale: coverScale }] }]}
            />
          ) : (
            <Animated.View
              style={[styles.cover, { backgroundColor: colors.surfaceContainerHigh, transform: [{ translateY: coverParallax }, { scale: coverScale }] }]}
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.35)', colors.surface]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 8 }]}
            activeOpacity={0.8}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
            <ArrowLeft size={20} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Avatar + actions */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{user.name?.charAt(0) ?? '?'}</Text>
              </View>
            )}
            {user.verified && (
              <View style={styles.verifiedBadge}>
                <BadgeCheck size={16} color="#ffffff" fill={colors.primary} />
              </View>
            )}
          </View>

          <View style={styles.avatarActions}>
            {!isOwn && (
              <>
                <TouchableOpacity
                  style={[styles.followMainBtn, following && styles.followMainBtnActive]}
                  activeOpacity={0.85}
                  onPress={onToggleFollow}>
                  {following ? (
                    <UserCheck size={14} color={colors.onSurface} strokeWidth={1.9} />
                  ) : (
                    <UserPlus size={14} color="#ffffff" strokeWidth={1.9} />
                  )}
                  <Text style={[styles.followMainText, following && styles.followMainTextActive]}>
                    {following ? 'Siguiendo' : 'Seguir'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reportBtn}
                  activeOpacity={0.85}
                  onPress={onReport}>
                  <Flag size={14} color={colors.error} strokeWidth={1.9} />
                </TouchableOpacity>
              </>
            )}
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
            <Text style={styles.name}>{user.name}</Text>
            {user.verified && (
              <View style={styles.verifiedChip}>
                <BadgeCheck size={11} color={colors.primary} strokeWidth={2} />
                <Text style={styles.verifiedChipText}>Verificado</Text>
              </View>
            )}
          </View>
          <View style={styles.locationRow}>
            {user.location ? (
              <>
                <MapPin size={13} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                <Text style={styles.locationText}>{user.location}</Text>
                <Text style={styles.dot}>·</Text>
              </>
            ) : null}
            {memberSince ? <Text style={styles.locationText}>Desde {memberSince}</Text> : null}
          </View>
          {user.bio ? (
            <>
              <Text
                style={styles.bio}
                numberOfLines={bioLines !== null && !bioExpanded ? 5 : undefined}
                onTextLayout={(e) => {
                  if (bioLines === null) setBioLines(e.nativeEvent.lines.length);
                }}>
                {user.bio}
              </Text>
              {bioLines !== null && bioLines > 5 && (
                <TouchableOpacity activeOpacity={0.7} onPress={() => setBioExpanded(!bioExpanded)}>
                  <Text style={styles.bioToggle}>{bioExpanded ? 'Ver menos' : 'Ver más'}</Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}
          {(user.showEmail || user.showPhone) && (
            <View style={styles.contactRow}>
              {user.showEmail && user.email ? (
                <View style={styles.contactItem}>
                  <Mail size={13} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                  <Text style={styles.contactText}>{user.email}</Text>
                </View>
              ) : null}
              {user.showPhone && user.phone ? (
                <View style={styles.contactItem}>
                  <PhoneIcon size={13} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                  <Text style={styles.contactText}>{user.phone}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* Stat tabs */}
        <View style={styles.statTabs}>
          {[
            { value: fmtNumber(products.length), label: 'Anuncios' },
            { value: avgRating > 0 ? avgRating.toFixed(1) : '—', label: 'Valoración' },
            { value: fmtNumber(followersCount), label: 'Seguidores' },
            { value: fmtNumber(followingCount), label: 'Siguiendo' },
          ].map(({ value, label }, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.statTab, activeTab === i && styles.statTabActive]}
              onPress={() => setActiveTab(i)}
              activeOpacity={0.7}>
              <Text style={[styles.statTabValue, activeTab === i && styles.statTabValueActive]}>{value}</Text>
              <Text style={styles.statTabLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 0 ? (
          <View style={styles.grid}>
            {productItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>Sin anuncios publicados</Text>
              </View>
            ) : (
              <>
                {chunk(productItems.slice(0, PREVIEW_LIMIT), 2).map((pair, rowIdx) => (
                  <View key={rowIdx} style={styles.gridRow}>
                    {pair.map((item: any) => (
                      <ProductCard
                        key={item.id}
                        item={item}
                        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                      />
                    ))}
                    {pair.length === 1 && <View style={{ flex: 1 }} />}
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
              </>
            )}
          </View>
        ) : activeTab === 1 ? (
          <View style={styles.reviewsList}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingValue}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</Text>
              <View>
                <StarRating rating={Math.round(avgRating)} />
                <Text style={styles.ratingMeta}>Basado en {ratingCount} valoraciones</Text>
              </View>
            </View>

            {/* Review form */}
            {!isOwn && isAuthenticated && (!hasAlreadyReviewed || !!editingReviewId) && (
              <View style={styles.reviewFormCard}>
                <View style={styles.reviewFormHeader}>
                  <Text style={styles.reviewFormTitle}>
                    {editingReviewId ? 'Editar valoración' : 'Deja tu valoración'}
                  </Text>
                  {editingReviewId && (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => { setEditingReviewId(null); setReviewRating(0); setReviewText(''); }}>
                      <Text style={styles.reviewCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.reviewStarsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} activeOpacity={0.7} onPress={() => setReviewRating(s)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                      <Star
                        size={28}
                        color={s <= reviewRating ? colors.tertiaryContainer : colors.outlineVariant}
                        fill={s <= reviewRating ? colors.tertiaryContainer : 'transparent'}
                        strokeWidth={1.5}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Escribe un comentario (opcional)"
                  placeholderTextColor={colors.onSurfaceVariant + '66'}
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.reviewSubmitBtn, (reviewRating === 0 || submittingReview || updatingReview) && { opacity: 0.5 }]}
                  activeOpacity={0.85}
                  disabled={reviewRating === 0 || submittingReview || updatingReview}
                  onPress={onSubmitReview}>
                  {submittingReview || updatingReview ? (
                    <Spinner color="#ffffff" />
                  ) : (
                    <Text style={styles.reviewSubmitText}>
                      {editingReviewId ? 'Guardar cambios' : 'Enviar valoración'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {reviewItems.length === 0 && (isOwn || !isAuthenticated || hasAlreadyReviewed) ? (
              <View style={styles.emptyState}>
                <Star size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>Aún no tiene valoraciones</Text>
              </View>
            ) : (
              <>
                {reviewItems.slice(0, FOLLOWER_LIMIT).map((rev: any) => {
                  const isMine = rev.authorId === me?.id;
                  return (
                    <View key={rev.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        {rev.avatar ? (
                          <Image source={{ uri: rev.avatar }} style={styles.reviewAvatar} />
                        ) : (
                          <View style={[styles.reviewAvatar, styles.avatarFallback]}>
                            <Text style={styles.reviewInitial}>{rev.author?.charAt(0) ?? '?'}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewAuthor}>{rev.author}</Text>
                          <StarRating rating={rev.rating} />
                        </View>
                        {isMine ? (
                          <View style={styles.reviewActions}>
                            <TouchableOpacity activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => onEditReview(rev.raw)}>
                              <Pencil size={15} color={colors.primary} strokeWidth={1.8} />
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={deletingReview} onPress={() => onDeleteReview(rev.id)}>
                              <Trash2 size={15} color={colors.error} strokeWidth={1.8} />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text style={styles.reviewDate}>{rev.date}</Text>
                        )}
                      </View>
                      {rev.text ? <Text style={styles.reviewText}>{rev.text}</Text> : null}
                      {isMine && <Text style={styles.reviewDate}>{rev.date}</Text>}
                    </View>
                  );
                })}
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
          <View style={styles.followersList}>
            <View style={styles.followersHeader}>
              <View style={styles.followersIconWrap}>
                <Users size={20} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.followersTitle}>{fmtNumber(followersCount)} seguidores</Text>
                <Text style={styles.followersMeta}>Personas que confían en este perfil</Text>
              </View>
            </View>
            {followerItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>Aún no tiene seguidores</Text>
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
                          {f.avatar ? (
                            <Image source={{ uri: f.avatar }} style={styles.followerAvatar} />
                          ) : (
                            <View style={[styles.followerAvatar, styles.avatarFallback]}>
                              <Text style={styles.reviewInitial}>{f.name?.charAt(0) ?? '?'}</Text>
                            </View>
                          )}
                          {f.verified && (
                            <View style={styles.followerVerified}>
                              <BadgeCheck size={12} color="#ffffff" fill={colors.primary} />
                            </View>
                          )}
                        </View>
                        <View style={styles.followerInfo}>
                          <Text style={styles.followerName} numberOfLines={1}>{f.name}</Text>
                          <View style={styles.followerMetaRow}>
                            <MapPin size={10} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
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
                    <Text style={styles.seeAllCount}>({followersCount})</Text>
                    <ChevronRight size={14} color={colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        ) : (
          <View style={styles.followersList}>
            <View style={styles.followersHeader}>
              <View style={styles.followersIconWrap}>
                <Users size={20} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.followersTitle}>{fmtNumber(followingCount)} siguiendo</Text>
                <Text style={styles.followersMeta}>Perfiles que sigue este usuario</Text>
              </View>
            </View>
            {followingItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>Aún no sigue a nadie</Text>
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
                          {f.avatar ? (
                            <Image source={{ uri: f.avatar }} style={styles.followerAvatar} />
                          ) : (
                            <View style={[styles.followerAvatar, styles.avatarFallback]}>
                              <Text style={styles.reviewInitial}>{f.name?.charAt(0) ?? '?'}</Text>
                            </View>
                          )}
                          {f.verified && (
                            <View style={styles.followerVerified}>
                              <BadgeCheck size={12} color="#ffffff" fill={colors.primary} />
                            </View>
                          )}
                        </View>
                        <View style={styles.followerInfo}>
                          <Text style={styles.followerName} numberOfLines={1}>{f.name}</Text>
                          <View style={styles.followerMetaRow}>
                            <MapPin size={10} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
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
                    <Text style={styles.seeAllText}>Ver todos los seguidos</Text>
                    <Text style={styles.seeAllCount}>({followingCount})</Text>
                    <ChevronRight size={14} color={colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* All products modal */}
      <Modal
        visible={allProductsOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setAllProductsOpen(false); setProductSearch(''); setProductPageSize(10); }}>
        <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Anuncios ({productItems.length})</Text>
            <TouchableOpacity style={styles.modalClose} activeOpacity={0.7} onPress={() => { setAllProductsOpen(false); setProductSearch(''); setProductPageSize(10); }}>
              <X size={20} color={colors.onSurface} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrap}>
            <Search size={16} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
            <TextInput style={styles.searchInput} placeholder="Buscar por título..." placeholderTextColor={colors.onSurfaceVariant + '66'} value={productSearch} onChangeText={(t) => { setProductSearch(t); setProductPageSize(10); }} />
            {productSearch.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setProductSearch(''); setProductPageSize(10); }}>
                <X size={16} color={colors.onSurfaceVariant} strokeWidth={1.8} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {paginatedProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>{productSearch.trim() ? 'Sin resultados' : 'Sin anuncios publicados'}</Text>
              </View>
            ) : (
              <>
                {chunk(paginatedProducts, 2).map((pair, rowIdx) => (
                  <View key={rowIdx} style={styles.gridRow}>
                    {pair.map((item: any) => (
                      <ProductCard key={item.id} item={item} onPress={() => { setAllProductsOpen(false); router.push({ pathname: '/product/[id]', params: { id: item.id } }); }} />
                    ))}
                    {pair.length === 1 && <View style={{ flex: 1 }} />}
                  </View>
                ))}
                {hasMoreProducts && (
                  <TouchableOpacity style={styles.loadMoreBtn} activeOpacity={0.8} onPress={() => setProductPageSize((s) => s + 10)}>
                    <Text style={styles.loadMoreText}>Ver más ({filteredProducts.length - productPageSize} restantes)</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* All followers modal */}
      <Modal
        visible={allFollowersOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setAllFollowersOpen(false); setFollowerSearch(''); setFollowerPageSize(10); setFollowerSort('recent'); }}>
        <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seguidores ({followersCount})</Text>
            <TouchableOpacity style={styles.modalClose} activeOpacity={0.7} onPress={() => { setAllFollowersOpen(false); setFollowerSearch(''); setFollowerPageSize(10); setFollowerSort('recent'); }}>
              <X size={20} color={colors.onSurface} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrap}>
            <Search size={16} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
            <TextInput style={styles.searchInput} placeholder="Buscar por nombre..." placeholderTextColor={colors.onSurfaceVariant + '66'} value={followerSearch} onChangeText={(t) => { setFollowerSearch(t); setFollowerPageSize(10); }} />
            {followerSearch.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setFollowerSearch(''); setFollowerPageSize(10); }}>
                <X size={16} color={colors.onSurfaceVariant} strokeWidth={1.8} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.sortRow}>
            <ArrowDownUp size={14} color={colors.onSurfaceVariant} strokeWidth={1.8} />
            <TouchableOpacity activeOpacity={0.7} style={[styles.sortChip, followerSort === 'recent' && styles.sortChipActive]} onPress={() => setFollowerSort('recent')}>
              <Text style={[styles.sortChipText, followerSort === 'recent' && styles.sortChipTextActive]}>Recientes</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={[styles.sortChip, followerSort === 'oldest' && styles.sortChipActive]} onPress={() => setFollowerSort('oldest')}>
              <Text style={[styles.sortChipText, followerSort === 'oldest' && styles.sortChipTextActive]}>Antiguos</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {paginatedFollowers.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>{followerSearch.trim() ? 'Sin resultados' : 'Aún no tiene seguidores'}</Text>
              </View>
            ) : (
              <View style={styles.followersCard}>
                {paginatedFollowers.map((f: any, i: number) => {
                  const last = i === paginatedFollowers.length - 1;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      activeOpacity={0.7}
                      onPress={() => { setAllFollowersOpen(false); if (f.userId) router.push(`/user/${f.userId}`); }}
                      style={[styles.followerRow, !last && styles.followerRowBorder]}>
                      <View style={styles.followerAvatarWrap}>
                        {f.avatar ? (
                          <Image source={{ uri: f.avatar }} style={styles.followerAvatar} />
                        ) : (
                          <View style={[styles.followerAvatar, styles.avatarFallback]}>
                            <Text style={styles.reviewInitial}>{f.name?.charAt(0) ?? '?'}</Text>
                          </View>
                        )}
                        {f.verified && (
                          <View style={styles.followerVerified}>
                            <BadgeCheck size={12} color="#ffffff" fill={colors.primary} />
                          </View>
                        )}
                      </View>
                      <View style={styles.followerInfo}>
                        <Text style={styles.followerName} numberOfLines={1}>{f.name}</Text>
                        <View style={styles.followerMetaRow}>
                          <MapPin size={10} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
                          <Text style={styles.followerMeta} numberOfLines={1}>{f.location} · {f.since}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {hasMoreFollowers && (
              <TouchableOpacity style={[styles.loadMoreBtn, { marginTop: 12 }]} activeOpacity={0.8} onPress={() => setFollowerPageSize((s) => s + 10)}>
                <Text style={styles.loadMoreText}>Ver más ({filteredFollowers.length - followerPageSize} restantes)</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* All following modal */}
      <Modal
        visible={allFollowingOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setAllFollowingOpen(false); setFollowingSearch(''); setFollowingPageSize(10); setFollowingSort('recent'); }}>
        <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Siguiendo ({followingCount})</Text>
            <TouchableOpacity style={styles.modalClose} activeOpacity={0.7} onPress={() => { setAllFollowingOpen(false); setFollowingSearch(''); setFollowingPageSize(10); setFollowingSort('recent'); }}>
              <X size={20} color={colors.onSurface} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrap}>
            <Search size={16} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
            <TextInput style={styles.searchInput} placeholder="Buscar por nombre..." placeholderTextColor={colors.onSurfaceVariant + '66'} value={followingSearch} onChangeText={(t) => { setFollowingSearch(t); setFollowingPageSize(10); }} />
            {followingSearch.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setFollowingSearch(''); setFollowingPageSize(10); }}>
                <X size={16} color={colors.onSurfaceVariant} strokeWidth={1.8} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.sortRow}>
            <ArrowDownUp size={14} color={colors.onSurfaceVariant} strokeWidth={1.8} />
            <TouchableOpacity activeOpacity={0.7} style={[styles.sortChip, followingSort === 'recent' && styles.sortChipActive]} onPress={() => setFollowingSort('recent')}>
              <Text style={[styles.sortChipText, followingSort === 'recent' && styles.sortChipTextActive]}>Recientes</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={[styles.sortChip, followingSort === 'oldest' && styles.sortChipActive]} onPress={() => setFollowingSort('oldest')}>
              <Text style={[styles.sortChipText, followingSort === 'oldest' && styles.sortChipTextActive]}>Antiguos</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {paginatedFollowing.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>{followingSearch.trim() ? 'Sin resultados' : 'Aún no sigue a nadie'}</Text>
              </View>
            ) : (
              <View style={styles.followersCard}>
                {paginatedFollowing.map((f: any, i: number) => {
                  const last = i === paginatedFollowing.length - 1;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      activeOpacity={0.7}
                      onPress={() => { setAllFollowingOpen(false); if (f.userId) router.push(`/user/${f.userId}`); }}
                      style={[styles.followerRow, !last && styles.followerRowBorder]}>
                      <View style={styles.followerAvatarWrap}>
                        {f.avatar ? (
                          <Image source={{ uri: f.avatar }} style={styles.followerAvatar} />
                        ) : (
                          <View style={[styles.followerAvatar, styles.avatarFallback]}>
                            <Text style={styles.reviewInitial}>{f.name?.charAt(0) ?? '?'}</Text>
                          </View>
                        )}
                        {f.verified && (
                          <View style={styles.followerVerified}>
                            <BadgeCheck size={12} color="#ffffff" fill={colors.primary} />
                          </View>
                        )}
                      </View>
                      <View style={styles.followerInfo}>
                        <Text style={styles.followerName} numberOfLines={1}>{f.name}</Text>
                        <View style={styles.followerMetaRow}>
                          <MapPin size={10} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
                          <Text style={styles.followerMeta} numberOfLines={1}>{f.location} · {f.since}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {hasMoreFollowing && (
              <TouchableOpacity style={[styles.loadMoreBtn, { marginTop: 12 }]} activeOpacity={0.8} onPress={() => setFollowingPageSize((s) => s + 10)}>
                <Text style={styles.loadMoreText}>Ver más ({filteredFollowing.length - followingPageSize} restantes)</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* All reviews modal */}
      <Modal
        visible={allReviewsOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setAllReviewsOpen(false); setReviewSearch(''); setReviewPageSize(10); setReviewSort('recent'); setReviewSortOpen(false); }}>
        <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Valoraciones ({reviewItems.length})</Text>
            <TouchableOpacity style={styles.modalClose} activeOpacity={0.7} onPress={() => { setAllReviewsOpen(false); setReviewSearch(''); setReviewPageSize(10); setReviewSort('recent'); setReviewSortOpen(false); }}>
              <X size={20} color={colors.onSurface} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrap}>
            <Search size={16} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
            <TextInput style={styles.searchInput} placeholder="Buscar por autor..." placeholderTextColor={colors.onSurfaceVariant + '66'} value={reviewSearch} onChangeText={(t) => { setReviewSearch(t); setReviewPageSize(10); }} />
            {reviewSearch.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setReviewSearch(''); setReviewPageSize(10); }}>
                <X size={16} color={colors.onSurfaceVariant} strokeWidth={1.8} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.selectWrap}>
            <TouchableOpacity activeOpacity={0.7} style={styles.selectBtn} onPress={() => setReviewSortOpen((o) => !o)}>
              <ArrowDownUp size={14} color={colors.primary} strokeWidth={1.8} />
              <Text style={styles.selectBtnText}>
                {{ recent: 'Más recientes', oldest: 'Más antiguos', best: 'Mejor valoración', worst: 'Peor valoración' }[reviewSort]}
              </Text>
              <ChevronDown size={16} color={colors.onSurfaceVariant} strokeWidth={1.8} style={reviewSortOpen ? { transform: [{ rotate: '180deg' }] } : undefined} />
            </TouchableOpacity>
            {reviewSortOpen && (
              <View style={styles.selectDropdown}>
                {([
                  { key: 'recent', label: 'Más recientes' },
                  { key: 'oldest', label: 'Más antiguos' },
                  { key: 'best', label: 'Mejor valoración' },
                  { key: 'worst', label: 'Peor valoración' },
                ] as const).map((opt, i, arr) => (
                  <TouchableOpacity key={opt.key} activeOpacity={0.7} style={[styles.selectOption, i < arr.length - 1 && styles.selectOptionBorder]} onPress={() => { setReviewSort(opt.key); setReviewSortOpen(false); }}>
                    <Text style={[styles.selectOptionText, reviewSort === opt.key && styles.selectOptionTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={[styles.ratingHeader, { marginHorizontal: 16, marginTop: 12 }]}>
            <Text style={styles.ratingValue}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</Text>
            <View>
              <StarRating rating={Math.round(avgRating)} />
              <Text style={styles.ratingMeta}>Basado en {ratingCount} valoraciones</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {paginatedReviews.length === 0 ? (
              <View style={styles.emptyState}>
                <Star size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>{reviewSearch.trim() ? 'Sin resultados' : 'Aún no tiene valoraciones'}</Text>
              </View>
            ) : (
              <>
                {paginatedReviews.map((rev: any) => (
                  <View key={rev.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      {rev.avatar ? (
                        <Image source={{ uri: rev.avatar }} style={styles.reviewAvatar} />
                      ) : (
                        <View style={[styles.reviewAvatar, styles.avatarFallback]}>
                          <Text style={styles.reviewInitial}>{rev.author?.charAt(0) ?? '?'}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewAuthor}>{rev.author}</Text>
                        <StarRating rating={rev.rating} />
                      </View>
                      <Text style={styles.reviewDate}>{rev.date}</Text>
                    </View>
                    {rev.text ? <Text style={styles.reviewText}>{rev.text}</Text> : null}
                  </View>
                ))}
                {hasMoreReviews && (
                  <TouchableOpacity style={styles.loadMoreBtn} activeOpacity={0.8} onPress={() => setReviewPageSize((s) => s + 10)}>
                    <Text style={styles.loadMoreText}>Ver más ({filteredReviews.length - reviewPageSize} restantes)</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} type="user" targetId={userId} />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    center: { alignItems: 'center', justifyContent: 'center' },
    notFound: { fontFamily: 'Manrope-SemiBold', fontSize: 16, color: colors.onSurfaceVariant },
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
    stickyHeaderTitle: { fontFamily: 'Manrope-Bold', fontSize: 16, color: colors.onSurface, letterSpacing: -0.3 },
    coverWrap: { height: COVER_HEIGHT, position: 'relative', overflow: 'hidden' },
    cover: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    backBtn: {
      position: 'absolute',
      left: 16,
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
    avatarWrap: { position: 'relative' },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 4,
      borderColor: colors.surface,
      backgroundColor: colors.surfaceContainerLow,
    },
    avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary + '26' },
    avatarInitial: { fontFamily: 'Manrope-Bold', fontSize: 30, color: colors.primary },
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
    avatarActions: { flexDirection: 'row', gap: 8, paddingBottom: 4, alignItems: 'center' },
    followMainBtn: {
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
    followMainBtnActive: {
      backgroundColor: colors.surfaceContainerHigh,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '66',
      shadowOpacity: 0,
      elevation: 0,
    },
    followMainText: { fontFamily: 'Manrope-Bold', fontSize: 13, color: '#ffffff' },
    followMainTextActive: { color: colors.onSurface },
    reportBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 0.5,
      borderColor: colors.error + '44',
      backgroundColor: colors.errorContainer + '33',
      alignItems: 'center',
      justifyContent: 'center',
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
    nameBlock: { paddingHorizontal: 16, gap: 4, marginBottom: 16 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    name: { fontFamily: 'Manrope-Bold', fontSize: 24, color: colors.onSurface, letterSpacing: -0.3 },
    verifiedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    verifiedChipText: { fontFamily: 'Manrope-Bold', fontSize: 10, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.6 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    locationText: { fontFamily: 'Manrope-Regular', fontSize: 13, color: colors.onSurfaceVariant },
    dot: { fontFamily: 'Manrope-Regular', fontSize: 13, color: colors.onSurfaceVariant + '88', marginHorizontal: 2 },
    bio: { fontFamily: 'Manrope-Regular', fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 20, marginTop: 8 },
    bioToggle: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: colors.primary, marginTop: 4 },
    contactRow: { gap: 6, marginTop: 10 },
    contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    contactText: { fontFamily: 'Manrope-Regular', fontSize: 13, color: colors.onSurfaceVariant },
    statTabs: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 12,
      padding: 3,
    },
    statTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
    statTabActive: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    statTabValue: { fontFamily: 'Manrope-Bold', fontSize: 17, color: colors.onSurface, lineHeight: 22 },
    statTabValueActive: { color: colors.primary },
    statTabLabel: { fontFamily: 'Manrope-Regular', fontSize: 10, color: colors.onSurfaceVariant, marginTop: 1 },
    grid: { paddingHorizontal: 16, gap: 12, marginBottom: 24 },
    gridRow: { flexDirection: 'row', gap: 8 },
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { fontFamily: 'Manrope-Regular', fontSize: 15, color: colors.onSurfaceVariant },
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
    seeAllText: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: colors.primary },
    seeAllCount: { fontFamily: 'Manrope-Regular', fontSize: 12, color: colors.onSurfaceVariant },
    reviewsList: { paddingHorizontal: 16, gap: 12, marginBottom: 24 },
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
    ratingValue: { fontFamily: 'Manrope-Bold', fontSize: 36, color: colors.tertiary, lineHeight: 40, letterSpacing: -1 },
    ratingMeta: { fontFamily: 'Manrope-Regular', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 4 },
    reviewFormCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 16,
      padding: 16,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
      gap: 14,
    },
    reviewFormHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reviewFormTitle: { fontFamily: 'Manrope-Bold', fontSize: 15, color: colors.onSurface },
    reviewCancelText: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: colors.error },
    reviewActions: { flexDirection: 'row', gap: 14, alignItems: 'center' },
    reviewStarsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 4 },
    reviewInput: {
      fontFamily: 'Manrope-Regular',
      fontSize: 14,
      color: colors.onSurface,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 12,
      padding: 12,
      minHeight: 80,
      textAlignVertical: 'top',
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
    },
    reviewSubmitBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
    reviewSubmitText: { fontFamily: 'Manrope-Bold', fontSize: 14, color: '#ffffff' },
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
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
    reviewInitial: { fontFamily: 'Manrope-Bold', fontSize: 14, color: colors.primary },
    reviewAuthor: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: colors.onSurface, marginBottom: 3 },
    reviewDate: { fontFamily: 'Manrope-Regular', fontSize: 11, color: colors.onSurfaceVariant + '80' },
    reviewText: { fontFamily: 'Manrope-Regular', fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 20 },
    followersList: { paddingHorizontal: 16, gap: 12, marginBottom: 24 },
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
    followersTitle: { fontFamily: 'Manrope-Bold', fontSize: 16, color: colors.onSurface, letterSpacing: -0.2 },
    followersMeta: { fontFamily: 'Manrope-Regular', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
    followersCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 16,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
      overflow: 'hidden',
    },
    followerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
    followerRowBorder: { borderBottomWidth: 0.5, borderBottomColor: colors.outlineVariant + '33' },
    followerAvatarWrap: { width: 44, height: 44, position: 'relative' },
    followerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 0.5, borderColor: colors.outlineVariant + '44' },
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
    followerInfo: { flex: 1, gap: 3 },
    followerName: { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: colors.onSurface },
    followerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    followerMeta: { fontFamily: 'Manrope-Regular', fontSize: 11, color: colors.onSurfaceVariant + '99', flexShrink: 1 },
    modalRoot: { flex: 1, backgroundColor: colors.surface },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.outlineVariant + '4d',
    },
    modalTitle: { fontFamily: 'Manrope-Bold', fontSize: 18, color: colors.onSurface, letterSpacing: -0.3 },
    modalClose: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchWrap: {
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
    searchInput: { flex: 1, fontFamily: 'Manrope-Regular', fontSize: 14, color: colors.onSurface, padding: 0 },
    loadMoreBtn: {
      alignItems: 'center',
      paddingVertical: 14,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
    },
    loadMoreText: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: colors.primary },
    sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },
    sortChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.surfaceContainerLow,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
    },
    sortChipActive: { backgroundColor: colors.primary + '18', borderColor: colors.primary + '44' },
    sortChipText: { fontFamily: 'Manrope-SemiBold', fontSize: 12, color: colors.onSurfaceVariant },
    sortChipTextActive: { color: colors.primary },
    selectWrap: { paddingHorizontal: 16, marginTop: 8, marginBottom: 4, zIndex: 10 },
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
    selectBtnText: { flex: 1, fontFamily: 'Manrope-SemiBold', fontSize: 13, color: colors.onSurface },
    selectDropdown: {
      marginTop: 4,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
      overflow: 'hidden',
    },
    selectOption: { paddingHorizontal: 14, paddingVertical: 12 },
    selectOptionBorder: { borderBottomWidth: 0.5, borderBottomColor: colors.outlineVariant + '22' },
    selectOptionText: { fontFamily: 'Manrope-Regular', fontSize: 13, color: colors.onSurfaceVariant },
    selectOptionTextActive: { fontFamily: 'Manrope-SemiBold', color: colors.primary },
  });
