import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import RipplePress from '@/components/RipplePress';
import BrandLogo from '@/components/BrandLogo';
import Spinner from '@/components/Spinner';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      if (router.canGoBack()) router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <RipplePress
          style={styles.backBtn}
          borderRadius={20}
          rippleColor={colors.primary + '18'}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
          <ArrowLeft size={22} color={colors.onSurface} strokeWidth={1.8} />
        </RipplePress>
      </View>

      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <BrandLogo size={92} showWordmark={false} />
        </View>

        <Text style={styles.title}>
          Bienvenido a bomelh<Text style={{ color: colors.primary }}>.</Text>
        </Text>
        <Text style={styles.subtitle}>
          Compra y vende entre particulares en Guinea Ecuatorial de forma segura y sencilla.
        </Text>

        <View style={styles.features}>
          {[
            'Publica anuncios gratis y sin comisiones',
            'Conecta con compradores y vendedores',
            'Comunidad activa',
          ].map((text) => (
            <View key={text} style={styles.featureRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <RipplePress
          style={styles.googleBtn}
          borderRadius={14}
          rippleColor="rgba(255,255,255,0.25)"
          onPress={loading ? undefined : handleGoogleSignIn}>
          {loading ? (
            <Spinner color="#ffffff" />
          ) : (
            <>
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleBtnText}>Iniciar sesión con Google</Text>
            </>
          )}
        </RipplePress>

        <Text style={styles.terms}>
          Al continuar, aceptas nuestros Términos de servicio y Política de privacidad.
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    topBar: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    logoWrap: {
      marginBottom: 28,
    },
    title: {
      fontFamily: 'Manrope-Bold',
      fontSize: 26,
      color: colors.onSurface,
      letterSpacing: -0.5,
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontFamily: 'Manrope-Regular',
      fontSize: 15,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 300,
      marginBottom: 32,
    },
    features: {
      gap: 14,
      alignSelf: 'stretch',
      paddingHorizontal: 8,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    featureDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    featureText: {
      fontFamily: 'Manrope-Regular',
      fontSize: 15,
      color: colors.onSurface,
    },
    bottom: {
      paddingHorizontal: 24,
      gap: 16,
    },
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      height: 54,
      borderRadius: 14,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
    googleIcon: {
      width: 22,
      height: 22,
      borderRadius: 4,
      backgroundColor: '#ffffff',
    },
    googleBtnText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 16,
      color: '#ffffff',
    },
    terms: {
      fontFamily: 'Manrope-Regular',
      fontSize: 12,
      color: colors.onSurfaceVariant + '99',
      textAlign: 'center',
      lineHeight: 18,
    },
  });
