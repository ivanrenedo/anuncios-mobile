import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import RipplePress from './RipplePress';

const HUE_STOPS: readonly [string, string, string, string, string, string, string] = [
  '#ff0000',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#0000ff',
  '#ff00ff',
  '#ff0000',
];

const PAD_HEIGHT = 200;

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, '0').toUpperCase())
      .join('')
  );
}

function hexToHsv(hex: string): { h: number; s: number; v: number } | null {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d + 6) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

interface ColorPickerProps {
  value?: string;
  onChange: (hex: string) => void;
  onClear?: () => void;
}

export default function ColorPicker({ value, onChange, onClear }: ColorPickerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const initial = useMemo(
    () => (value && hexToHsv(value)) || { h: 0, s: 1, v: 1 },
    // Only seed from `value` on mount — later, state flows outward (user → parent).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [h, setH] = useState(initial.h);
  const [s, setS] = useState(initial.s);
  const [v, setV] = useState(initial.v);
  const [hexInput, setHexInput] = useState(
    value ?? rgbToHex(...hsvToRgb(initial.h, initial.s, initial.v)),
  );

  const [padWidth, setPadWidth] = useState(0);
  const [hueWidth, setHueWidth] = useState(0);

  const [rr, gg, bb] = hsvToRgb(h, s, v);
  const hex = rgbToHex(rr, gg, bb);
  const hueHex = rgbToHex(...hsvToRgb(h, 1, 1));

  // PanResponder captures the closure at first render, so it would keep seeing
  // `padWidth=0` / stale h,s,v. Route every callback through a live ref so the
  // handlers always read the latest state.
  const latest = useRef({ h, s, v, padWidth, hueWidth });
  latest.current = { h, s, v, padWidth, hueWidth };

  const emit = (nh: number, ns: number, nv: number) => {
    setH(nh);
    setS(ns);
    setV(nv);
    const [r, g, b] = hsvToRgb(nh, ns, nv);
    const nextHex = rgbToHex(r, g, b);
    setHexInput(nextHex);
    onChange(nextHex);
  };
  const emitRef = useRef(emit);
  emitRef.current = emit;

  const handlePad = (x: number, y: number) => {
    const w = latest.current.padWidth;
    if (!w) return;
    const cx = Math.max(0, Math.min(w, x));
    const cy = Math.max(0, Math.min(PAD_HEIGHT, y));
    emitRef.current(latest.current.h, cx / w, 1 - cy / PAD_HEIGHT);
  };

  const handleHue = (x: number) => {
    const w = latest.current.hueWidth;
    if (!w) return;
    const cx = Math.max(0, Math.min(w, x));
    emitRef.current(
      (cx / w) * 360,
      latest.current.s,
      latest.current.v,
    );
  };

  const padResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) =>
        handlePad(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderMove: (e) =>
        handlePad(e.nativeEvent.locationX, e.nativeEvent.locationY),
    }),
  ).current;

  const hueResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => handleHue(e.nativeEvent.locationX),
      onPanResponderMove: (e) => handleHue(e.nativeEvent.locationX),
    }),
  ).current;

  const applyHex = (raw: string) => {
    const cleaned = raw.trim().toUpperCase();
    setHexInput(cleaned);
    const withHash = cleaned.startsWith('#') ? cleaned : '#' + cleaned;
    const parsed = hexToHsv(withHash);
    if (parsed) {
      setH(parsed.h);
      setS(parsed.s);
      setV(parsed.v);
      onChange(withHash);
    }
  };

  const onPadLayout = (e: LayoutChangeEvent) =>
    setPadWidth(e.nativeEvent.layout.width);
  const onHueLayout = (e: LayoutChangeEvent) =>
    setHueWidth(e.nativeEvent.layout.width);

  const cursorX = s * padWidth;
  const cursorY = (1 - v) * PAD_HEIGHT;
  const hueCursorX = (h / 360) * hueWidth;

  return (
    <View style={{ paddingBottom: 12 }}>
      <View style={styles.previewRow}>
        <View style={[styles.previewSwatch, { backgroundColor: hex }]} />
        <TextInput
          style={styles.hexInput}
          value={hexInput}
          onChangeText={applyHex}
          placeholder="#RRGGBB"
          placeholderTextColor={colors.onSurfaceVariant + '88'}
          maxLength={7}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {onClear && (
          <RipplePress
            style={styles.clearBtn}
            borderRadius={10}
            rippleColor={colors.error + '18'}
            onPress={onClear}>
            <Text style={[styles.clearBtnText, { color: colors.error }]}>Quitar</Text>
          </RipplePress>
        )}
      </View>

      <View
        style={[styles.pad, { backgroundColor: hueHex }]}
        onLayout={onPadLayout}
        {...padResponder.panHandlers}>
        <LinearGradient
          pointerEvents="none"
          colors={['#ffffff', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0)', '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {padWidth > 0 && (
          <View
            pointerEvents="none"
            style={[
              styles.padCursor,
              {
                left: cursorX - 10,
                top: cursorY - 10,
                borderColor: v > 0.6 && s < 0.4 ? '#333' : '#fff',
              },
            ]}
          />
        )}
      </View>

      <View
        style={styles.hueBar}
        onLayout={onHueLayout}
        {...hueResponder.panHandlers}>
        <LinearGradient
          pointerEvents="none"
          colors={HUE_STOPS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {hueWidth > 0 && (
          <View
            pointerEvents="none"
            style={[styles.hueCursor, { left: hueCursorX - 8 }]}
          />
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    previewSwatch: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '66',
    },
    hexInput: {
      flex: 1,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: 'Manrope-SemiBold',
      fontSize: 15,
      color: colors.onSurface,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '4d',
      letterSpacing: 1,
    },
    clearBtn: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
    },
    clearBtnText: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 13,
    },
    pad: {
      width: '100%',
      height: PAD_HEIGHT,
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
    },
    padCursor: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
    },
    hueBar: {
      width: '100%',
      height: 28,
      borderRadius: 14,
      marginTop: 14,
      overflow: 'hidden',
      position: 'relative',
    },
    hueCursor: {
      position: 'absolute',
      top: -2,
      width: 16,
      height: 32,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#ffffff',
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
  });
