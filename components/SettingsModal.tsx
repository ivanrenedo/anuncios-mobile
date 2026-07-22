import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import SwipeableSheet from '@/components/SwipeableSheet';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Tag,
  Megaphone,
  Mail,
  Phone,
  Globe,
  Moon,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useProfile, type Profile } from '@/hooks/useProfile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LANGUAGES: Record<string, string> = {
  es: 'Español',
  /* en: 'English',
  fr: 'Français',
  pt: 'Português', */
};

type ThemePref = 'system' | 'light' | 'dark';
const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Predeterminado del sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];
const THEME_LABELS: Record<ThemePref, string> = {
  system: 'Sistema',
  light: 'Claro',
  dark: 'Oscuro',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, loading, update } = useProfile();

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  const [pending, setPending] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          damping: 24,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
        setLangOpen(false);
        setThemeOpen(false);
      });
    }
  }, [visible]);

  const onToggle = async (key: keyof Profile, value: boolean) => {
    setPending(key as string);
    await update({ [key]: value } as Partial<Profile>);
    setPending(null);
  };

  const onLanguage = async (lang: string) => {
    setLangOpen(false);
    setPending('language');
    await update({ language: lang });
    setPending(null);
  };

  const onTheme = async (pref: ThemePref) => {
    setThemeOpen(false);
    setPending('theme_preference');
    await update({ theme_preference: pref });
    setPending(null);
  };

  const goEditProfile = () => {
    onClose();
    setTimeout(() => router.push('/edit-profile'), 280);
  };

  if (!mounted && !visible) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            paddingTop: insets.top,
            transform: [{ translateX }],
          },
        ]}>
        {/* Header */}
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Ajustes</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color={colors.onSurfaceVariant} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {loading || !profile ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 32 }}>
            {/* Account summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryAvatar}>
                <Text style={styles.summaryInitial}>
                  {profile.name.trim().charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryName}>{profile.name}</Text>
                <Text style={styles.summaryEmail}>{profile.email}</Text>
              </View>
              <TouchableOpacity
                onPress={goEditProfile}
                style={styles.summaryEditBtn}
                activeOpacity={0.8}>
                <Text style={styles.summaryEditText}>Editar</Text>
              </TouchableOpacity>
            </View>

            {/* Notifications */}
            <Section title="Notificaciones">
              <Toggle
                icon={Tag}
                label="Ofertas y precios"
                description="Bajadas de precio en tus favoritos"
                value={profile.notif_offers}
                loading={pending === 'notif_offers'}
                onChange={(v) => onToggle('notif_offers', v)}
              />
              <Toggle
                icon={Megaphone}
                label="Marketing"
                description="Novedades, promociones y boletines"
                value={profile.notif_marketing}
                loading={pending === 'notif_marketing'}
                onChange={(v) => onToggle('notif_marketing', v)}
                last
              />
            </Section>

            {/* Privacy */}
            <Section title="Privacidad">
              <Toggle
                icon={Mail}
                label="Mostrar email"
                description="Visible en tu perfil público"
                value={profile.show_email}
                loading={pending === 'show_email'}
                onChange={(v) => onToggle('show_email', v)}
              />
              <Toggle
                icon={Phone}
                label="Mostrar teléfono"
                description="Permitir que otros vean tu número"
                value={profile.show_phone}
                loading={pending === 'show_phone'}
                onChange={(v) => onToggle('show_phone', v)}
                last
              />
            </Section>
            
            {/* Preferences */}
            <Section title="Preferencias">
              <Row
                icon={Globe}
                label="Idioma"
                value={LANGUAGES[profile.language] ?? profile.language}
                onPress={() => setLangOpen(true)}
              />
              <Row
                icon={Moon}
                label="Tema"
                value={THEME_LABELS[profile.theme_preference ?? 'system']}
                onPress={() => setThemeOpen(true)}
                last
              />
            </Section>
            <Text style={styles.version}>Bomell · v1.0.0</Text>
          </ScrollView>
        )}
      </Animated.View>

      {/* Language picker sheet */}
      <SwipeableSheet visible={langOpen} onClose={() => setLangOpen(false)} title="Selecciona el idioma">
        {Object.entries(LANGUAGES).map(([code, label]) => {
          const active = profile?.language === code;
          return (
            <TouchableOpacity
              key={code}
              style={styles.langOption}
              onPress={() => onLanguage(code)}
              activeOpacity={0.7}>
              <Text style={[styles.langText, active && styles.langTextActive]}>
                {label}
              </Text>
              {active && <Check size={18} color={colors.primary} strokeWidth={2} />}
            </TouchableOpacity>
          );
        })}
      </SwipeableSheet>

      {/* Theme picker sheet */}
      <SwipeableSheet visible={themeOpen} onClose={() => setThemeOpen(false)} title="Tema de la aplicación">
        {THEME_OPTIONS.map((opt) => {
          const active = (profile?.theme_preference ?? 'system') === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={styles.langOption}
              onPress={() => onTheme(opt.value)}
              activeOpacity={0.7}>
              <Text style={[styles.langText, active && styles.langTextActive]}>
                {opt.label}
              </Text>
              {active && <Check size={18} color={colors.primary} strokeWidth={2} />}
            </TouchableOpacity>
          );
        })}
      </SwipeableSheet>

      
    </Modal>
  );
}

export function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, danger && { color: colors.error }]}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

interface ToggleProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  value: boolean;
  loading?: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}

function Toggle({ icon: Icon, label, description, value, loading, onChange, last }: ToggleProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}>
        <Icon size={18} color={colors.primary} strokeWidth={1.5} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: colors.outlineVariant + '88', true: colors.primary + 'cc' }}
          thumbColor={value ? colors.primary : colors.surfaceContainerLowest}
          ios_backgroundColor={colors.outlineVariant + '88'}
        />
      )}
    </View>
  );
}

interface RowProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
  danger?: boolean;
}

export function Row({ icon: Icon, label, value, onPress, last, danger }: RowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.row, !last && styles.rowBorder]}>
      <View style={[styles.rowIcon, danger && { backgroundColor: colors.error + '15' }]}>
        <Icon size={18} color={danger ? colors.error : colors.primary} strokeWidth={1.5} />
      </View>
      <Text style={[styles.rowLabel, { flex: 1 }, danger && { color: colors.error }]}>
        {label}
      </Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      <ChevronRight size={16} color={colors.outlineVariant} strokeWidth={1.5} />
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '44',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 22,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInitial: {
    fontFamily: 'Manrope-Bold',
    fontSize: 22,
    color: '#ffffff',
  },
  summaryName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: colors.onSurface,
  },
  summaryEmail: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  summaryEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.primary + '15',
    borderRadius: 999,
  },
  summaryEditText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  section: {
    paddingTop: 22,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: colors.onSurfaceVariant + 'aa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '33',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  rowDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  rowValue: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  version: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.outlineVariant,
    textAlign: 'center',
    marginTop: 28,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '33',
  },
  langText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
  },
  langTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: colors.primary,
  },
});
