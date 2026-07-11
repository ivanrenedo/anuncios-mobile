import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
import { uploadImage } from '@/lib/upload';
import Skeleton from '@/components/Skeleton';

let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  ImagePicker = null;
}

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
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);
  const [removed, setRemoved] = useState<{ avatar?: boolean; cover?: boolean }>({});
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

  const pickAndUpload = async (target: 'avatar' | 'cover', source: 'library' | 'camera') => {
    if (!ImagePicker) {
      Alert.alert('Función no disponible', 'Actualiza la app para cambiar fotos.');
      return;
    }
    if (source === 'library') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso necesario', 'Concede acceso a tus fotos.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: target === 'avatar' ? [1, 1] : [16, 9],
        quality: 0.8,
      });
      if (res.canceled) return;
      await uploadAndApply(target, res.assets[0].uri);
    } else {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso necesario', 'Concede acceso a la cámara.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: target === 'avatar' ? [1, 1] : [16, 9],
        quality: 0.8,
      });
      if (res.canceled) return;
      await uploadAndApply(target, res.assets[0].uri);
    }
  };

  const uploadAndApply = async (target: 'avatar' | 'cover', localUri: string) => {
    setUploading(target);
    try {
      const url = await uploadImage(localUri);
      update_(target === 'avatar' ? { avatar_url: url } : { cover_url: url });
      setRemoved((p) => ({ ...p, [target]: false }));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploading(null);
    }
  };

  const removePhoto = (target: 'avatar' | 'cover') => {
    update_(target === 'avatar' ? { avatar_url: '' } : { cover_url: '' });
    setRemoved((p) => ({ ...p, [target]: true }));
  };

  const showPhotoPicker = (target: 'avatar' | 'cover') => {
    const isRemoved = target === 'avatar' ? removed.avatar : removed.cover;
    const currentUrl = target === 'avatar' ? form.avatar_url : form.cover_url;
    const hasPhoto = !isRemoved && !!currentUrl;
    const buttons: any[] = [
      { text: 'Hacer una foto', onPress: () => pickAndUpload(target, 'camera') },
      { text: 'Elegir de la galería', onPress: () => pickAndUpload(target, 'library') },
    ];
    if (hasPhoto) {
      buttons.push({ text: 'Eliminar foto', style: 'destructive', onPress: () => removePhoto(target) });
    }
    buttons.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert(
      target === 'avatar' ? 'Foto de perfil' : 'Portada',
      undefined,
      buttons,
    );
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'El nombre es obligatorio';
    if (form.name.length > 60) return 'El nombre es demasiado largo';
    if (!form.location.trim()) return 'La ubicación es obligatoria';
    if (form.bio.length > 350) return 'La biografía no puede superar 350 caracteres';
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
      avatar_url: form.avatar_url.trim(),
      cover_url: form.cover_url.trim(),
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo guardar');
      return;
    }
    setSavedOk(true);
    setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/profile' as any);
    }, 600);
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

  const bioRemaining = 350 - form.bio.length;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top, height: 52 + insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any)} activeOpacity={0.8}>
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

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        extraScrollHeight={Platform.OS === 'ios' ? 40 : 80}
        enableOnAndroid>
        {/* Cover preview */}
        <TouchableOpacity
          style={styles.coverWrap}
          activeOpacity={0.85}
          onPress={() => showPhotoPicker('cover')}
          disabled={uploading !== null}>
          {!removed.cover && (form.cover_url || profile.cover_url) ? (
            <Image source={{ uri: form.cover_url || profile.cover_url }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, { backgroundColor: colors.surfaceContainerLow }]} />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.coverEditBtn}>
            {uploading === 'cover' ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Camera size={16} color="#ffffff" strokeWidth={2} />
                <Text style={styles.coverEditText}>Cambiar portada</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Avatar preview */}
        <View style={styles.avatarRow}>
          <TouchableOpacity
            style={styles.avatarWrap}
            activeOpacity={0.85}
            onPress={() => showPhotoPicker('avatar')}
            disabled={uploading !== null}>
            {!removed.avatar && (form.avatar_url || profile.avatar_url) ? (
              <Image source={{ uri: form.avatar_url || profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' }]}>
                <UserIcon size={32} color={colors.onSurfaceVariant} strokeWidth={1.2} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploading === 'avatar' ? (
                <ActivityIndicator color="#ffffff" size={12} />
              ) : (
                <Camera size={14} color="#ffffff" strokeWidth={2} />
              )}
            </View>
          </TouchableOpacity>
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
              maxLength={370}
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
            editable={false}
            autoCapitalize="none"
          />

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Phone size={14} color={colors.onSurfaceVariant} strokeWidth={1.5} />
              <Text style={styles.label}>Teléfono</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.input, { flex: 1, justifyContent: 'center', opacity: 0.7 }]}>
                <Text style={{ fontFamily: 'Manrope-Regular', fontSize: 15, color: colors.onSurface }}>
                  {form.phone || 'Sin teléfono'}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                }}
                activeOpacity={0.85}
                onPress={() => router.push('/verify-phone' as any)}>
                <Text style={{ fontFamily: 'Manrope-Bold', fontSize: 13, color: '#ffffff' }}>
                  {form.phone ? 'Cambiar' : 'Verificar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
      </KeyboardAwareScrollView>
    </View>
  );
}

interface FieldProps {
  icon: React.ElementType;
  label: string;
  value: string;
  editable?: boolean;
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
  editable=true,
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
        style={[styles.input, !editable && { opacity: 0.5, backgroundColor: colors.surfaceContainerLow, color: colors.onSurfaceVariant }]}
        value={value}
        editable={editable}
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
