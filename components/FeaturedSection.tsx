import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

const featured = [
  {
    id: '1',
    type: 'hero',
    badge: 'Premium',
    title: 'Villa Moderna - Malabo II',
    price: '450.000.000 XAF',
    image:
      'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '2',
    type: 'card',
    title: 'iPhone 15 Pro Max',
    price: '980.000 XAF',
    image:
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

export default function FeaturedSection() {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Destacados en EG</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>Ver todo</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {featured.map((item) =>
          item.type === 'hero' ? (
            <TouchableOpacity key={item.id} style={styles.heroCard} activeOpacity={0.92}>
              <Image source={{ uri: item.image }} style={StyleSheet.absoluteFillObject} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{item.badge}</Text>
                </View>
                <Text style={styles.heroTitle}>{item.title}</Text>
                <Text style={styles.heroPrice}>{item.price}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity key={item.id} style={styles.productCard} activeOpacity={0.92}>
              <Image source={{ uri: item.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.productPrice}>{item.price}</Text>
              </View>
            </TouchableOpacity>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 17,
    color: colors.onSurface,
    lineHeight: 22,
  },
  viewAll: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  heroCard: {
    width: CARD_WIDTH,
    height: 224,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  heroContent: {
    padding: 16,
    gap: 4,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 4,
  },
  heroBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 17,
    color: '#ffffff',
    lineHeight: 22,
  },
  heroPrice: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  productImage: {
    width: '100%',
    height: 160,
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
  },
  productPrice: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 17,
    color: colors.primary,
    marginTop: 4,
  },
});
