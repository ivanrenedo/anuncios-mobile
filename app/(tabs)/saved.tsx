import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, BarChart2, Plus } from 'lucide-react-native';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;

const CATEGORIES = ['Todos', 'Tecnología', 'Moda', 'Hogar', 'Otros'];

const SAVED_ITEMS = [
  {
    id: '1',
    title: 'iPhone 15 Pro',
    price: '750.000 XAF',
    category: 'Tecnología',
    seller: 'Carlos E.',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=80',
    image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: '2',
    title: 'Nike Air Zoom',
    price: '45.000 XAF',
    category: 'Moda',
    seller: 'Antonio M.',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=80',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: '3',
    title: 'Reloj Minimal',
    price: '12.500 XAF',
    category: 'Moda',
    seller: 'Estela N.',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80',
    image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

const TOTAL = SAVED_ITEMS.reduce((sum, item) => {
  const num = parseInt(item.price.replace(/\./g, '').replace(' XAF', ''), 10);
  return sum + num;
}, 0);

function formatXAF(n: number) {
  return n.toLocaleString('es-GQ') + ' XAF';
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [liked, setLiked] = useState<Record<string, boolean>>(
    Object.fromEntries(SAVED_ITEMS.map((i) => [i.id, true]))
  );

  const visibleItems =
    activeCategory === 'Todos'
      ? SAVED_ITEMS
      : SAVED_ITEMS.filter((i) => i.category === activeCategory);

  const pairs: (typeof SAVED_ITEMS[0] | null)[][] = [];
  for (let i = 0; i < visibleItems.length; i += 2) {
    pairs.push([visibleItems[i], visibleItems[i + 1] ?? null]);
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 44 + insets.top }]}>
        <Text style={styles.headerTitle}>Favorito</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 44 + insets.top + 8,
          paddingBottom: 32,
        }}>
        {/* Category filter chips */}
        <View style={styles.chipsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, activeCategory === cat && styles.chipActive]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}>
                <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Product grid */}
        {visibleItems.length > 0 ? (
          <View style={styles.grid}>
            {pairs.map((pair, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {pair[0] && (
                  <ProductCard
                    item={pair[0]}
                    liked={liked[pair[0].id]}
                    onLike={() => setLiked((p) => ({ ...p, [pair[0]!.id]: !p[pair[0]!.id] }))}
                    onPress={() => router.push('/product')}
                  />
                )}
                {pair[1] ? (
                  <ProductCard
                    item={pair[1]}
                    liked={liked[pair[1].id]}
                    onLike={() => setLiked((p) => ({ ...p, [pair[1]!.id]: !p[pair[1]!.id] }))}
                    onPress={() => router.push('/product')}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.addCard}
                    activeOpacity={0.8}
                    onPress={() => router.push('/(tabs)/explore')}>
                    <Plus size={32} color={colors.outlineVariant} strokeWidth={1} />
                    <Text style={styles.addCardText}>Añadir más{'\n'}favoritos</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Heart size={40} color={colors.primary + '66'} strokeWidth={1} />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyDesc}>No tienes guardados en esta categoría.</Text>
          </View>
        )}

        {/* Summary insight card */}
        {visibleItems.length > 0 && (
          <View style={styles.insightSection}>
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <BarChart2 size={22} color={colors.primary} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>Resumen de Guardados</Text>
                <Text style={styles.insightDesc}>
                  Tienes {SAVED_ITEMS.length} artículos guardados que suman un total de{' '}
                  <Text style={styles.insightAmount}>{formatXAF(TOTAL)}</Text>.{' '}
                  ¡No pierdas las mejores ofertas!
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ProductCard({
  item,
  liked,
  onLike,
  onPress,
}: {
  item: (typeof SAVED_ITEMS)[0];
  liked: boolean;
  onLike: () => void;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onPress}>
      <View style={styles.cardImageWrap}>
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        <TouchableOpacity style={styles.heartBtn} onPress={onLike} activeOpacity={0.8}>
          <Heart
            size={16}
            color={liked ? colors.error : '#ffffff'}
            fill={liked ? colors.error : 'transparent'}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardPrice}>{item.price}</Text>
        <View style={styles.cardSeller}>
          <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />
          <Text style={styles.cardSellerName} numberOfLines={1}>{item.seller}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
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
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 22,
    color: colors.primary,
    letterSpacing: -0.3,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  chipsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: colors.surfaceContainerHigh,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: '#ffffff',
  },
  grid: {
    paddingHorizontal: 16,
    gap: 12,
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
  cardImageWrap: {
    aspectRatio: 1,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBody: {
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
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: colors.primaryContainer,
    lineHeight: 20,
    marginBottom: 6,
  },
  cardSeller: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '22',
  },
  cardAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  cardSellerName: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  addCard: {
    flex: 1,
    minHeight: 160,
    backgroundColor: colors.surfaceContainer + '55',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant + '66',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
  addCardText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 17,
    color: colors.onSurface,
  },
  emptyDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 220,
  },
  insightSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  insightCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.primary + '0a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.primary + '22',
    alignItems: 'flex-start',
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  insightTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  insightDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 19,
  },
  insightAmount: {
    fontFamily: 'Manrope-Bold',
    color: colors.onSurface,
  },
});
