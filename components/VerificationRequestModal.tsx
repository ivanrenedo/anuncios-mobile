import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Upload, Trash2, ShieldCheck } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { uploadImage } from '@/lib/upload';
import { useRequestVerification } from '@/hooks/useVerification';
import { getErrorMessage } from '@/lib/errors';

const MAX_DOCS = 5;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

/**
 * v2 Fase 10c mobile — modal para solicitar verificación con docs.
 *
 * Reutiliza expo-image-picker (que ya está en el proyecto) para permitir al
 * usuario adjuntar hasta 5 imágenes. Sube cada una vía uploadImage() y luego
 * llama requestVerification({ docs: [urls] }) que casa con el input v2 del
 * backend.
 */
export default function VerificationRequestModal({
  visible,
  onClose,
  onSubmitted,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { requestVerification, loading: submitting } =
    useRequestVerification();

  React.useEffect(() => {
    if (!visible) setUrls([]);
  }, [visible]);

  const pickAndUpload = async () => {
    if (urls.length >= MAX_DOCS) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_DOCS - urls.length,
        quality: 0.85,
      });
      if (res.canceled) return;
      setUploading(true);
      const uploaded: string[] = [];
      for (const a of res.assets) {
        try {
          const url = await uploadImage(a.uri);
          uploaded.push(url);
        } catch (e) {
          // Sigue con los demás — reporta al final si algo falló.
          console.warn('upload doc failed', e);
        }
      }
      setUrls((prev) => [...prev, ...uploaded]);
      if (uploaded.length < res.assets.length) {
        Alert.alert(
          'Aviso',
          `No se pudieron subir ${res.assets.length - uploaded.length} archivo(s). Reintenta.`,
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (i: number) =>
    setUrls((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    try {
      await requestVerification(urls);
      onSubmitted?.();
      onClose();
      Alert.alert(
        'Solicitud enviada',
        'Te notificaremos cuando sea revisada.',
      );
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e, 'No se pudo enviar la solicitud.'));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <ShieldCheck size={20} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Solicitar verificación</Text>
            <Text style={styles.subtitle}>
              Adjunta fotos: DNI, licencia de negocio o selfie con documento.
              Solo imágenes — máximo {MAX_DOCS}. Revisión manual en menos de
              48 h.
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.onSurface} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          {urls.length === 0 ? (
            <TouchableOpacity
              style={styles.dropZone}
              onPress={pickAndUpload}
              disabled={uploading}
              activeOpacity={0.85}>
              {uploading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <Upload size={28} color={colors.primary} strokeWidth={1.6} />
              )}
              <Text style={styles.dropZoneTitle}>
                {uploading ? 'Subiendo…' : 'Subir documento'}
              </Text>
              <Text style={styles.dropZoneHint}>
                Solo imágenes (JPG · PNG · WEBP) · máx {MAX_DOCS}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 8 }}>
              {urls.map((url, i) => (
                <View key={url} style={styles.item}>
                  <Image source={{ uri: url }} style={styles.thumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>Documento {i + 1}</Text>
                    <Text style={styles.itemPath} numberOfLines={1}>
                      {url.split('/').pop()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeAt(i)}
                    style={styles.removeBtn}>
                    <Trash2 size={16} color={colors.error} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
              {urls.length < MAX_DOCS && (
                <TouchableOpacity
                  style={styles.addMore}
                  onPress={pickAndUpload}
                  disabled={uploading}
                  activeOpacity={0.85}>
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Upload size={14} color={colors.primary} strokeWidth={2} />
                  )}
                  <Text style={styles.addMoreText}>
                    Añadir otro ({MAX_DOCS - urls.length} restantes)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.count}>
            <Text style={{ fontFamily: 'Manrope-Bold', color: colors.onSurface }}>
              {urls.length}
            </Text>{' '}
            / {MAX_DOCS} docs adjuntos
          </Text>
          <TouchableOpacity
            onPress={submit}
            disabled={submitting}
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            activeOpacity={0.85}>
            {submitting && <ActivityIndicator size="small" color="#ffffff" />}
            <Text style={styles.submitBtnText}>Enviar solicitud</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.outlineVariant + '4d',
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: 'Manrope-Bold',
      fontSize: 16,
      color: colors.onSurface,
    },
    subtitle: {
      fontFamily: 'Manrope-Regular',
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 2,
      lineHeight: 18,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropZone: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 24,
      borderRadius: 16,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainerLow,
      gap: 8,
    },
    dropZoneTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 14,
      color: colors.onSurface,
    },
    dropZoneHint: {
      fontFamily: 'Manrope-Regular',
      fontSize: 11,
      color: colors.onSurfaceVariant,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '55',
      borderRadius: 12,
      padding: 8,
    },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: colors.surfaceContainerLow,
    },
    itemTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 13,
      color: colors.onSurface,
    },
    itemPath: {
      fontFamily: 'Manrope-Regular',
      fontSize: 11,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    removeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addMore: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.outlineVariant,
      borderRadius: 12,
    },
    addMoreText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 13,
      color: colors.primary,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: colors.surface,
      borderTopWidth: 0.5,
      borderTopColor: colors.outlineVariant + '4d',
    },
    count: {
      fontFamily: 'Manrope-Regular',
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
    },
    submitBtnText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 14,
      color: '#ffffff',
    },
  });
