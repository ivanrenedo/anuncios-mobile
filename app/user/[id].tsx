import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client/react';
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Star,
  Flag,
  UserPlus,
  UserCheck,
  Package,
  Users,
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { GET_USER } from '@/graphql/queries';
import { useProductsBySeller } from '@/hooks/useProducts';
import { useReviewsBySeller, useSellerRating } from '@/hooks/useReviews';
import {
  useFollowers,
  useFollowersCount,
  useFollowingCount,
  useIsFollowing,
  useFollowToggle,
} from '@/hooks/useFollowers';
import { useAuth } from '@/hooks/useAuth';
import ProductCard from '@/components/ProductCard';
import Skeleton from '@/components/Skeleton';
import ReportSheet from '@/components/ReportSheet';
import { API_URL } from '@/lib/config';

const COVER_HEIGHT = 180;
const AVATAR_SIZE = 88;
const TABS = ['Anuncios', 'Valoraciones', 'Seguidores'] as const;

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'hoy';
  if (days < 30) return `hace ${days} d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} meses`;
  return `hace ${Math.floor(months / 12)} años`;
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

  const { data, loading } = useQuery<any>(GET_USER, {
    variables: { id: userId },
    skip: !userId,
  });
  const user = data?.user;

  const { products } = useProductsBySeller(userId);
  const { reviews } = useReviewsBySeller(userId);
  const { average: avgRating, count: ratingCount } = useSellerRating(userId);
  const { followers } = useFollowers(userId);
  const { count: followersCount } = useFollowersCount(userId);
  const { count: followingCount } = useFollowingCount(userId);
  const { isFollowing } = useIsFollowing(isAuthenticated && !isOwn ? userId : '');
  const { follow, unfollow } = useFollowToggle();

  const [activeTab, setActiveTab] = useState(0);
  const [following, setFollowing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => setFollowing(isFollowing), [isFollowing]);

  const onToggleFollow = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const next = !following;
    setFollowing(next);
    try {
      if (next) await follow(userId);
      else await unfollow(userId);
    } catch {
      setFollowing(!next);
    }
  };

  const onReport = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setReportOpen(true);
  };

  const productItems = products.map((p: any) => {
    const img = p.images?.[0]?.url || '';
    return {
      id: p.id,
      title: p.title,
      price: `${Number(p.price).toLocaleString('es')} XAF`,
      location: p.city || '',
      image: img.startsWith('/') ? `${API_URL}${img}` : img,
    };
  });

  if (loading && !user) {
    return (
      <View style={styles.root}>
        <Skeleton style={{ height: COVER_HEIGHT, borderRadius: 0 }} />
        <View style={{ paddingHorizontal: 16, marginTop: -(AVATAR_SIZE / 2) }}>
          <Skeleton
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              borderWidth: 4,
              borderColor: colors.surface,
            }}
          />
          <Skeleton style={{ height: 22, width: '55%', borderRadius: 8, marginTop: 14 }} />
          <Skeleton style={{ height: 64, borderRadius: 16, marginTop: 20 }} />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.notFound}>Usuario no encontrado.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const memberSince = user.createdAt ? new Date(user.createdAt).getFullYear() : null;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Cover */}
        <View style={styles.coverWrap}>
          {user.coverUrl ? (
            <Image source={{ uri: user.coverUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, { backgroundColor: colors.surfaceContainerHigh }]} />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'transparent', colors.surface]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 8 }]}
            activeOpacity={0.8}
            onPress={() => router.back()}>
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
                <BadgeCheck size={16} color="#ffffff" fill={colors.primary} strokeWidth={0} />
              </View>
            )}
          </View>

          {!isOwn && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.followBtn, following && styles.followBtnActive]}
                activeOpacity={0.85}
                onPress={onToggleFollow}>
                {following ? (
                  <UserCheck size={16} color={colors.onSurface} strokeWidth={1.9} />
                ) : (
                  <UserPlus size={16} color="#ffffff" strokeWidth={1.9} />
                )}
                <Text style={[styles.followText, following && styles.followTextActive]}>
                  {following ? 'Siguiendo' : 'Seguir'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reportBtn}
                activeOpacity={0.85}
                onPress={onReport}>
                <Flag size={16} color={colors.error} strokeWidth={1.9} />
                <Text style={styles.reportText}>Reportar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Name + location */}
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.metaRow}>
            {user.location ? (
              <>
                <MapPin size={13} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                <Text style={styles.metaText}>{user.location}</Text>
                <Text style={styles.dot}>·</Text>
              </>
            ) : null}
            {memberSince ? <Text style={styles.metaText}>Desde {memberSince}</Text> : null}
          </View>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { value: String(products.length), label: 'Anuncios' },
            { value: avgRating > 0 ? avgRating.toFixed(1) : '—', label: 'Valoración' },
            { value: String(followersCount), label: 'Seguidores' },
            { value: String(followingCount), label: 'Siguiendo' },
          ].map(({ value, label }, i, arr) => (
            <View
              key={label}
              style={[styles.statItem, i === arr.length - 1 && { borderRightWidth: 0 }]}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === i && styles.tabActive]}
              activeOpacity={0.8}
              onPress={() => setActiveTab(i)}>
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 0 ? (
          productItems.length === 0 ? (
            <Empty icon={Package} text="Sin anuncios publicados" colors={colors} styles={styles} />
          ) : (
            <View style={styles.grid}>
              {chunk(productItems, 2).map((pair, rowIdx) => (
                <View key={rowIdx} style={styles.gridRow}>
                  {pair.map((item: any) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      onPress={() =>
                        router.push({ pathname: '/product/[id]', params: { id: item.id } })
                      }
                    />
                  ))}
                  {pair.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ))}
            </View>
          )
        ) : activeTab === 1 ? (
          <View style={styles.list}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingValue}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</Text>
              <View>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={13}
                      color={s <= Math.round(avgRating) ? colors.tertiaryContainer : colors.outlineVariant}
                      fill={s <= Math.round(avgRating) ? colors.tertiaryContainer : 'transparent'}
                      strokeWidth={1.5}
                    />
                  ))}
                </View>
                <Text style={styles.ratingMeta}>Basado en {ratingCount} valoraciones</Text>
              </View>
            </View>
            {reviews.length === 0 ? (
              <Empty icon={Star} text="Aún no tiene valoraciones" colors={colors} styles={styles} />
            ) : (
              reviews.map((r: any) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    {r.author?.avatarUrl ? (
                      <Image source={{ uri: r.author.avatarUrl }} style={styles.reviewAvatar} />
                    ) : (
                      <View style={[styles.reviewAvatar, styles.avatarFallback]}>
                        <Text style={styles.reviewInitial}>{r.author?.name?.charAt(0) ?? '?'}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewAuthor}>{r.author?.name}</Text>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={11}
                            color={s <= r.rating ? colors.tertiaryContainer : colors.outlineVariant}
                            fill={s <= r.rating ? colors.tertiaryContainer : 'transparent'}
                            strokeWidth={1.5}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>{timeAgo(r.createdAt)}</Text>
                  </View>
                  {r.text ? <Text style={styles.reviewText}>{r.text}</Text> : null}
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {followers.length === 0 ? (
              <Empty icon={Users} text="Aún no tiene seguidores" colors={colors} styles={styles} />
            ) : (
              followers.map((f: any) => {
                const u = f.follower;
                if (!u) return null;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={styles.followerRow}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({ pathname: '/user/[id]', params: { id: u.id } })
                    }>
                    {u.avatarUrl ? (
                      <Image source={{ uri: u.avatarUrl }} style={styles.followerAvatar} />
                    ) : (
                      <View style={[styles.followerAvatar, styles.avatarFallback]}>
                        <Text style={styles.reviewInitial}>{u.name?.charAt(0) ?? '?'}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.followerName}>{u.name}</Text>
                      {u.location ? (
                        <Text style={styles.followerMeta}>{u.location}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        type="user"
        targetId={userId}
      />
    </View>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function Empty({
  icon: Icon,
  text,
  colors,
  styles,
}: {
  icon: React.ElementType;
  text: string;
  colors: ThemeColors;
  styles: any;
}) {
  return (
    <View style={styles.empty}>
      <Icon size={40} color={colors.outlineVariant} strokeWidth={1} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    center: { alignItems: 'center', justifyContent: 'center' },
    notFound: { fontFamily: 'Manrope-SemiBold', fontSize: 16, color: colors.onSurfaceVariant },
    backLink: { marginTop: 12 },
    backLinkText: { fontFamily: 'Manrope-Bold', fontSize: 14, color: colors.primary },
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
      marginBottom: 12,
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
    actions: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
    followBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 20,
      backgroundColor: colors.primary,
    },
    followBtnActive: {
      backgroundColor: colors.surfaceContainerHigh,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '66',
    },
    followText: { fontFamily: 'Manrope-Bold', fontSize: 13, color: '#ffffff' },
    followTextActive: { color: colors.onSurface },
    reportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      backgroundColor: colors.errorContainer + '55',
    },
    reportText: { fontFamily: 'Manrope-Bold', fontSize: 13, color: colors.error },
    nameBlock: { paddingHorizontal: 16, gap: 4, marginBottom: 16 },
    name: { fontFamily: 'Manrope-Bold', fontSize: 22, color: colors.onSurface, letterSpacing: -0.3 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    metaText: { fontFamily: 'Manrope-Regular', fontSize: 13, color: colors.onSurfaceVariant },
    dot: { fontFamily: 'Manrope-Regular', fontSize: 13, color: colors.onSurfaceVariant + '88', marginHorizontal: 2 },
    bio: { fontFamily: 'Manrope-Regular', fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 20, marginTop: 8 },
    statsRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 18,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 16,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
      overflow: 'hidden',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 14,
      borderRightWidth: 0.5,
      borderRightColor: colors.outlineVariant + '33',
    },
    statValue: { fontFamily: 'Manrope-Bold', fontSize: 20, color: colors.primary, lineHeight: 26 },
    statLabel: { fontFamily: 'Manrope-Regular', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
    tabBar: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 12,
      padding: 4,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
    },
    tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
    tabActive: { backgroundColor: colors.surfaceContainerLowest },
    tabText: { fontFamily: 'Manrope-Regular', fontSize: 13, color: colors.onSurfaceVariant },
    tabTextActive: { fontFamily: 'Manrope-SemiBold', color: colors.onSurface },
    grid: { paddingHorizontal: 16, gap: 12 },
    gridRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    list: { paddingHorizontal: 16, gap: 12 },
    empty: { alignItems: 'center', paddingVertical: 44, gap: 10 },
    emptyText: { fontFamily: 'Manrope-Regular', fontSize: 15, color: colors.onSurfaceVariant },
    ratingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 16,
      padding: 18,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
    },
    ratingValue: { fontFamily: 'Manrope-Bold', fontSize: 34, color: colors.tertiary, letterSpacing: -1 },
    ratingMeta: { fontFamily: 'Manrope-Regular', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 4 },
    reviewCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 16,
      padding: 16,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
      gap: 10,
    },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
    reviewInitial: { fontFamily: 'Manrope-Bold', fontSize: 14, color: colors.primary },
    reviewAuthor: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: colors.onSurface, marginBottom: 3 },
    reviewDate: { fontFamily: 'Manrope-Regular', fontSize: 11, color: colors.onSurfaceVariant + '80' },
    reviewText: { fontFamily: 'Manrope-Regular', fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 20 },
    followerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 16,
      padding: 12,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
    },
    followerAvatar: { width: 44, height: 44, borderRadius: 22 },
    followerName: { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: colors.onSurface },
    followerMeta: { fontFamily: 'Manrope-Regular', fontSize: 12, color: colors.onSurfaceVariant + '99', marginTop: 2 },
  });
