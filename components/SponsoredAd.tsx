import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { colors } from '@/constants/theme';

export default function SponsoredAd() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>PATROCINADO</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Building2 size={40} color="#ffffff" strokeWidth={1.5} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.adTitle}>Préstamos Rápidos GEPETROL</Text>
          <Text style={styles.adDesc} numberOfLines={2}>
            Financiación inmediata para tu negocio o vivienda con las mejores condiciones locales.
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button} activeOpacity={0.9}>
        <Text style={styles.buttonText}>Contactar ahora</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 32,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: colors.onSurfaceVariant + '66',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  body: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
  },
  adTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 20,
    marginBottom: 4,
  },
  adDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 16,
  },
  button: {
    marginTop: 16,
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: '#ffffff',
  },
});
