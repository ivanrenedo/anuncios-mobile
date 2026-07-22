import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Check, Flag } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import SwipeableSheet from '@/components/SwipeableSheet';
import Spinner from '@/components/Spinner';
import { useReports, type ReportType } from '@/hooks/useReports';
import { getErrorMessage } from '@/lib/errors';

const REASONS: Record<ReportType, { value: string; label: string }[]> = {
  product: [
    { value: 'spam', label: 'Spam o engañoso' },
    { value: 'scam', label: 'Estafa o fraude' },
    { value: 'prohibited', label: 'Anuncio prohibido o ilegal' },
    { value: 'offensive', label: 'Contenido ofensivo' },
    { value: 'other', label: 'Otro' },
  ],
  user: [
    { value: 'scam', label: 'Estafa o fraude' },
    { value: 'harassment', label: 'Acoso o abuso' },
    { value: 'fake', label: 'Perfil falso o suplantación' },
    { value: 'offensive', label: 'Contenido ofensivo' },
    { value: 'other', label: 'Otro' },
  ],
};

export default function ReportSheet({
  visible,
  onClose,
  type,
  targetId,
}: {
  visible: boolean;
  onClose: () => void;
  type: ReportType;
  targetId: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { createReport, loading } = useReports();
  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (visible) {
      setReason(null);
      setDescription('');
    }
  }, [visible]);

  const submit = async () => {
    if (!reason) {
      Alert.alert('Falta el motivo', 'Selecciona un motivo para continuar.');
      return;
    }
    try {
      await createReport({
        type,
        reason,
        description: description.trim() || undefined,
        ...(type === 'product'
          ? { productId: targetId }
          : { reportedUserId: targetId }),
      });
      onClose();
      Alert.alert(
        'Reporte enviado',
        'Gracias por ayudarnos a mantener Bomell seguro. Nuestro equipo lo revisará.'
      );
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e, 'No se pudo enviar el reporte.'));
    }
  };

  return (
    <SwipeableSheet
      visible={visible}
      onClose={onClose}
      title={type === 'product' ? 'Reportar anuncio' : 'Reportar usuario'}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Motivo</Text>
        {REASONS[type].map((r) => {
          const active = reason === r.value;
          return (
            <TouchableOpacity
              key={r.value}
              style={[styles.option, active && styles.optionActive]}
              activeOpacity={0.7}
              onPress={() => setReason(r.value)}>
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {r.label}
              </Text>
              {active && <Check size={18} color={colors.primary} strokeWidth={2.2} />}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.label, { marginTop: 16 }]}>Detalles (opcional)</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Cuéntanos qué ha pasado…"
          placeholderTextColor={colors.onSurfaceVariant + '88'}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.submit, loading && { opacity: 0.6 }]}
          activeOpacity={0.88}
          disabled={loading}
          onPress={submit}>
          {loading ? (
            <Spinner color="#ffffff" />
          ) : (
            <>
              <Flag size={18} color="#ffffff" strokeWidth={2} />
              <Text style={styles.submitText}>Enviar reporte</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 12 }} />
      </ScrollView>
    </SwipeableSheet>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    label: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginBottom: 8,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '4d',
      backgroundColor: colors.surfaceContainerLow,
      marginBottom: 8,
    },
    optionActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '12',
    },
    optionText: {
      fontFamily: 'Manrope-Regular',
      fontSize: 15,
      color: colors.onSurface,
    },
    optionTextActive: {
      fontFamily: 'Manrope-SemiBold',
      color: colors.primary,
    },
    input: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '4d',
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10,
      minHeight: 90,
      textAlignVertical: 'top',
      fontFamily: 'Manrope-Regular',
      fontSize: 15,
      color: colors.onSurface,
    },
    submit: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 52,
      borderRadius: 14,
      backgroundColor: colors.error,
      marginTop: 18,
    },
    submitText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 16,
      color: '#ffffff',
    },
  });
