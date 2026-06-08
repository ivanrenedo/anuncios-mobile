import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';

const items = [
  {
    id: '1',
    title: 'Smart TV 55" 4K',
    price: '320.000 XAF',
    location: 'Malabo',
    seller: 'Antonio M.',
    image:
      'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar:
      'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '2',
    title: 'MacBook Air M2',
    price: '850.000 XAF',
    location: 'Bata',
    seller: 'Estela N.',
    image:
      'https://images.pexels.com/photos/812264/pexels-photo-812264.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar:
      'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '3',
    title: 'iPhone 15 Pro',
    price: '750.000 XAF',
    location: 'Malabo',
    seller: 'Carlos E.',
    image:
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar:
      'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '4',
    title: 'Cámara Sony Alpha',
    price: '540.000 XAF',
    location: 'Ebibeyin',
    seller: 'Lucía B.',
    image:
      'https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar:
      'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
];

export default function RecentlyUploaded({ onLoadMore }: { onLoadMore?: () => void }) {
  const router = useRouter();
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const pairs: (typeof items[0])[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Subidos recientemente</Text>
      </View>
      {pairs.map((pair, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {pairs.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.92} onPress={() => router.push('/product')}>
              <View style={styles.imageWrap}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => toggleLike(item.id)}
                  activeOpacity={0.85}>
                  <Heart
                    size={18}
                    color="#ffffff"
                    fill={liked[item.id] ? '#ffffff' : 'transparent'}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.info}>
                <Text style={styles.productTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.price}>{item.price}</Text>
                <Text style={styles.location}>{item.location}</Text>
                <View style={styles.sellerRow}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {item.seller}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <TouchableOpacity style={styles.loadMore} onPress={onLoadMore} activeOpacity={0.85}>
        <Text style={styles.loadMoreText}>Cargar más</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 17,
    color: colors.onSurface,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
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
    shadowRadius: 16,
    elevation: 3,
  },
  imageWrap: {
    height: 176,
    position: 'relative',
  },
  image: {
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 12,
    flex: 1,
  },
  productTitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 20,
  },
  price: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 17,
    color: colors.primary,
    lineHeight: 22,
    marginTop: 4,
  },
  location: {
    fontFamily: 'Manrope-Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant + '99',
    lineHeight: 14,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
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
  loadMore: {
    marginTop: 16,
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignSelf: 'center',
  },
  loadMoreText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurfaceVariant,
  },
});
