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
  Linking,
} from 'react-native';
import { ShieldCheck, Banknote, MapPin, ScanSearch, Phone } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 120;

export type SafetyModalMode = 'tips' | 'whatsapp' | 'call';

interface Props {
  visible: boolean;
  mode: SafetyModalMode;
  onClose: () => void;
  phoneNumber?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
}

function WhatsAppSvg() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={colors.primary}>
      <Path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.128l-.694 2.537 2.597-.681c.812.443 1.764.782 2.84.783h.001c3.181 0 5.766-2.586 5.767-5.766 0-3.18-2.585-5.767-5.768-5.767zm3.387 8.191c-.131.372-.767.712-1.056.747-.29.035-.577.062-1.62-.353-1.041-.416-2.132-1.731-2.658-2.433-.403-.523-.672-.871-.672-1.398 0-.528.273-.787.37-.891.085-.09.186-.135.279-.135.093 0 .186.002.251.004l.322.006c.107.001.21.002.298.221.112.273.384.935.417 1.002.033.066.054.143.01.23-.044.088-.066.143-.132.22-.066.077-.138.128-.197.197l-.273.334c-.074.074-.15.155-.064.302.086.148.38.627.815 1.014.56.499 1.03.654 1.178.727.148.073.234.061.32-.039.086-.1.371-.433.469-.581.099-.148.197-.124.333-.074.135.05 1.135.535 1.341.631.206.095.343.142.393.228.05.085.05.49-.081.862z" />
      <Path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.144c-1.657 0-3.213-.424-4.566-1.168l-4.149 1.087 1.107-4.048C3.54 15.592 3.045 13.927 3.045 12.15 3.045 7.129 7.134 3.04 12.155 3.04S21.265 7.129 21.265 12.15c-.001 5.021-4.09 9.11-9.11 9.11h-.155z" />
    </Svg>
  );
}

const tips = [
  {
    icon: Banknote,
    title: 'Solo pago en persona',
    desc: 'No pagues por adelantado ni hagas transferencias previas a la entrega.',
  },
  {
    icon: MapPin,
    title: 'Reuniones seguras',
    desc: 'Elige lugares públicos y concurridos para hacer el intercambio.',
  },
  {
    icon: ScanSearch,
    title: 'Inspecciona el producto',
    desc: 'Verifica el estado y el funcionamiento del artículo antes de pagar.',
  },
];

const modalConfig: Record<SafetyModalMode, { ctaLabel: string; ctaIcon: React.ReactNode }> = {
  tips: {
    ctaLabel: 'Entendido',
    ctaIcon: null,
  },
  whatsapp: {
    ctaLabel: 'Entendido, abrir WhatsApp',
    ctaIcon: <WhatsAppSvg />,
  },
  call: {
    ctaLabel: 'Entendido, llamar ahora',
    ctaIcon: <Phone size={20} color={colors.onPrimaryContainer} strokeWidth={2} />,
  },
};

export default function SafetyModal({
  visible,
  mode,
  onClose,
  phoneNumber,
  whatsappNumber,
  whatsappMessage,
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

  const handleContinue = () => {
    onClose();
    if (mode === 'whatsapp') {
      const waUrl = whatsappMessage
        ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
        : `https://wa.me/${whatsappNumber}`;
      setTimeout(() => Linking.openURL(waUrl), 300);
    } else if (mode === 'call') {
      setTimeout(() => Linking.openURL(`tel:${phoneNumber}`), 300);
    }
  };

  const config = modalConfig[mode];

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
          <Text style={styles.title}>Consejos de Seguridad</Text>
          <Text style={styles.subtitle}>
            Protege tu dinero y tu seguridad en transacciones P2P.
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsList} {...panResponder.panHandlers}>
          {tips.map(({ icon: Icon, title, desc }) => (
            <View key={title} style={styles.tip}>
              <View style={styles.tipIcon}>
                <Icon size={22} color={colors.primary} strokeWidth={1.5} />
              </View>
              <View style={styles.tipText}>
                <Text style={styles.tipTitle}>{title}</Text>
                <Text style={styles.tipDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleContinue} activeOpacity={0.88}>
            {config.ctaIcon && <View>{config.ctaIcon}</View>}
            <Text style={styles.ctaBtnText}>{config.ctaLabel}</Text>
          </TouchableOpacity>
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
