import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import { useTheme } from '@/constants/theme';

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  wordmarkSize?: number;
  color?: string;
  onColor?: string;
}

export default function BrandLogo({
  size = 28,
  showWordmark = true,
  wordmarkSize,
  color,
  onColor,
}: BrandLogoProps) {
  const { colors } = useTheme();
  const primary = color ?? colors.primary;
  const onPrimary = onColor ?? colors.onPrimary;
  const wSize = wordmarkSize ?? Math.round(size * 0.75);

  return (
    <View style={styles.row}>
      <Svg width={size} height={size} viewBox="0 0 240 240">
        <Rect x={0} y={0} width={240} height={240} rx={54} ry={54} fill={primary} />
        <Rect x={64} y={44} width={28} height={152} rx={6} fill={onPrimary} />
        <Circle cx={126} cy={140} r={56} fill={onPrimary} />
        <Circle cx={126} cy={140} r={22} fill={primary} />
      </Svg>
      {showWordmark && (
        <Text
          style={[
            styles.wordmark,
            { fontSize: wSize, color: colors.onSurface },
          ]}
          allowFontScaling={false}
        >
          bomell<Text style={{ color: primary }}>.</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontFamily: 'Manrope-Bold',
    letterSpacing: -0.6,
    lineHeight: undefined,
  },
});
