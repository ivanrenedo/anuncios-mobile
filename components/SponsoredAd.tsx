import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemedStyles, type ThemeColors } from '@/constants/theme';

const AD = {
  label: 'PATROCINADO',
  title: 'Préstamos Rápidos GEPETROL',
  desc: 'Financiación inmediata para tu negocio o vivienda con las mejores condiciones locales.',
  cta: 'Contactar ahora',
  image:
    'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg?auto=compress&cs=tinysrgb&w=400',
  phone: '+240222000111',
};

export default function SponsoredAd() {
  const styles = useThemedStyles(makeStyles);
  const onContact = () => {
    Linking.openURL(`tel:${AD.phone}`).catch(() => {});
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.92}
      onPress={onContact}
      accessibilityRole="button"
      accessibilityLabel={`Anuncio patrocinado: ${AD.title}`}>
      <View style={styles.header}>
        <Text style={styles.label}>{AD.label}</Text>
      </View>
      <View style={styles.body}>
        <Image source={{ uri: AD.image }} style={styles.image} />
        <View style={styles.textWrap}>
          <Text style={styles.adTitle} numberOfLines={1}>
            {AD.title}
          </Text>
          <Text style={styles.adDesc} numberOfLines={2}>
            {AD.desc}
          </Text>
        </View>
      </View>
      <View style={styles.button}>
        <Text style={styles.buttonText}>{AD.cta}</Text>
        <ChevronRight size={16} color="#ffffff" strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
  image: {
    width: 80,
    height: 80,
    borderRadius: 16,
    flexShrink: 0,
    backgroundColor: colors.surfaceContainerHigh,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  buttonText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: '#ffffff',
  },
});
