import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { ShieldCheck, Phone, AlertTriangle, Flag, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 120;


interface Props {
  visible: boolean;
  onClose: () => void;
}

const items = [
  { icon: Lock, label: 'Verificación de identidad', desc: 'Confirma quién eres' },
  { icon: AlertTriangle, label: 'Reportar un anuncio', desc: 'Ayúdanos a mantener la calidad' },
  { icon: Flag, label: 'Reportar un usuario', desc: 'Comportamientos sospechosos' },
  { icon: Phone, label: 'Contactar soporte', desc: 'Estamos aquí para ayudarte' },
];

export default function CenterSafetyModal({
  visible,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    if (visible) {
      dragY.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 260, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) dragY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DISMISS_THRESHOLD || gs.vy > 0.8) {
          dismiss();
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            damping: 20,
            stiffness: 300,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const backdropOpacity = Animated.multiply(
    opacityAnim,
    dragY.interpolate({
      inputRange: [0, SCREEN_HEIGHT * 0.5],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    })
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, 24) },
          { transform: [{ translateY: Animated.add(slideAnim, dragY) }] },
        ]}>
        {/* Drag handle — gesture zone */}
        <View style={styles.handleZone} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header} {...panResponder.panHandlers}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={32} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Centro de Seguridad</Text>
          <Text style={styles.subtitle}>
            Protege tu dinero y tu seguridad en transacciones P2P.
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsList} {...panResponder.panHandlers}>
          {items.map(({ icon: Icon, label, desc }) => (
            <View key={label} style={styles.tip}>
              <View style={styles.tipIcon}>
                <Icon size={22} color={colors.primary} strokeWidth={1.5} />
              </View>
              <View style={styles.tipText}>
                <Text style={styles.tipTitle}>{label}</Text>
                <Text style={styles.tipDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.linkBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.linkBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 28, 29, 0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 24,
  },
  handleZone: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceVariant,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Manrope-Bold',
    fontSize: 22,
    color: colors.onSurface,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  tipsList: {
    gap: 20,
    marginBottom: 32,
  },
  tip: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    paddingTop: 2,
  },
  tipTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 20,
    marginBottom: 3,
  },
  tipDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
    alignItems: 'center',
  },
  ctaBtn: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: colors.primaryContainer,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: colors.onPrimaryContainer,
  },
  linkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  linkBtnText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
});
