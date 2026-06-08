import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Shirt,
  Cpu,
  Car,
  Home,
  Handshake,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';

const categories = [
  { label: 'Moda', Icon: Shirt, color: colors.primary, bg: colors.primaryContainer + '1a' },
  { label: 'Tech', Icon: Cpu, color: colors.secondary, bg: colors.secondaryContainer + '1a' },
  { label: 'Coches', Icon: Car, color: colors.tertiary, bg: colors.tertiaryContainer + '1a' },
  { label: 'Hogar', Icon: Home, color: colors.primary, bg: colors.primaryContainer + '1a' },
  { label: 'Servicios', Icon: Handshake, color: colors.secondary, bg: colors.secondaryContainer + '1a' },
];

export default function CategoryScroll() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {categories.map(({ label, Icon, color, bg }) => (
        <TouchableOpacity key={label} style={styles.item} activeOpacity={0.7}>
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
