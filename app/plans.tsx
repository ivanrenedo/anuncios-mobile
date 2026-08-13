import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Star,
  Crown,
  Check,
  X,
  Zap,
  ArrowUpCircle,
  ShoppingBag,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import RipplePress from '@/components/RipplePress';
import { useBusinessContact } from '@/hooks/useBusinessContact';

type PlanKey = 'FREE' | 'BASIC' | 'STAR' | 'PREMIUM';

interface PlanDef {
  key: PlanKey;
  label: string;
  /** XAF/mes. 0 for FREE. */
  monthlyPrice: number;
  accent: string;
  icon: React.ElementType;
  description: string;
  features: { label: string; included: boolean }[];
}

// v2 catalogue — mismos precios y features que el shop web para que la
// comparación sea idéntica en cualquier device del usuario.
const PLANS: PlanDef[] = [
  {
    key: 'FREE',
    label: 'Gratis',
    monthlyPrice: 0,
    accent: '#6B7280',
    icon: ShoppingBag,
    description: 'Para empezar a vender sin coste',
    features: [
      { label: 'Hasta 5 anuncios activos', included: true },
      { label: 'Hasta 4 fotos por anuncio', included: true },
      { label: 'Contacto directo con compradores', included: true },
      { label: 'Seguir vendedores + notificaciones', included: true },
      { label: 'Insignia de plan', included: false },
      { label: 'Destacados incluidos', included: false },
      { label: 'Auto-bump', included: false },
      { label: 'Estadísticas', included: false },
    ],
  },
  {
    key: 'BASIC',
    label: 'Básico',
    monthlyPrice: 3_000,
    accent: '#0EA5E9',
    icon: ShieldCheck,
    description: 'Sube el límite y consigue tu primer destacado',
    features: [
      { label: 'Hasta 15 anuncios activos', included: true },
      { label: 'Hasta 4 fotos por anuncio', included: true },
      { label: '1 destacado incluido al mes', included: true },
      { label: 'Vistas + favoritos', included: true },
      { label: 'Insignia de plan', included: false },
      { label: 'Anuncios fijados en perfil', included: false },
      { label: 'Auto-bump', included: false },
      { label: 'Chip "Rebajado hoy"', included: false },
    ],
  },
  {
    key: 'STAR',
    label: 'Estrella',
    monthlyPrice: 12_000,
    accent: '#F5A623',
    icon: Star,
    description: 'Para vendedores activos que quieren destacar',
    features: [
      { label: 'Hasta 30 anuncios activos', included: true },
      { label: 'Hasta 6 fotos por anuncio', included: true },
      { label: '3 destacados incluidos al mes', included: true },
      { label: '4 anuncios fijados en tu perfil', included: true },
      { label: 'Auto-bump semanal (pool 3)', included: true },
      { label: 'Chip "Rebajado hoy" 48 h', included: true },
      { label: 'WhatsApp personalizado + contactos', included: true },
      {label: 'Tarjeta QR imprimible', included: true},
      { label: 'Insignia ⭐', included: true },
    ],
  },
  {
    key: 'PREMIUM',
    label: 'Premium',
    monthlyPrice: 35_000,
    accent: '#7C3AED',
    icon: Crown,
    description: 'Para negocios verificados con tienda propia',
    features: [
      { label: 'Hasta 100 anuncios activos', included: true },
      { label: '8 destacados incluidos al mes (−50 % extra)', included: true },
      { label: '10 anuncios fijados en tu perfil', included: true },
      { label: 'Auto-bump diario (pool 5)', included: true },
      { label: 'Perfil Premium con tienda integrada', included: true },
      { label: 'Carrusel "Tiendas Premium" en portada', included: true },
      { label: 'Sin anuncios de terceros en tu ficha', included: true },
      {label: 'Tarjeta QR imprimible', included: true},
      { label: 'Verificación 👑 + analytics completo', included: true },
    ],
  },
];

const YEARLY_DISCOUNT = 0.25;

function fmtXaf(n: number): string {
  // Intl.NumberFormat funciona en RN moderno (Hermes + expo).
  return new Intl.NumberFormat('es-ES').format(n);
}

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { profile } = useProfile();
  const { phone: whatsappNumber } = useBusinessContact();
  const [cycle, setCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const contactWhatsApp = (planLabel: string) => {
    const cycleLabel = cycle === 'YEARLY' ? 'anual' : 'mensual';
    const msg = encodeURIComponent(
      `Hola, quiero contratar el plan ${planLabel} (${cycleLabel}) en Bomelh. ¿Cómo lo activo?`,
    );
    Linking.openURL(`https://wa.me/${whatsappNumber}?text=${msg}`).catch(() =>
      Alert.alert('Error', 'No se pudo abrir WhatsApp.'),
    );
  };

  const currentPlan = profile?.plan ?? 'FREE';
  const effectivePlan = profile?.effectivePlan ?? currentPlan;
  const expiresAt = profile?.plan_expires_at
    ? new Date(profile.plan_expires_at)
    : null;
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <RipplePress
          style={styles.backBtn}
          borderRadius={18}
          rippleColor={colors.primary + '18'}
          onPress={() => router.back()}>
          <ChevronLeft size={22} color={colors.onSurface} strokeWidth={1.8} />
        </RipplePress>
        <Text style={styles.headerTitle}>Planes y precios</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        <View style={styles.hero}>
          <Zap size={28} color={colors.primary} strokeWidth={1.5} />
          <Text style={styles.heroTitle}>Haz crecer tu negocio</Text>
          <Text style={styles.heroDesc}>
            Elige el plan que mejor se adapte. Publicar es gratis — los planes te
            dan más anuncios, más visibilidad y ventajas exclusivas.
          </Text>
        </View>

        {/* Monthly / yearly toggle. Yearly aplica −25 % (misma escala que el
            backend en DISCOUNT_TIERS para que la conversación WA coincida
            con lo que ve el usuario). */}
        <View style={styles.toggleWrap}>
          <View style={styles.toggleTrack}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: cycle === 'MONTHLY' }}
              onPress={() => setCycle('MONTHLY')}
              style={[
                styles.toggleBtn,
                cycle === 'MONTHLY' && { backgroundColor: colors.primary },
              ]}>
              <Text
                style={[
                  styles.toggleBtnText,
                  cycle === 'MONTHLY' && { color: colors.onPrimary },
                ]}>
                Mensual
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: cycle === 'YEARLY' }}
              onPress={() => setCycle('YEARLY')}
              style={[
                styles.toggleBtn,
                cycle === 'YEARLY' && { backgroundColor: colors.primary },
              ]}>
              <Text
                style={[
                  styles.toggleBtnText,
                  cycle === 'YEARLY' && { color: colors.onPrimary },
                ]}>
                Anual
              </Text>
              <View
                style={[
                  styles.toggleBadge,
                  cycle === 'YEARLY'
                    ? { backgroundColor: 'rgba(255,255,255,0.28)' }
                    : { backgroundColor: '#10B981' + '20' },
                ]}>
                <Text
                  style={[
                    styles.toggleBadgeText,
                    { color: cycle === 'YEARLY' ? '#ffffff' : '#10B981' },
                  ]}>
                  −25 %
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isExpired =
            isCurrent && plan.key !== 'FREE' && effectivePlan === 'FREE';
          const isUpgrade =
            !isCurrent &&
            plan.key !== 'FREE' &&
            planRank(plan.key) > planRank(effectivePlan);

          const yearlyPrice = Math.round(
            plan.monthlyPrice * 12 * (1 - YEARLY_DISCOUNT),
          );
          const displayed = cycle === 'YEARLY' ? yearlyPrice : plan.monthlyPrice;
          const suffix =
            plan.monthlyPrice === 0
              ? ''
              : cycle === 'YEARLY'
                ? 'XAF/año'
                : 'XAF/mes';
          const highlight = plan.key === 'PREMIUM';

          return (
            <View
              key={plan.key}
              style={[
                styles.planCard,
                highlight && { borderColor: colors.primary + '55', borderWidth: 1.5 },
                isCurrent && { borderColor: plan.accent + '66', borderWidth: 1.5 },
              ]}>
              {highlight && (
                <View
                  style={[
                    styles.recommendedBadge,
                    { backgroundColor: colors.primary },
                  ]}>
                  <Text
                    style={[styles.recommendedText, { color: colors.onPrimary }]}>
                    Recomendado
                  </Text>
                </View>
              )}

              {isCurrent && (
                <View
                  style={[
                    styles.currentBadge,
                    { backgroundColor: (isExpired ? colors.error : plan.accent) + '18' },
                  ]}>
                  <Text
                    style={[
                      styles.currentBadgeText,
                      { color: isExpired ? colors.error : plan.accent },
                    ]}>
                    {isExpired ? 'Plan expirado' : 'Tu plan actual'}
                  </Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={[styles.planIconWrap, { backgroundColor: plan.accent + '18' }]}>
                  <plan.icon
                    size={22}
                    color={plan.accent}
                    strokeWidth={1.8}
                    fill={plan.key === 'PREMIUM' ? plan.accent : 'transparent'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planLabel}>{plan.label}</Text>
                  <Text style={styles.planDesc}>{plan.description}</Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                {plan.monthlyPrice === 0 ? (
                  <Text style={styles.priceText}>Gratis</Text>
                ) : (
                  <>
                    <Text style={styles.priceText}>{fmtXaf(displayed)}</Text>
                    <Text style={styles.pricePeriod}>{suffix}</Text>
                  </>
                )}
              </View>
              {plan.monthlyPrice > 0 && cycle === 'YEARLY' && (
                <Text style={styles.yearlyEquiv}>
                  Equivale a{' '}
                  <Text style={{ fontFamily: 'Manrope-Bold' }}>
                    {fmtXaf(Math.round(yearlyPrice / 12))} XAF/mes
                  </Text>
                  .
                </Text>
              )}

              <View style={styles.featureList}>
                {plan.features.map((f) => (
                  <View key={f.label} style={styles.featureRow}>
                    {f.included ? (
                      <View style={[styles.featureIcon, { backgroundColor: '#10B981' + '18' }]}>
                        <Check size={12} color="#10B981" strokeWidth={2.5} />
                      </View>
                    ) : (
                      <View style={[styles.featureIcon, { backgroundColor: colors.outlineVariant + '22' }]}>
                        <X size={12} color={colors.outlineVariant} strokeWidth={2} />
                      </View>
                    )}
                    <Text
                      style={[
                        styles.featureLabel,
                        !f.included && { color: colors.outlineVariant },
                      ]}>
                      {f.label}
                    </Text>
                  </View>
                ))}
              </View>

              {(isUpgrade || isExpired) && (
                <RipplePress
                  style={[styles.ctaBtn, { backgroundColor: plan.accent }]}
                  borderRadius={12}
                  rippleColor="rgba(255,255,255,0.25)"
                  onPress={() => contactWhatsApp(plan.label)}>
                  <MessageCircle size={16} color="#ffffff" strokeWidth={2} />
                  <Text style={styles.ctaBtnText}>
                    {isExpired ? 'Renovar por WhatsApp' : 'Contratar por WhatsApp'}
                  </Text>
                </RipplePress>
              )}

              {isCurrent && plan.key !== 'FREE' && (
                <View style={styles.activeInfo}>
                  <Text style={styles.activeInfoText}>
                    {isExpired && expiresAt
                      ? `Expiró el ${fmtDate(expiresAt)}`
                      : expiresAt
                        ? `Activo hasta el ${fmtDate(expiresAt)}`
                        : 'Plan activo'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
          {[
            'Elige tu plan y pulsa "Contratar por WhatsApp"',
            'Realiza el pago por transferencia bancaria o pago móvil',
            'Envíanos el justificante y activamos tu plan en minutos',
          ].map((text, i) => (
            <View style={styles.infoStep} key={i}>
              <View style={styles.infoStepNum}>
                <Text style={styles.infoStepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.infoStepText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Individual boost purchase — copy con las 3 duraciones v2. */}
        <TouchableOpacity
          style={styles.highlightCard}
          activeOpacity={0.8}
          onPress={() => {
            const msg = encodeURIComponent(
              'Hola, quiero destacar un anuncio en Bomelh. ¿Cómo procedo?',
            );
            Linking.openURL(`https://wa.me/${whatsappNumber}?text=${msg}`).catch(() =>
              Alert.alert('Error', 'No se pudo abrir WhatsApp.'),
            );
          }}>
          <ArrowUpCircle size={22} color={colors.primary} strokeWidth={1.5} />
          <View style={{ flex: 1 }}>
            <Text style={styles.highlightTitle}>Destacar un anuncio suelto</Text>
            <Text style={styles.highlightDesc}>
              ¿No quieres un plan todavía? Destaca un anuncio: 1.000 XAF por 3
              días, 2.000 XAF por 7 días o 5.000 XAF por 30 días.
            </Text>
            <View style={styles.highlightCta}>
              <MessageCircle size={13} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.highlightCtaText, { color: colors.primary }]}>
                Solicitar por WhatsApp
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function planRank(plan: string): number {
  return ({ FREE: 0, BASIC: 1, STAR: 2, PREMIUM: 3 } as Record<string, number>)[plan] ?? 0;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.outlineVariant + '4d',
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 17,
      color: colors.onSurface,
      letterSpacing: -0.3,
    },
    hero: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 24,
      paddingHorizontal: 8,
    },
    heroTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 24,
      color: colors.onSurface,
      letterSpacing: -0.4,
      textAlign: 'center',
    },
    heroDesc: {
      fontFamily: 'Manrope-Regular',
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 21,
      maxWidth: 320,
    },
    toggleWrap: { alignItems: 'center', marginBottom: 16 },
    toggleTrack: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 999,
      padding: 4,
    },
    toggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
    },
    toggleBtnText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    toggleBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 999,
    },
    toggleBadgeText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 10,
    },
    planCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
      position: 'relative',
    },
    recommendedBadge: {
      position: 'absolute',
      top: -12,
      right: 16,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    recommendedText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    currentBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      marginBottom: 12,
    },
    currentBadgeText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 16,
    },
    planIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    planLabel: {
      fontFamily: 'Manrope-Bold',
      fontSize: 20,
      color: colors.onSurface,
      letterSpacing: -0.3,
    },
    planDesc: {
      fontFamily: 'Manrope-Regular',
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
      marginBottom: 4,
    },
    priceText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 28,
      color: colors.onSurface,
      letterSpacing: -0.5,
    },
    pricePeriod: {
      fontFamily: 'Manrope-Regular',
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    yearlyEquiv: {
      fontFamily: 'Manrope-Regular',
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginBottom: 12,
    },
    featureList: {
      gap: 10,
      marginBottom: 16,
      marginTop: 12,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    featureIcon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureLabel: {
      fontFamily: 'Manrope-Regular',
      fontSize: 14,
      color: colors.onSurface,
      flex: 1,
    },
    ctaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 4,
    },
    ctaBtnText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 15,
      color: '#ffffff',
    },
    activeInfo: {
      alignItems: 'center',
      paddingTop: 4,
    },
    activeInfoText: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    infoCard: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      gap: 14,
    },
    infoTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 17,
      color: colors.onSurface,
      letterSpacing: -0.2,
    },
    infoStep: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoStepNum: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoStepNumText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 13,
      color: colors.primary,
    },
    infoStepText: {
      fontFamily: 'Manrope-Regular',
      fontSize: 14,
      color: colors.onSurface,
      flex: 1,
      lineHeight: 20,
    },
    highlightCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      backgroundColor: colors.primary + '08',
      borderRadius: 16,
      padding: 18,
      borderWidth: 0.5,
      borderColor: colors.primary + '22',
    },
    highlightTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 15,
      color: colors.onSurface,
      marginBottom: 4,
    },
    highlightDesc: {
      fontFamily: 'Manrope-Regular',
      fontSize: 13,
      color: colors.onSurfaceVariant,
      lineHeight: 19,
    },
    highlightCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    highlightCtaText: {
      fontFamily: 'Manrope-Bold',
      fontSize: 13,
    },
  });
