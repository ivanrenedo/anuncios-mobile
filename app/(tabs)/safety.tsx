import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Shield, AlertTriangle, Phone, ChevronRight, Lock, Flag } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

const items = [
  { icon: Lock, label: 'Verificación de identidad', desc: 'Confirma quién eres' },
  { icon: AlertTriangle, label: 'Reportar un anuncio', desc: 'Ayúdanos a mantener la calidad' },
  { icon: Flag, label: 'Reportar un usuario', desc: 'Comportamientos sospechosos' },
  { icon: Phone, label: 'Contactar soporte', desc: 'Estamos aquí para ayudarte' },
];

export default function SafetyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Seguridad</Text>

      <View style={styles.banner}>
        <Shield size={40} color={colors.primary} strokeWidth={1.5} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Compra y vende con confianza</Text>
          <Text style={styles.bannerDesc}>
            Market EG protege tus transacciones y tu privacidad en todo momento.
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {items.map(({ icon: Icon, label, desc }) => (
          <TouchableOpacity key={label} style={styles.row} activeOpacity={0.8}>
            <View style={styles.iconWrap}>
              <Icon size={22} color={colors.primary} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowDesc}>{desc}</Text>
            </View>
            <ChevronRight size={18} color={colors.outlineVariant} strokeWidth={1.5} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 24,
  },
  pageTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 28,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  banner: {
    backgroundColor: colors.primaryContainer + '22',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.primary + '33',
  },
  bannerTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 20,
    marginBottom: 4,
  },
  bannerDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryContainer + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 20,
  },
  rowDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
});
