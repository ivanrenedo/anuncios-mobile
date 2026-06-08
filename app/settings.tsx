import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Bell,
  MessageSquare,
  Tag,
  Megaphone,
  Eye,
  Mail,
  Phone,
  Globe,
  Moon,
  Lock,
  HelpCircle,
  FileText,
  ShieldCheck,
  LogOut,
  Trash2,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useProfile, type Profile } from '@/hooks/useProfile';

const LANGUAGES: Record<string, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  pt: 'Português',
};

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, loading, update } = useProfile();
  const [pending, setPending] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'logout' | 'delete' | null>(null);

  if (loading || !profile) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

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

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top, height: 52 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ChevronLeft size={22} color={colors.onSurface} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={styles.headerBtn} />
      </View>

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
            onPress={() => router.push('/edit-profile')}
            style={styles.summaryEditBtn}
            activeOpacity={0.8}>
            <Text style={styles.summaryEditText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <Section title="Notificaciones" icon={Bell}>
          <Toggle
            icon={MessageSquare}
            label="Mensajes"
            description="Avísame cuando reciba un mensaje"
            value={profile.notif_messages}
            loading={pending === 'notif_messages'}
            onChange={(v) => onToggle('notif_messages', v)}
          />
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
        <Section title="Privacidad" icon={Eye}>
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
        <Section title="Preferencias" icon={Globe}>
          <Row
            icon={Globe}
            label="Idioma"
            value={LANGUAGES[profile.language] ?? profile.language}
            onPress={() => setLangOpen(true)}
          />
          <Toggle
            icon={Moon}
            label="Modo oscuro"
            description="Reduce el brillo en entornos oscuros"
            value={profile.dark_mode}
            loading={pending === 'dark_mode'}
            onChange={(v) => onToggle('dark_mode', v)}
            last
          />
        </Section>

        {/* Support */}
        <Section title="Soporte y legal" icon={HelpCircle}>
          <Row icon={ShieldCheck} label="Centro de seguridad" onPress={() => {}} />
          <Row icon={HelpCircle} label="Centro de ayuda" onPress={() => {}} />
          <Row icon={FileText} label="Términos y condiciones" onPress={() => {}} />
          <Row icon={Lock} label="Política de privacidad" onPress={() => {}} last />
        </Section>

        {/* Danger zone */}
        <Section title="Cuenta" icon={LogOut} danger>
          <Row
            icon={LogOut}
            label="Cerrar sesión"
            danger
            onPress={() => setConfirmAction('logout')}
          />
          <Row
            icon={Trash2}
            label="Eliminar cuenta"
            danger
            onPress={() => setConfirmAction('delete')}
            last
          />
        </Section>

        <Text style={styles.version}>Market EG · v1.0.0</Text>
      </ScrollView>

      {/* Language picker modal */}
      <Modal
        transparent
        visible={langOpen}
        animationType="fade"
        onRequestClose={() => setLangOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setLangOpen(false)}>
          <Pressable style={styles.langSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Selecciona el idioma</Text>
            {Object.entries(LANGUAGES).map(([code, label]) => {
              const active = profile.language === code;
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
          </Pressable>
        </Pressable>
      </Modal>

      {/* Confirmation modal */}
      <Modal
        transparent
        visible={confirmAction !== null}
        animationType="fade"
        onRequestClose={() => setConfirmAction(null)}>
        <Pressable style={styles.backdrop} onPress={() => setConfirmAction(null)}>
          <Pressable style={styles.confirmCard}>
            <View
              style={[
                styles.confirmIcon,
                { backgroundColor: confirmAction === 'delete' ? colors.error + '15' : colors.tertiary + '15' },
              ]}>
              {confirmAction === 'delete' ? (
                <Trash2 size={26} color={colors.error} strokeWidth={1.5} />
              ) : (
                <LogOut size={26} color={colors.tertiary} strokeWidth={1.5} />
              )}
            </View>
            <Text style={styles.confirmTitle}>
              {confirmAction === 'delete' ? 'Eliminar cuenta' : 'Cerrar sesión'}
            </Text>
            <Text style={styles.confirmDesc}>
              {confirmAction === 'delete'
                ? 'Esta acción no se puede deshacer. Se eliminarán todos tus anuncios y mensajes.'
                : 'Cerraremos tu sesión en este dispositivo. Podrás volver a entrar cuando quieras.'}
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setConfirmAction(null)}
                activeOpacity={0.8}>
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmAction,
                  { backgroundColor: confirmAction === 'delete' ? colors.error : colors.tertiary },
                ]}
                onPress={() => setConfirmAction(null)}
                activeOpacity={0.85}>
                <Text style={styles.confirmActionText}>
                  {confirmAction === 'delete' ? 'Eliminar' : 'Cerrar sesión'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

interface SectionProps {
  title: string;
  icon: React.ElementType;
  danger?: boolean;
  children: React.ReactNode;
}

function Section({ title, children, danger }: SectionProps) {
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

function Row({ icon: Icon, label, value, onPress, last, danger }: RowProps) {
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4d',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: colors.onSurface,
    letterSpacing: -0.3,
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  langSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: colors.onSurface,
    paddingHorizontal: 4,
    marginBottom: 8,
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
  confirmCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  confirmTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: colors.onSurface,
  },
  confirmDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  confirmAction: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmActionText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
});
