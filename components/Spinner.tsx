import { ActivityIndicator, type ColorValue } from 'react-native';
import { useTheme } from '@/constants/theme';

/**
 * Spinning loader for in-flight actions (form submit, create/update/delete
 * mutations). Defaults to the theme's primary color.
 */
export default function Spinner({
  size = 'small',
  color,
}: {
  size?: number | 'small' | 'large';
  color?: ColorValue;
}) {
  const { colors } = useTheme();
  return <ActivityIndicator size={size} color={color ?? colors.primary} />;
}
