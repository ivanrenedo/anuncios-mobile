import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';

const products = [
  {
    id: '1',
    title: 'Nike Air Zoom',
    price: '45.000 XAF',
    seller: 'Antonio M.',
    image:
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar:
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '2',
    title: 'Reloj Minimal',
    price: '12.500 XAF',
    seller: 'Estela N.',
    image:
      'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar:
      'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '3',
    title: 'Sony WH-1000',
    price: '180.000 XAF',
    seller: 'Carlos E.',
    image:
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
    avatar:
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
];

export default function RecentlyViewed() {
  const router = useRouter();
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Vistos recientemente</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {products.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.92} onPress={() => router.push('/product')}>
            <View style={styles.imageWrap}>
              <Image source={{ uri: item.image }} style={styles.image} />
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
            <Text style={styles.productTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.price}>{item.price}</Text>
            <View style={styles.sellerRow}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <Text style={styles.sellerName} numberOfLines={1}>
                {item.seller}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 17,
    color: colors.onSurface,
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    width: 160,
  },
  imageWrap: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    marginBottom: 8,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 20,
  },
  price: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.primary,
    lineHeight: 20,
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
});
