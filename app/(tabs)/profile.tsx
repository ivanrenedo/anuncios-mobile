import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 200;
const AVATAR_SIZE = 88;

const TABS = ['Activos', 'Vendidos', 'Valoraciones'];

const listings = [
  {
    id: '1',
    title: 'Smart TV 55" 4K',
    price: '320.000 XAF',
    location: 'Malabo',
    status: 'active',
    image:
      'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: '2',
    title: 'MacBook Air M2',
    price: '850.000 XAF',
    location: 'Malabo',
    status: 'active',
    image:
      'https://images.pexels.com/photos/812264/pexels-photo-812264.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: '3',
    title: 'iPhone 15 Pro',
    price: '750.000 XAF',
    location: 'Malabo',
    status: 'sold',
    image:
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: '4',
    title: 'Cámara Sony Alpha',
    price: '540.000 XAF',
    location: 'Malabo',
    status: 'sold',
    image:
      'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: '5',
    title: 'Nike Air Zoom',
    price: '45.000 XAF',
    location: 'Bata',
    status: 'active',
    image:
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: '6',
    title: 'Reloj Minimal',
    price: '12.500 XAF',
    location: 'Bata',
    status: 'sold',
    image:
      'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

const reviews = [
  {
    id: '1',
    author: 'Estela N.',
    avatar:
      'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80',
    rating: 5,
    text: 'Vendedor muy serio y puntual. El producto llegó tal como se describía. ¡Repetiremos!',
    date: 'hace 3 días',
  },
  {
    id: '2',
    author: 'Carlos E.',
    avatar:
      'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=80',
    rating: 5,
    text: 'Excelente transacción. Muy recomendable, trato amable y precio justo.',
    date: 'hace 1 semana',
  },
  {
    id: '3',
    author: 'Lucía B.',
    avatar:
      'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=80',
    rating: 4,
    text: 'Todo bien aunque tardó un poco en responder. El artículo estaba en perfectas condiciones.',
    date: 'hace 2 semanas',
  },
];

const menuGroups = [
  {
    title: 'Cuenta',
    items: [
      { icon: Tag, label: 'Mis anuncios', badge: '12' },
      { icon: Package, label: 'Historial de ventas' },
      { icon: Bell, label: 'Notificaciones' },
    ],
  },
  {
    title: 'Seguridad',
    items: [
      { icon: Lock, label: 'Privacidad y seguridad' },
      { icon: BadgeCheck, label: 'Verificar identidad' },
    ],
  },
  {
    title: 'Soporte',
    items: [
      { icon: HelpCircle, label: 'Centro de ayuda' },
      { icon: Share2, label: 'Compartir perfil' },
      { icon: LogOut, label: 'Cerrar sesión', danger: true },
    ],
  },
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
  const [activeTab, setActiveTab] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) =>
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));

  const activeListing = listings.filter((l) => l.status === 'active');
  const soldListing = listings.filter((l) => l.status === 'sold');

  const tabData = [activeListing, soldListing, reviews];

  const renderPairs = (items: typeof listings) => {
    const pairs: (typeof listings[0])[][] = [];
    for (let i = 0; i < items.length; i += 2) pairs.push(items.slice(i, i + 2));
    return pairs;
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Cover + Avatar */}
        <View style={styles.coverWrap}>
          <Image
            source={{
              uri: 'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=800',
            }}
            style={styles.cover}
          />
          <LinearGradient
            colors={['transparent', colors.surface]}
            style={styles.coverFade}
          />
          {/* Top bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <View style={styles.topBarSpacer} />
            <TouchableOpacity style={styles.topBarBtn} activeOpacity={0.8}>
              <Settings size={20} color="#ffffff" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar bubble */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            <Image
              source={{
                uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
              }}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <BadgeCheck size={16} color="#ffffff" fill={colors.primary} strokeWidth={0} />
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Name + location */}
        <View style={styles.nameBlock}>
          <Text style={styles.name}>Antonio Mbá</Text>
          <View style={styles.locationRow}>
            <MapPin size={13} color={colors.onSurfaceVariant} strokeWidth={1.5} />
            <Text style={styles.locationText}>Malabo, Guinea Ecuatorial</Text>
          </View>
          <Text style={styles.bio}>
            Vendedor verificado · Miembro desde 2022 · Responde en menos de 1h
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { value: '12', label: 'Anuncios' },
            { value: '4.9', label: 'Valoración' },
            { value: '48', label: 'Ventas' },
            { value: '136', label: 'Seguidores' },
          ].map(({ value, label }) => (
            <View key={label} style={styles.statItem}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Tab selector */}
        <View style={styles.tabBar}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === i && styles.tabActive]}
              onPress={() => setActiveTab(i)}
              activeOpacity={0.8}>
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                {tab}
              </Text>
              {i === 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{activeListing.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab < 2 ? (
          <View style={styles.grid}>
            {renderPairs(tabData[activeTab] as typeof listings).map((pair, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {pair.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.92}>
                    <View style={styles.cardImageWrap}>
                      <Image source={{ uri: item.image }} style={styles.cardImage} />
                      {item.status === 'sold' && (
                        <View style={styles.soldBadge}>
                          <Text style={styles.soldBadgeText}>Vendido</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.heartBtn}
                        onPress={() => toggleLike(item.id)}
                        activeOpacity={0.85}>
                        <Heart
                          size={16}
                          color="#ffffff"
                          fill={liked[item.id] ? '#ffffff' : 'transparent'}
                          strokeWidth={1.5}
                        />
                      </TouchableOpacity>
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
                  </TouchableOpacity>
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

        {/* Settings menu */}
        <View style={styles.menuSection}>
          {menuGroups.map((group) => (
            <View key={group.title} style={styles.menuGroup}>
              <Text style={styles.menuGroupTitle}>{group.title}</Text>
              <View style={styles.menuCard}>
                {group.items.map((item, idx) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.menuRow,
                      idx < group.items.length - 1 && styles.menuRowBorder,
                    ]}
                    activeOpacity={0.8}>
                    <View
                      style={[
                        styles.menuIconWrap,
                        (item as any).danger && styles.menuIconWrapDanger,
                      ]}>
                      <item.icon
                        size={18}
                        color={(item as any).danger ? colors.error : colors.primary}
                        strokeWidth={1.5}
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuLabel,
                        (item as any).danger && styles.menuLabelDanger,
                      ]}>
                      {item.label}
                    </Text>
                    {(item as any).badge && (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{(item as any).badge}</Text>
                      </View>
                    )}
                    {!(item as any).danger && (
                      <ChevronRight size={16} color={colors.outlineVariant} strokeWidth={1.5} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.version}>Market EG · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  coverWrap: {
    height: COVER_HEIGHT,
    position: 'relative',
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  coverFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBarSpacer: {
    flex: 1,
  },
  topBarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  editBtnText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.onSurface,
  },
  nameBlock: {
    paddingHorizontal: 16,
    gap: 4,
    marginBottom: 20,
  },
  name: {
    fontFamily: 'Manrope-Bold',
    fontSize: 22,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  bio: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
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
  soldBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  soldBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#ffffff',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    gap: 20,
    marginBottom: 24,
  },
  menuGroup: {
    gap: 8,
  },
  menuGroupTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: colors.onSurfaceVariant + '99',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
    overflow: 'hidden',
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
  version: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.outlineVariant,
    textAlign: 'center',
    marginBottom: 8,
  },
});
