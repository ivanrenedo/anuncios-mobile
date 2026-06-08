import React, { useRef, useCallback } from 'react';
import {
  Pressable,
  Animated,
  View,
  StyleSheet,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors } from '@/constants/theme';

interface Props {
  onPress?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  rippleColor?: string;
  borderRadius?: number;
  disabled?: boolean;
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
}

export default function RipplePress({
  onPress,
  onLongPress,
  children,
  style,
  rippleColor = colors.primary + '22',
  borderRadius = 8,
  disabled = false,
  hitSlop,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.96,
        damping: 15,
        stiffness: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 15,
        stiffness: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (Platform.OS === 'android') {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        hitSlop={hitSlop}
        android_ripple={{ color: rippleColor, borderless: false }}
        style={style}>
        {children}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={animateIn}
      onPressOut={animateOut}
      style={[{ overflow: 'hidden', borderRadius }, style as ViewStyle]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: rippleColor, opacity, borderRadius },
          ]}
          pointerEvents="none"
        />
        {children}
      </Animated.View>
    </Pressable>
  );
}
