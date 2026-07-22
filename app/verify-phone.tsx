import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, ShieldCheck } from 'lucide-react-native';
import { useMutation } from '@apollo/client/react';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { SEND_PHONE_OTP, VERIFY_PHONE_OTP } from '@/graphql/mutations';
import { ME } from '@/graphql/queries';
import { apolloClient } from '@/lib/apollo';
import { getErrorMessage } from '@/lib/errors';
import RipplePress from '@/components/RipplePress';
import Spinner from '@/components/Spinner';

export default function VerifyPhoneScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const codeInputRef = useRef<TextInput>(null);

  const [sendOtp, { loading: sendingOtp }] = useMutation(SEND_PHONE_OTP);
  const [verifyOtp, { loading: verifyingOtp }] = useMutation(VERIFY_PHONE_OTP);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const fullPhone = `+240${phone.replace(/\s/g, '')}`;

  const handleSendCode = async () => {
    setError('');
    if (phone.replace(/\s/g, '').length < 6) {
      setError('Ingresa un número de teléfono válido');
      return;
    }
    try {
      await sendOtp({ variables: { input: { phone: fullPhone } } });
      setStep('code');
      setResendTimer(60);
      setTimeout(() => codeInputRef.current?.focus(), 300);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo enviar el código'));
    }
  };

  const handleVerifyCode = async () => {
    setError('');
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }
    try {
      await verifyOtp({ variables: { input: { code } } });
      const { data }: any = await apolloClient.query({
        query: ME,
        fetchPolicy: 'network-only',
      });
      if (data?.me) {
        useAuthStore.setState({
          user: {
            ...useAuthStore.getState().user!,
            phone: data.me.phone,
            verified: data.me.verified,
          },
        });
      }
      router.replace('/(tabs)');
    } catch (err) {
      setError(getErrorMessage(err, 'Código incorrecto'));
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setCode('');
    try {
      await sendOtp({ variables: { input: { phone: fullPhone } } });
      setResendTimer(60);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo reenviar el código'));
    }
  };

  const loading = sendingOtp || verifyingOtp;

  return (
    <KeyboardAwareScrollView
      style={[styles.root, { paddingTop: insets.top + 20 }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={Platform.OS === 'ios' ? 40 : 80}
      enableOnAndroid>
        <View style={styles.iconWrap}>
          {step === 'phone' ? (
            <Phone size={44} color={colors.primary} strokeWidth={1.3} />
          ) : (
            <ShieldCheck size={44} color={colors.primary} strokeWidth={1.3} />
          )}
        </View>

        {step === 'phone' ? (
          <>
            <Text style={styles.title}>Verifica tu teléfono</Text>
            <Text style={styles.subtitle}>
              Para usar Bomell necesitas verificar tu número de teléfono.
            </Text>

            <View style={styles.phoneRow}>
              <View style={styles.prefixBox}>
                <Text style={styles.prefixText}>+240</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Número de teléfono"
                placeholderTextColor={colors.onSurfaceVariant + '80'}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
                maxLength={12}
              />
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <RipplePress
              style={styles.btn}
              borderRadius={14}
              rippleColor="rgba(255,255,255,0.25)"
              onPress={loading ? undefined : handleSendCode}>
              {loading ? (
                <Spinner color="#ffffff" />
              ) : (
                <Text style={styles.btnText}>Enviar código</Text>
              )}
            </RipplePress>
          </>
        ) : (
          <>
            <Text style={styles.title}>Introduce el código</Text>
            <Text style={styles.subtitle}>
              Hemos enviado un SMS al {fullPhone}
            </Text>

            <TextInput
              ref={codeInputRef}
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor={colors.onSurfaceVariant + '40'}
              keyboardType="number-pad"
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              editable={!loading}
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <RipplePress
              style={styles.btn}
              borderRadius={14}
              rippleColor="rgba(255,255,255,0.25)"
              onPress={loading ? undefined : handleVerifyCode}>
              {loading ? (
                <Spinner color="#ffffff" />
              ) : (
                <Text style={styles.btnText}>Verificar</Text>
              )}
            </RipplePress>

            <RipplePress
              style={styles.resendBtn}
              borderRadius={8}
              rippleColor={colors.primary + '18'}
              onPress={resendTimer > 0 || loading ? undefined : handleResend}>
              <Text
                style={[
                  styles.resendText,
                  resendTimer > 0 && { opacity: 0.5 },
                ]}>
                {resendTimer > 0
                  ? `Reenviar código (${resendTimer}s)`
                  : 'Reenviar código'}
              </Text>
            </RipplePress>

            <RipplePress
              style={styles.resendBtn}
              borderRadius={8}
              rippleColor={colors.primary + '18'}
              onPress={() => {
                setStep('phone');
                setCode('');
                setError('');
              }}>
              <Text style={styles.resendText}>Cambiar número</Text>
            </RipplePress>
          </>
        )}
    </KeyboardAwareScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      flex: 1,
      paddingHorizontal: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconWrap: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary + '0f',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.primary + '18',
      marginBottom: 28,
    },
    title: {
      fontFamily: 'Manrope-Bold',
      fontSize: 24,
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
    phoneRow: {
      flexDirection: 'row',
      alignSelf: 'stretch',
      gap: 10,
      marginBottom: 16,
    },
    prefixBox: {
      height: 52,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: colors.outlineVariant + '50',
      alignItems: 'center',
      justifyContent: 'center',
    },
    prefixText: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 16,
      color: colors.onSurface,
    },
    phoneInput: {
      flex: 1,
      height: 52,
      borderRadius: 14,
      backgroundColor: colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: colors.outlineVariant + '50',
      paddingHorizontal: 16,
      fontFamily: 'Manrope-Regular',
      fontSize: 16,
      color: colors.onSurface,
    },
    codeInput: {
      alignSelf: 'stretch',
      height: 60,
      borderRadius: 14,
      backgroundColor: colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: colors.outlineVariant + '50',
      paddingHorizontal: 20,
      fontFamily: 'Manrope-Bold',
      fontSize: 28,
      color: colors.onSurface,
      textAlign: 'center',
      letterSpacing: 12,
      marginBottom: 16,
    },
    error: {
      fontFamily: 'Manrope-Regular',
      fontSize: 13,
      color: colors.error,
      textAlign: 'center',
      marginBottom: 12,
    },
    btn: {
      alignSelf: 'stretch',
      height: 54,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
    btnText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 16,
      color: '#ffffff',
    },
    resendBtn: {
      marginTop: 16,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    resendText: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 14,
      color: colors.primary,
    },
  });
