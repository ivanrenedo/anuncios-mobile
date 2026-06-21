import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutGrid } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useCategoryTree } from '@/hooks/useCategories';

const BTN_WIDTH = 56;

export default function CategoryScroll() {
  const router = useRouter();
  const { tree: categories } = useCategoryTree();

  const search = (term: string) =>
    router.push({ pathname: '/(tabs)/explore', params: { filterCat: term } });

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <>
      <View style={styles.section}>
        <View style={styles.wrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}>
            {categories.map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.item}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={`Buscar ${cat.label}`}
                onPress={() => search(cat.label)}>
                <Text style={styles.label}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.allBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ver todas las categorías"
            onPress={() => router.push('/(tabs)/categories')}>
            <LayoutGrid size={20} color={colors.primary} strokeWidth={1.9} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  wrapper: {
    position: 'relative',
  },
  container: {
    paddingLeft: 16,
    paddingRight: BTN_WIDTH + 16,
    paddingVertical: 10,
    gap: 16,
    alignItems: 'center',
  },
  item: {
    justifyContent: 'center',
    paddingVertical: 6,
  },
  label: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    letterSpacing: -0.1,
  },
  allBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: BTN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
