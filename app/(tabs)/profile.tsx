import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Settings,
  Star,
  MapPin,
  ChevronRight,
  Heart,
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
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';
import { useProfile } from '@/hooks/useProfile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 220;
const AVATAR_SIZE = 92;

const TABS = ['Activos', 'Vendidos', 'Valoraciones'] as const;

const listings = [
  { id: '1', title: 'Smart TV 55" 4K', price: '320.000 XAF', location: 'Malabo', status: 'active', image: 'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '2', title: 'MacBook Air M2', price: '850.000 XAF', location: 'Malabo', status: 'active', image: 'https://images.pexels.com/photos/812264/pexels-photo-812264.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '3', title: 'iPhone 15 Pro', price: '750.000 XAF', location: 'Malabo', status: 'sold', image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '4', title: 'Cámara Sony Alpha', price: '540.000 XAF', location: 'Malabo', status: 'sold', image: 'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '5', title: 'Nike Air Zoom', price: '45.000 XAF', location: 'Bata', status: 'active', image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '6', title: 'Reloj Minimal', price: '12.500 XAF', location: 'Bata', status: 'sold', image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400' },
];

const reviews = [
  { id: '1', author: 'Estela N.', avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80', rating: 5, text: 'Vendedor muy serio y puntual. El producto llegó tal como se describía. ¡Repetiremos!', date: 'hace 3 días' },
  { id: '2', author: 'Carlos E.', avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=80', rating: 5, text: 'Excelente transacción. Muy recomendable, trato amable y precio justo.', date: 'hace 1 semana' },
  { id: '3', author: 'Lucía B.', avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=80', rating: 4, text: 'Todo bien aunque tardó un poco en responder. El artículo estaba en perfectas condiciones.', date: 'hace 2 semanas' },
];

const achievements = [
  { Icon: Award, label: 'Top vendedor', color: colors.tertiary, bg: colors.tertiary + '15' },
  { Icon: Zap, label: 'Respuesta rápida', color: colors.secondary, bg: colors.secondary + '15' },
  { Icon: TrendingUp, label: 'En racha', color: colors.primary, bg: colors.primary + '15' },
];

function StarRating({ rating }: { rating: number }) {
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
  const [activeTab, setActiveTab] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const scrollY = useRef(new Animated.Value(0)).current;

  const toggleLike = (id: string) => setLiked((prev) => ({ ...prev, [id]: !prev[id] }));

  const activeListing = listings.filter((l) => l.status === 'active');
  const soldListing = listings.filter((l) => l.status === 'sold');
  const tabData = [activeListing, soldListing, reviews];

  const renderPairs = (items: typeof listings) => {
    const pairs: (typeof listings[0])[][] = [];
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

  if (loading || !profile) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.primary} />
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
              onPress={() => router.push('/edit-profile')}>
              <Pencil size={18} color="#ffffff" strokeWidth={1.8} />
            </RipplePress>
            <RipplePress
              style={styles.topBarBtn}
              borderRadius={18}
              rippleColor="rgba(255,255,255,0.2)"
              onPress={() => router.push('/settings')}>
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
              rippleColor={colors.primary + '18'}>
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

        {/* Achievements */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesRow}>
          {achievements.map(({ Icon, label, color, bg }) => (
            <View key={label} style={[styles.achBadge, { backgroundColor: bg }]}>
              <Icon size={13} color={color} strokeWidth={2} />
              <Text style={[styles.achText, { color }]}>{label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { value: '12', label: 'Anuncios' },
            { value: '4.9', label: 'Valoración' },
            { value: '48', label: 'Ventas' },
            { value: '136', label: 'Seguidores' },
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
              {i === 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{activeListing.length}</Text>
                </View>
              )}
            </RipplePress>
          ))}
        </View>

        {/* Tab content */}
        {activeTab < 2 ? (
          <View style={styles.grid}>
            {renderPairs(tabData[activeTab] as typeof listings).map((pair, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {pair.map((item) => (
                  <RipplePress
                    key={item.id}
                    style={styles.card}
                    borderRadius={16}
                    rippleColor={colors.primary + '12'}
                    onPress={() => router.push('/product')}>
                    <View style={styles.cardImageWrap}>
                      <Image source={{ uri: item.image }} style={styles.cardImage} />
                      {item.status === 'sold' && (
                        <View style={styles.soldOverlay}>
                          <View style={styles.soldBadge}>
                            <Text style={styles.soldBadgeText}>Vendido</Text>
                          </View>
                        </View>
                      )}
                      <RipplePress
                        style={styles.heartBtn}
                        onPress={() => toggleLike(item.id)}
                        borderRadius={14}
                        rippleColor="rgba(255,255,255,0.25)">
                        <Heart
                          size={16}
                          color="#ffffff"
                          fill={liked[item.id] ? '#ffffff' : 'transparent'}
                          strokeWidth={1.5}
                        />
                      </RipplePress>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardPrice}>{item.price}</Text>
                      <View style={styles.cardLocation}>
                        <MapPin size={10} color={colors.onSurfaceVariant + '99'} strokeWidth={1.5} />
                        <Text style={styles.cardLocationText}>{item.location}</Text>
                      </View>
                    </View>
                  </RipplePress>
                ))}
                {pair.length === 1 && <View style={styles.cardPlaceholder} />}
              </View>
            ))}
            {(tabData[activeTab] as typeof listings).length === 0 && (
              <View style={styles.emptyState}>
                <Package size={40} color={colors.outlineVariant} strokeWidth={1} />
                <Text style={styles.emptyText}>Sin anuncios en esta sección</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.reviewsList}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingValue}>4.9</Text>
              <View>
                <StarRating rating={5} />
                <Text style={styles.ratingMeta}>Basado en {reviews.length} valoraciones</Text>
              </View>
            </View>
            {(tabData[2] as typeof reviews).map((rev) => (
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
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.menuSection}>
          <Text style={styles.menuGroupTitle}>Cuenta</Text>
          <View style={styles.menuCard}>
            <RipplePress
              style={[styles.menuRow, styles.menuRowBorder]}
              borderRadius={0}
              rippleColor={colors.primary + '12'}
              onPress={() => setActiveTab(0)}>
              <View style={styles.menuIconWrap}>
                <Tag size={18} color={colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.menuLabel}>Mis anuncios</Text>
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>{activeListing.length}</Text>
              </View>
              <ChevronRight size={16} color={colors.outlineVariant} strokeWidth={1.5} />
            </RipplePress>
            <RipplePress
              style={[styles.menuRow, styles.menuRowBorder]}
              borderRadius={0}
              rippleColor={colors.primary + '12'}
              onPress={() => setActiveTab(1)}>
              <View style={styles.menuIconWrap}>
                <Package size={18} color={colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.menuLabel}>Historial de ventas</Text>
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>{soldListing.length}</Text>
              </View>
              <ChevronRight size={16} color={colors.outlineVariant} strokeWidth={1.5} />
            </RipplePress>
            <RipplePress
              style={styles.menuRow}
              borderRadius={0}
              rippleColor={colors.primary + '12'}
              onPress={() => router.push('/settings')}>
              <View style={styles.menuIconWrap}>
                <Bell size={18} color={colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.menuLabel}>Notificaciones</Text>
              {profile.notif_messages || profile.notif_offers ? (
                <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
              ) : (
                <View style={[styles.statusDot, { backgroundColor: colors.outlineVariant }]} />
              )}
              <ChevronRight size={16} color={colors.outlineVariant} strokeWidth={1.5} />
            </RipplePress>
          </View>

          <Text style={styles.menuGroupTitle}>Seguridad</Text>
          <View style={styles.menuCard}>
            <RipplePress
              style={[styles.menuRow, styles.menuRowBorder]}
              borderRadius={0}
              rippleColor={colors.primary + '12'}
              onPress={() => router.push('/settings')}>
              <View style={styles.menuIconWrap}>
                <Lock size={18} color={colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.menuLabel}>Privacidad y seguridad</Text>
              <ChevronRight size={16} color={colors.outlineVariant} strokeWidth={1.5} />
            </RipplePress>
            <RipplePress
              style={styles.menuRow}
              borderRadius={0}
              rippleColor={colors.primary + '12'}>
              <View style={styles.menuIconWrap}>
                <BadgeCheck size={18} color={colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.menuLabel}>Verificar identidad</Text>
              <View style={styles.checkChip}>
                <Text style={styles.checkChipText}>Hecho</Text>
              </View>
              <ChevronRight size={16} color={colors.outlineVariant} strokeWidth={1.5} />
            </RipplePress>
          </View>

          <Text style={styles.menuGroupTitle}>Soporte</Text>
          <View style={styles.menuCard}>
            <RipplePress
              style={[styles.menuRow, styles.menuRowBorder]}
              borderRadius={0}
              rippleColor={colors.primary + '12'}>
              <View style={styles.menuIconWrap}>
                <HelpCircle size={18} color={colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.menuLabel}>Centro de ayuda</Text>
              <ChevronRight size={16} color={colors.outlineVariant} strokeWidth={1.5} />
            </RipplePress>
            <RipplePress
              style={[styles.menuRow, styles.menuRowBorder]}
              borderRadius={0}
              rippleColor={colors.primary + '12'}>
              <View style={styles.menuIconWrap}>
                <Share2 size={18} color={colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.menuLabel}>Compartir perfil</Text>
              <ChevronRight size={16} color={colors.outlineVariant} strokeWidth={1.5} />
            </RipplePress>
            <RipplePress
              style={styles.menuRow}
              borderRadius={0}
              rippleColor={colors.error + '12'}
              onPress={() => router.push('/settings')}>
              <View style={[styles.menuIconWrap, styles.menuIconWrapDanger]}>
                <LogOut size={18} color={colors.error} strokeWidth={1.5} />
              </View>
              <Text style={[styles.menuLabel, styles.menuLabelDanger]}>Cerrar sesión</Text>
            </RipplePress>
          </View>
        </View>

        <Text style={styles.version}>Market EG · v1.0.0</Text>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPlaceholder: {
    flex: 1,
  },
  cardImageWrap: {
    height: 140,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  soldBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: 10,
    gap: 2,
  },
  cardTitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurface,
    lineHeight: 18,
  },
  cardPrice: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.primary,
    lineHeight: 20,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  cardLocationText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant + '99',
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
    marginBottom: 8,
  },
});
