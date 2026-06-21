import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MapPin, ChevronDown, Check } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import SwipeableSheet from '@/components/SwipeableSheet';

export const CITIES = [
  'Malabo',
  'Bata',
  'Ebibeyin',
  'Mongomo',
  'Luba',
  'Aconibe',
  'Evinayong',
];

interface Props {
  city: string;
  onChange: (c: string) => void;
}

export default function CitySelector({ city, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <>
      <TouchableOpacity
        style={styles.bar}
        activeOpacity={0.7}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Cambiar ubicación, actual: ${city}`}>
        <MapPin size={15} color={colors.primary} strokeWidth={2} />
        {city ? (
          <>
            <Text style={styles.label}>Anuncios en</Text>
            <Text style={styles.city}>{city}</Text>
          </>
        ) : (
          <Text style={styles.city}>Elige tu ciudad</Text>
        )}
        <ChevronDown size={15} color={colors.onSurfaceVariant} strokeWidth={2} />
      </TouchableOpacity>

      <SwipeableSheet visible={open} onClose={() => setOpen(false)} title="Elige tu ciudad">
        <ScrollView showsVerticalScrollIndicator={false}>
          {CITIES.map((c) => {
            const active = c === city;
            return (
              <TouchableOpacity
                key={c}
                style={styles.option}
                activeOpacity={0.7}
                onPress={() => {
                  onChange(c);
                  setOpen(false);
                }}>
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {c}
                </Text>
                {active && <Check size={18} color={colors.primary} strokeWidth={2.2} />}
              </TouchableOpacity>
            );
          })}

          {city !== '' && (
            <TouchableOpacity
              style={[styles.option, styles.clearOption]}
              activeOpacity={0.7}
              onPress={() => {
                onChange('');
                setOpen(false);
              }}>
              <Text style={styles.clearText}>Quitar selección</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SwipeableSheet>
    </>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  label: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  city: {
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
    color: colors.onSurface,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '33',
  },
  optionText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
  },
  optionTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: colors.primary,
  },
  clearOption: {
    justifyContent: 'center',
    borderBottomWidth: 0,
  },
  clearText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.error,
  },
});
