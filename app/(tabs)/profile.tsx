import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Pressable,
  TouchableOpacity,
  Share,
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
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  Package,
  Tag,
  Pencil,
  TrendingUp,
  Award,
  Zap,
  Trash2,
  ShieldCheck,
  FileText,
  Users,
  User,
  UserPlus,
  UserCheck,
  LogIn,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';
import ProductCard from '@/components/ProductCard';
import Skeleton from '@/components/Skeleton';
import SettingsModal, { Row, Section } from '@/components/SettingsModal';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useProductsBySeller } from '@/hooks/useProducts';
import { useReviewsBySeller, useSellerRating } from '@/hooks/useReviews';
import { useFollowers, useFollowersCount, useFollowingCount } from '@/hooks/useFollowers';
import { API_URL } from '@/lib/config';
import CenterSafetyModal from '@/components/CenterSafetyModal';

const COVER_HEIGHT = 220;
const AVATAR_SIZE = 92;

const TABS = ['Anuncios', 'Valoraciones', 'Seguidores'] as const;

function timeAgo(dateStr: string) {
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
  const { profile, loading } = useProfile();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { isAuthenticated, signOut, user } = useAuth();
  const userId = user?.id || profile?.id || '';
  const { products: myProducts } = useProductsBySeller(userId);
  const { reviews: myReviews } = useReviewsBySeller(userId);
  const { average: avgRating, count: ratingCount } = useSellerRating(userId);
  const { followers: myFollowers } = useFollowers(userId);
  const { count: followersCountNum } = useFollowersCount(userId);
  const { count: followingCountNum } = useFollowingCount(userId);
  const [activeTab, setActiveTab] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [followingBack, setFollowingBack] = useState<Record<string, boolean>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [centerSafetyOpen, setcenterSafetyOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'logout' | 'delete' | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const toggleLike = (id: string) => setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleFollow = (id: string) =>
    setFollowingBack((prev) => ({ ...prev, [id]: !prev[id] }));

  const onShareProfile = async () => {
    try {
      await Share.share({
        title: 'Market EG',
        message: `Mira el perfil de ${profile?.name ?? 'este vendedor'} en Market EG.`,
      });
    } catch {
      // user dismissed / share unavailable
    }
  };

  const productItems = myProducts.map((p: any) => {
    const img = p.images?.[0]?.url || '';
    return {
      id: p.id,
      title: p.title,
      price: `${Number(p.price).toLocaleString('es')} XAF`,
      location: p.city || '',
      status: p.status || 'active',
      image: img.startsWith('/') ? `${API_URL}${img}` : img,
    };
  });

  const reviewItems = myReviews.map((r: any) => ({
    id: r.id,
    author: r.author?.name || '',
    avatar: r.author?.avatarUrl || '',
    rating: r.rating,
    text: r.text || '',
    date: r.createdAt ? timeAgo(r.createdAt) : '',
  }));

  const followerItems = myFollowers.map((f: any) => ({
    id: f.id,
    name: f.follower?.name || '',
    avatar: f.follower?.avatarUrl || '',
    verified: f.follower?.verified ?? false,
    location: f.follower?.location || '',
    since: f.createdAt ? timeAgo(f.createdAt) : '',
  }));

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
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Cover */}
        <View style={styles.coverWrap}>
          <Animated.Image
            source={{ uri: profile.cover_url }}
            style={[
              styles.cover,
              { transform: [{ translateY: coverParallax }, { scale: coverScale }] },
            ]}
          />
          <LinearGradient
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
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            <View style={styles.verifiedBadge}>
              <BadgeCheck size={16} color="#ffffff" fill={colors.primary} strokeWidth={0} />
            </View>
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
            <View style={styles.verifiedChip}>
              <BadgeCheck size={11} color={colors.primary} strokeWidth={2} />
              <Text style={styles.verifiedChipText}>Verificado</Text>
            </View>
          </View>
          <View style={styles.locationRow}>
            <MapPin size={13} color={colors.onSurfaceVariant} strokeWidth={1.5} />
            <Text style={styles.locationText}>{profile.location}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.locationText}>Desde {memberSince}</Text>
          </View>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { value: String(myProducts.length), label: 'Anuncios' },
            { value: avgRating > 0 ? avgRating.toFixed(1) : '-', label: 'Valoración' },
            { value: String(followersCountNum), label: 'Seguidores' },
            { value: String(followingCountNum), label: 'Siguiendo' },
          ].map(({ value, label }, i, arr) => (
            <View
              key={label}
              style={[styles.statItem, i === arr.length - 1 && { borderRightWidth: 0 }]}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Tab selector */}
        <View style={styles.tabBar}>
          {TABS.map((tab, i) => (
            <RipplePress
              key={tab}
              style={[styles.tab, activeTab === i && styles.tabActive]}
              onPress={() => setActiveTab(i)}
              borderRadius={9}
              rippleColor={colors.primary + '18'}>
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                {tab}
              </Text>
            </RipplePress>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 0 ? (
          <View style={styles.grid}>
            {renderPairs(productItems).map((pair, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {pair.map((item: any) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    liked={!!liked[item.id]}
                    onLike={() => toggleLike(item.id)}
                    onPress={() =>
                      router.push({ pathname: '/product/[id]', params: { id: item.id } })
                    }
                    sold={item.status === 'sold'}
                  />
                ))}
                {pair.length === 1 && <View style={styles.cardPlaceholder} />}
              </View>
            ))}
            {productItems.length === 0 && (
              <View style={styles.emptyState}>
                <Package size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>Sin anuncios en esta sección</Text>
              </View>
            )}
          </View>
        ) : activeTab === 1 ? (
          <View style={styles.reviewsList}>
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
              reviewItems.map((rev: any) => (
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
              ))
            )}
          </View>
        ) : (
          <View style={styles.followersList}>
            <View style={styles.followersHeader}>
              <View style={styles.followersIconWrap}>
                <Users size={20} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.followersTitle}>{followersCountNum} seguidores</Text>
                <Text style={styles.followersMeta}>Personas que confían en este perfil</Text>
              </View>
            </View>
            {followerItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>Aún no tienes seguidores</Text>
              </View>
            ) : (
              <View style={styles.followersCard}>
                {followerItems.map((f: any, i: number) => {
                  const isFollowing = !!followingBack[f.id];
                  const last = i === followerItems.length - 1;
                  return (
                    <View
                      key={f.id}
                      style={[styles.followerRow, !last && styles.followerRowBorder]}>
                      <View style={styles.followerAvatarWrap}>
                        <Image source={{ uri: f.avatar }} style={styles.followerAvatar} />
                        {f.verified && (
                          <View style={styles.followerVerified}>
                            <BadgeCheck
                              size={12}
                              color="#ffffff"
                              fill={colors.primary}
                              strokeWidth={0}
                            />
                          </View>
                        )}
                      </View>
                      <View style={styles.followerInfo}>
                        <Text style={styles.followerName} numberOfLines={1}>
                          {f.name}
                        </Text>
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
                      <RipplePress
                        style={[
                          styles.followBtn,
                          isFollowing && styles.followBtnActive,
                        ]}
                        borderRadius={999}
                        rippleColor={
                          isFollowing
                            ? colors.outlineVariant + '55'
                            : 'rgba(255,255,255,0.25)'
                        }
                        onPress={() => toggleFollow(f.id)}>
                        {isFollowing ? (
                          <>
                            <UserCheck
                              size={14}
                              color={colors.onSurface}
                              strokeWidth={1.8}
                            />
                            <Text style={styles.followBtnTextActive}>Siguiendo</Text>
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} color="#ffffff" strokeWidth={1.8} />
                            <Text style={styles.followBtnText}>Seguir</Text>
                          </>
                        )}
                      </RipplePress>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
        {/* Support */}
        <Section title="Soporte y legal">
          <Row icon={ShieldCheck} label="Centro de seguridad" onPress={() => setcenterSafetyOpen(true)} />
          <Row icon={HelpCircle} label="Centro de ayuda" onPress={() => {}} />
          <Row icon={FileText} label="Términos y condiciones" onPress={() => {}} />
          <Row icon={Lock} label="Política de privacidad" onPress={() => {}} last />
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

        <Text style={styles.version}>Market EG · v1.0.0</Text>
      </Animated.ScrollView>

      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CenterSafetyModal
        visible={centerSafetyOpen}
        onClose={() => setcenterSafetyOpen(false)}
      />
      {/* Confirmation modal */}
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
                onPress={() => {
                  if (confirmAction === 'logout') signOut();
                  setConfirmAction(null);
                }}
                activeOpacity={0.85}>
                <Text style={styles.confirmActionText}>
                  {confirmAction === 'delete' ? 'Eliminar' : 'Cerrar sesión'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 22,
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
  statValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: 20,
    color: colors.primary,
    lineHeight: 26,
  },
  statLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
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
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  tabTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: colors.onSurface,
  },
  tabBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  tabBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: colors.onPrimaryContainer,
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
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  followBtnActive: {
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '66',
  },
  followBtnText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
  followBtnTextActive: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.onSurface,
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
});
