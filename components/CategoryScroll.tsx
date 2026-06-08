import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { CATEGORIES } from '@/constants/categories';

export default function CategoryScroll() {
  const router = useRouter();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {CATEGORIES.map(({ slug, label, Icon, color, bg }) => (
        <TouchableOpacity
          key={slug}
          style={styles.item}
          activeOpacity={0.7}
          onPress={() => router.push(`/category/${slug}`)}>
          <View style={[styles.iconWrap, { backgroundColor: bg }]}>
            <Icon size={28} color={color} strokeWidth={1.5} />
          </View>
          <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 24,
    paddingVertical: 8,
  },
  item: {
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurface,
    lineHeight: 16,
  },
});
