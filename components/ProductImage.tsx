import React from 'react';
import { View, Image, StyleProp, ImageStyle } from 'react-native';
import { ImageOff } from 'lucide-react-native';
import { useTheme } from '@/constants/theme';

/**
 * Product thumbnail that degrades to a themed placeholder (gray box + icon)
 * when there is no image — used wherever a product may have no photos yet.
 */
export default function ProductImage({
  uri,
  style,
  iconSize = 28,
}: {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  iconSize?: number;
}) {
  const { colors } = useTheme();
  if (uri) return <Image source={{ uri }} style={style} />;
  return (
    <View
      style={[
        style,
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceContainerHigh,
        },
      ]}>
      <ImageOff size={iconSize} color={colors.onSurfaceVariant + '66'} strokeWidth={1.5} />
    </View>
  );
}
