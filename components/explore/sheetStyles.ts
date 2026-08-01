import { StyleSheet } from 'react-native';
import { useThemedStyles, type ThemeColors } from '@/constants/theme';

/** Shared row styles used by every option-list SwipeableSheet in Explore
 *  (section picker, sort picker, category picker, brand picker). */
export function useSheetStyles() {
  return useThemedStyles(makeSheetStyles);
}

const makeSheetStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    optionActive: {
      fontFamily: 'Manrope-SemiBold',
      color: colors.primary,
    },
    empty: {
      fontFamily: 'Manrope-Regular',
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      paddingVertical: 24,
    },
  });
