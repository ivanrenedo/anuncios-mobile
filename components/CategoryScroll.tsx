import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  LayoutGrid,
  Shirt,
  House,
  Baby,
  BookOpen,
  Dumbbell,
  Car,
  Briefcase,
  HelpCircle,
  type LucideIcon,
  Wrench,
  Sparkles,
  Building2,
  Refrigerator,
  Laptop,
  Smartphone,
  Watch,
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import Skeleton from '@/components/Skeleton';
import { useCategoryTree } from '@/hooks/useCategories';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';

const ICON_MAP: Record<string, LucideIcon> = {
  baby: Baby,
  sparkles: Sparkles,
  bookOpen: BookOpen,
  'briefcase-business': Briefcase,
  wrench: Wrench,
  dumbbell: Dumbbell,
  building2: Building2,
  car: Car,
  refrigerator: Refrigerator,
  house: House,
  laptop: Laptop,
  smartphone: Smartphone,
  shirt: Shirt,
  watch: Watch
};

const DEFAULT_COLOR = '#006b5e';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function CategoryScroll() {
  const router = useRouter();
  const { tree: categories, loading, refetch: refetchTree } = useCategoryTree();

    // Categorías creadas desde el panel admin, o productos nuevos que aportan
    // thumbnails a categorías vacías, aparecen al volver a esta pantalla.
    useRefetchOnFocus([refetchTree]);

  const search = (term: string) =>
  router.push({ pathname: '/explore', params: { filterCat: term } });

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.section}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}>
        {loading && categories.length === 0
          ? [0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.item}>
                <Skeleton style={styles.skeletonCircle} />
                <Skeleton style={{ width: 40 + (i % 3) * 8, height: 10, borderRadius: 4 }} />
              </View>
            ))
          : categories.map((cat: any) => {
              const Icon = ICON_MAP[cat.icon ?? ''] ?? HelpCircle;
              const catColor = cat.color || DEFAULT_COLOR;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.item}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel={`Buscar ${cat.label}`}
                  onPress={() => search(cat.label)}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: hexToRgba(catColor, 0.12) },
                    ]}>
                    <Icon size={20} color={catColor} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.label} numberOfLines={1}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
        <TouchableOpacity
          style={styles.item}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Ver todas las categorías"
          onPress={() => router.push('/(tabs)/categories')}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primary + '18' },
            ]}>
            <LayoutGrid size={20} color={colors.primary} strokeWidth={1.9} />
          </View>
          <Text style={[styles.label, { color: colors.primary }]} numberOfLines={1}>
            Todo
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const CIRCLE_SIZE = 48;

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      marginBottom: 16,
    },
    container: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 14,
      alignItems: 'flex-start',
    },
    item: {
      alignItems: 'center',
      width: 64,
      gap: 6,
    },
    iconCircle: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skeletonCircle: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
    },
    label: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 11,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 14,
    },
  });
