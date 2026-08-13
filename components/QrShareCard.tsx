import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Share,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Copy, Crown, Share2, Star, Image as ImageIcon } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { getQrProfileUrl } from '@/lib/config';

interface Props {
  sellerId: string;
  name: string;
  phone?: string;
  email?: string;
  effectivePlan: string;
  qrShowPhone: boolean;
  qrShowEmail: boolean;
  compact?: boolean;
}

/**
 * v2 (Fase QR) — printable QR card for the seller's own private tab.
 *
 * Only rendered by the profile screen when the caller is on an active
 * STAR/PREMIUM plan. The QR encodes the public profile URL with `?src=qr`,
 * which the public profile picks up and reports so the seller can see stats.
 * Contact rows (phone/email) are opt-in — off by default so a shared image
 * never leaks contact info without the seller's explicit consent.
 */
export default function QrShareCard({
  sellerId,
  name,
  phone,
  email,
  effectivePlan,
  qrShowPhone,
  qrShowEmail,
  compact = false,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { update } = useProfile();

  const url = useMemo(() => getQrProfileUrl(sellerId), [sellerId]);
  const shotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

/*   const { data } = useQuery<any>(MY_SELLER_QR_STATS, {
    fetchPolicy: 'cache-and-network',
  });
  const monthlyScans: number = data?.mySellerQrStats?.thisMonth ?? 0; */

  const planLabel = effectivePlan === 'PREMIUM' ? 'Premium' : effectivePlan === 'STAR' ? 'Star' : null;

  // Optimistic mirror of the props. The Switch reads from this local state so
  // a tap flips it *immediately* — otherwise the server round-trip through
  // useProfile.update makes the toggle visibly bounce back before Apollo
  // resolves. Whenever the props change (fresh ME response, another tab
  // updated it, network settled), we resync.
  const [phoneOn, setPhoneOn] = useState(qrShowPhone);
  const [emailOn, setEmailOn] = useState(qrShowEmail);
  useEffect(() => setPhoneOn(qrShowPhone), [qrShowPhone]);
  useEffect(() => setEmailOn(qrShowEmail), [qrShowEmail]);

  const showPhoneRow = phoneOn && !!phone;
  const showEmailRow = emailOn && !!email;

  const copyLink = async () => {
    try {
      await Clipboard.setStringAsync(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // No-op: the URL text is always visible under the QR.
    }
  };

  const shareLink = async () => {
    try {
      await Share.share({ message: `${name} en Bomelh: ${url}`, url });
    } catch {
      // User cancelled.
    }
  };

  const shareCardImage = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await shotRef.current?.capture?.();
      if (!uri) return;
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartir tarjeta QR',
        });
      } else {
        Alert.alert('No se puede compartir', 'Este dispositivo no soporta compartir imagen.');
      }
    } catch {
      Alert.alert('Error', 'No se pudo generar la tarjeta.');
    } finally {
      setSharing(false);
    }
  };

  const setPref = async (key: 'qr_show_phone' | 'qr_show_email', value: boolean) => {
    // Optimistic: flip the local state first so the Switch and card preview
    // respond to the tap without waiting for the server. Revert on failure.
    if (key === 'qr_show_phone') setPhoneOn(value);
    else setEmailOn(value);
    const res = await update({ [key]: value } as any);
    if (!res.ok) {
      if (key === 'qr_show_phone') setPhoneOn(!value);
      else setEmailOn(!value);
      Alert.alert('No se pudo guardar', res.error ?? 'Intenta de nuevo.');
    }
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tu tarjeta QR</Text>
        <Text style={styles.subtitle}>
          Comparte, descarga o imprime este QR — los escaneos suman a tus estadísticas.
        </Text>
      </View>

      <ViewShot ref={shotRef} options={{ format: 'png', quality: 0.98 }} style={styles.card}>
        <Text style={styles.brand}>Bomelh.</Text>
        <Text style={styles.name}>{name}</Text>
        {planLabel && (
          <View style={[styles.pill, planLabel === 'Premium' ? styles.pillPremium : styles.pillStar]}>
            {planLabel === 'Premium' ? (
              <Crown size={11} color={colors.onSurface} strokeWidth={2} />
            ) : (
              <Star size={11} color={colors.onSurface} strokeWidth={0} fill={colors.onSurface} />
            )}
            <Text style={styles.pillText}>{planLabel}</Text>
          </View>
        )}
        <View style={styles.qrWrap}>
          <QRCode 
            value={url}  
            size={200} 
            logo={require('../assets/images/icon.png')}
          />
        </View>
        {showPhoneRow && <Text style={styles.contact}>{phone}</Text>}
        {showEmailRow && <Text style={styles.contact}>{email}</Text>}
      </ViewShot>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={shareLink}>
          <Share2 size={15} color={colors.onPrimary} strokeWidth={2} />
          <Text style={styles.primaryBtnText}>Compartir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.85}
          onPress={shareCardImage}
          disabled={sharing}>
          <ImageIcon size={15} color={colors.onSurface} strokeWidth={2} />
          <Text style={styles.secondaryBtnText}>Compartir imagen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85} onPress={copyLink}>
          <Copy size={15} color={colors.onSurface} strokeWidth={2} />
          <Text style={styles.secondaryBtnText}>{copied ? 'Copiado' : 'Copiar enlace'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.togglesBox}>
        <Text style={styles.togglesTitle}>Datos en tu tarjeta</Text>
        <ToggleRow
          label="Mostrar teléfono"
          description={phone ? 'Aparecerá bajo el QR' : 'Añade un teléfono a tu perfil'}
          value={phoneOn}
          disabled={!phone}
          onChange={(v) => setPref('qr_show_phone', v)}
        />
        <ToggleRow
          label="Mostrar email"
          description={email ? 'Aparecerá bajo el QR' : 'Añade un email a tu perfil'}
          value={emailOn}
          disabled={!email}
          onChange={(v) => setPref('qr_show_email', v)}
        />
      </View>

      {/* <Text style={styles.stat}>
        {monthlyScans.toLocaleString('es-ES')} visita{monthlyScans === 1 ? '' : 's'} desde tu QR este mes
      </Text> */}
    </View>
  );
}

function ToggleRow({
  label,
  description,
  value,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  // On Android the Switch tint colors control both track states; iOS only
  // reads `trackColor.true` for ON (the OFF track color is the OS default and
  // is set via `ios_backgroundColor`). Setting both makes the ON/OFF states
  // legible in light and dark themes on both platforms.
  const trackOn = colors.primary;
  const trackOff = Platform.OS === 'android' ? colors.outlineVariant : undefined;
  const thumb =
    Platform.OS === 'android' ? (value ? colors.onPrimary : colors.surface) : undefined;

  return (
    <Pressable
      onPress={() => {
        if (!disabled) onChange(!value);
      }}
      android_ripple={disabled ? undefined : { color: colors.outlineVariant }}
      style={({ pressed }) => [
        styles.toggleRow,
        disabled && styles.toggleRowDisabled,
        pressed && !disabled && styles.toggleRowPressed,
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={label}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: trackOff as any, true: trackOn }}
        thumbColor={thumb}
        ios_backgroundColor={colors.outlineVariant}
      />
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      marginHorizontal: 12,
      marginBottom: 16,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    wrapCompact: {
      marginHorizontal: 0,
      marginBottom: 0,
    },
    header: {
      marginBottom: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: colors.primary,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    card: {
      alignSelf: 'center',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      gap: 4,
      minWidth: 260,
    },
    brand: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.3,
    },
    name: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 999,
      marginBottom: 4,
    },
    pillPremium: { backgroundColor: '#7C3AED' },
    pillStar: { backgroundColor: '#F5A623' }, 
    pillText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#ffffff',
    },
    qrWrap: {
      padding: 8,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      marginTop: 4,
    },
    contact: {
      fontSize: 13,
      color: '#374151',
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 14,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    primaryBtnText: {
      color: colors.onPrimary,
      fontWeight: '800',
      fontSize: 13,
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    secondaryBtnText: {
      color: colors.onSurface,
      fontWeight: '700',
      fontSize: 13,
    },
    togglesBox: {
      marginTop: 14,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    togglesTitle: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: colors.onSurfaceVariant,
      marginBottom: 6,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 8,
    },
    toggleRowDisabled: { opacity: 0.6 },
    toggleRowPressed: { backgroundColor: colors.surfaceContainer },
    toggleLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
    },
    toggleDesc: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    stat: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: '700',
      color: colors.onSurface,
    },
  });
