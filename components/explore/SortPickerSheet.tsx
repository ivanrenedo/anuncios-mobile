import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/constants/theme';
import SwipeableSheet from '@/components/SwipeableSheet';
import { useSheetStyles } from './sheetStyles';
import { SORT_LABELS, type SortOrder } from '@/lib/exploreUtils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface Props {
  visible: boolean;
  value: SortOrder;
  onChange: (value: SortOrder) => void;
  onClose: () => void;
}

/** Sheet with the four sort options (menor precio, mayor precio, A-Z, Z-A). */
export default function SortPickerSheet({ visible, value, onChange, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useSheetStyles();
  const { height, isLandscape } = useResponsiveLayout();

  return (
    <SwipeableSheet visible={visible} onClose={onClose} title="Ordenar por">
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: height * (isLandscape ? 0.72 : 0.44) }}>
        {(Object.keys(SORT_LABELS) as Exclude<SortOrder, null>[]).map((key) => {
          const active = value === key;
          return (
            <TouchableOpacity
              key={key}
              style={styles.option}
              activeOpacity={0.7}
              onPress={() => {
                onChange(key);
                onClose();
              }}>
              <Text style={[styles.optionText, active && styles.optionActive]}>
                {SORT_LABELS[key]}
              </Text>
              {active && <Check size={18} color={colors.primary} strokeWidth={2.2} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SwipeableSheet>
  );
}
