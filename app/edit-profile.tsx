import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Camera,
  Check,
  User as UserIcon,
  MapPin,
  Mail,
  Phone,
  FileText,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import Skeleton from '@/components/Skeleton';

interface FormState {
  name: string;
  location: string;
  bio: string;
  email: string;
  phone: string;
  avatar_url: string;
  cover_url: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, loading, update } = useProfile();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [form, setForm] = useState<FormState>({
    name: '',
    location: '',
    bio: '',
    email: '',
    phone: '',
    avatar_url: '',
    cover_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        location: profile.location,
        bio: profile.bio,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        cover_url: profile.cover_url,
      });
    }
  }, [profile]);

  const update_ = (patch: Partial<FormState>) => setForm((p) => ({ ...p, ...patch }));

  const validate = (): string | null => {
    if (!form.name.trim()) return 'El nombre es obligatorio';
    if (form.name.length > 60) return 'El nombre es demasiado largo';
    if (!form.location.trim()) return 'La ubicación es obligatoria';
    if (form.bio.length > 200) return 'La biografía no puede superar 200 caracteres';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return 'Email no válido';
    return null;
  };

  const onSave = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSaving(true);
    const res = await update({
      name: form.name.trim(),
      location: form.location.trim(),
      bio: form.bio.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      avatar_url: form.avatar_url.trim(),
      cover_url: form.cover_url.trim(),
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo guardar');
      return;
    }
    setSavedOk(true);
    setTimeout(() => router.back(), 600);
  };

  if (loading || !profile) {
    return (
      <View style={styles.root}>
        <Skeleton style={{ height: 160, borderRadius: 0 }} />
        <View style={{ paddingHorizontal: 16, marginTop: -44 }}>
          <Skeleton
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              borderWidth: 3,
              borderColor: colors.surface,
            }}
          />
          <Skeleton style={{ height: 48, borderRadius: 12, marginTop: 24 }} />
          <Skeleton style={{ height: 48, borderRadius: 12, marginTop: 14 }} />
          <Skeleton style={{ height: 96, borderRadius: 12, marginTop: 14 }} />
        </View>
      </View>
    );
  }

  const bioRemaining = 200 - form.bio.length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top, height: 52 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ChevronLeft size={22} color={colors.onSurface} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={onSave}
          disabled={saving}
          activeOpacity={0.85}>
          {saving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : savedOk ? (
            <Check size={16} color="#ffffff" strokeWidth={2.5} />
          ) : (
            <Text style={styles.saveBtnText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Cover preview */}
        <View style={styles.coverWrap}>
          <Image source={{ uri: form.cover_url || profile.cover_url }} style={styles.cover} />
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.coverEditBtn}>
            <Camera size={16} color="#ffffff" strokeWidth={2} />
            <Text style={styles.coverEditText}>Cambiar portada</Text>
          </View>
        </View>

        {/* Avatar preview */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: form.avatar_url || profile.avatar_url }} style={styles.avatar} />
            <View style={styles.avatarEditBadge}>
              <Camera size={14} color="#ffffff" strokeWidth={2} />
            </View>
          </View>
        </View>

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información personal</Text>

          <Field
            icon={UserIcon}
            label="Nombre completo"
            value={form.name}
            onChangeText={(v) => update_({ name: v })}
            placeholder="Tu nombre"
          />

          <Field
            icon={MapPin}
            label="Ubicación"
            value={form.location}
            onChangeText={(v) => update_({ location: v })}
            placeholder="Ciudad, País"
          />

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <FileText size={14} color={colors.onSurfaceVariant} strokeWidth={1.5} />
              <Text style={styles.label}>Biografía</Text>
              <Text
                style={[styles.helper, bioRemaining < 0 && { color: colors.error }]}>
                {bioRemaining}
              </Text>
            </View>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.bio}
              onChangeText={(v) => update_({ bio: v })}
              placeholder="Cuéntale a la comunidad sobre ti"
              placeholderTextColor={colors.onSurfaceVariant + '99'}
              multiline
              numberOfLines={4}
              maxLength={220}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Contacto</Text>

          <Field
            icon={Mail}
            label="Email"
            value={form.email}
            onChangeText={(v) => update_({ email: v })}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Field
            icon={Phone}
            label="Teléfono"
            value={form.phone}
            onChangeText={(v) => update_({ phone: v })}
            placeholder="+240 ..."
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.bigSaveBtn, saving && { opacity: 0.6 }]}
          onPress={onSave}
          disabled={saving}
          activeOpacity={0.88}>
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.bigSaveBtnText}>Guardar cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  icon: React.ElementType;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

function Field({
  icon: Icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Icon size={14} color={colors.onSurfaceVariant} strokeWidth={1.5} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant + '99'}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    zIndex: 10,
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
  saveBtn: {
    minWidth: 80,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
    color: '#ffffff',
  },
  coverWrap: {
    height: 160,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverEditBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  coverEditText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
  avatarRow: {
    paddingHorizontal: 16,
    marginTop: -44,
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
    width: 88,
    height: 88,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  errorText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.onErrorContainer,
  },
  formSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 14,
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  sectionHelper: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: -8,
    marginBottom: 4,
  },
  field: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  helper: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant + '99',
  },
  input: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '88',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurface,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  bigSaveBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  bigSaveBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: '#ffffff',
  },
});
