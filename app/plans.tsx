import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
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
  MessageCircle
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import RipplePress from '@/components/RipplePress';
import { WHATSAPP_NUMBER } from '@/lib/config';

interface PlanDef {
  key: 'FREE' | 'STAR' | 'PREMIUM';
  label: string;
  price: string;
  period: string;
  accent: string;
  icon: React.ElementType;
  description: string;
  features: { label: string; included: boolean }[];
}

const PLANS: PlanDef[] = [
  {
    key: 'FREE',
    label: 'Gratis',
    price: '0',
    period: '',
    accent: '#6B7280',
    icon: ShoppingBag,
    description: 'Para empezar a vender de forma sencilla',
    features: [
      { label: 'Hasta 5 anuncios activos', included: true },
      { label: 'Hasta 4 fotos por anuncio', included: true },
      { label: 'Perfil público básico', included: true },
      { label: 'Contacto directo con compradores', included: true },
      { label: 'Insignia de vendedor', included: false },
      { label: 'Aparición en escaparate de portada', included: false },
      { label: 'Auto-bump de anuncios', included: false },
      { label: 'Estadísticas de visitas', included: false },
    ],
  },
  {
    key: 'STAR',
    label: 'Estrella',
    price: '3.000',
    period: 'XAF/mes',
    accent: '#F5A623',
    icon: Star,
    description: 'Para vendedores activos que quieren destacar',
    features: [
      { label: 'Hasta 25 anuncios activos', included: true },
      { label: 'Hasta 6 fotos por anuncio', included: true },
      { label: 'Perfil público completo', included: true },
      { label: 'Contacto directo con compradores', included: true },
      { label: 'Insignia ⭐ Estrella', included: true },
      { label: 'Aparición ocasional en portada', included: true },
      { label: '1 auto-bump por semana', included: true },
      { label: 'Estadísticas básicas', included: true },
    ],
  },
  {
    key: 'PREMIUM',
    label: 'Premium',
    price: '10.000',
    period: 'XAF/mes',
    accent: '#7C3AED',
    icon: Crown,
    description: 'Para negocios y vendedores profesionales',
    features: [
      { label: 'Anuncios ilimitados', included: true },
      { label: 'Hasta 10 fotos por anuncio', included: true },
      { label: 'Perfil de negocio', included: true },
      { label: 'Contacto directo con compradores', included: true },
      { label: 'Insignia 👑 Premium', included: true },
      { label: 'Prioridad en escaparate de portada', included: true },
      { label: 'Auto-bump diario', included: true },
      { label: 'Estadísticas completas', included: true },
    ],
  },
];

function contactWhatsApp(plan: string) {
  const msg = encodeURIComponent(
    `Hola, me gustaría contratar el plan ${plan} en Bomelh. ¿Cómo puedo activarlo?`,
  );
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  Linking.openURL(url).catch(() =>
    Alert.alert('Error', 'No se pudo abrir WhatsApp.'),
  );
}

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { profile } = useProfile();
  const currentPlan = profile?.plan ?? 'FREE';
  const effectivePlan = profile?.effectivePlan ?? currentPlan;
  const expiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
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
        {/* Hero */}
        <View style={styles.hero}>
          <Zap size={28} color={colors.primary} strokeWidth={1.5} />
          <Text style={styles.heroTitle}>Haz crecer tu negocio</Text>
          <Text style={styles.heroDesc}>
            Elige el plan que mejor se adapte a ti. Publicar es gratis — los planes te dan
            más visibilidad, más anuncios y herramientas para vender más rápido.
          </Text>
        </View>

        {/* Plan cards */}
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          // A paid plan whose expiry date passed behaves as FREE server-side.
          const isExpired = isCurrent && plan.key !== 'FREE' && effectivePlan === 'FREE';
          const isUpgrade =
            !isCurrent &&
            ((effectivePlan === 'FREE' && plan.key !== 'FREE') ||
              (effectivePlan === 'STAR' && plan.key === 'PREMIUM'));

          return (
            <View
              key={plan.key}
              style={[
                styles.planCard,
                isCurrent && { borderColor: plan.accent + '66', borderWidth: 1.5 },
              ]}>
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
                    fill={plan.key !== 'FREE' ? plan.accent : 'transparent'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planLabel}>{plan.label}</Text>
                  <Text style={styles.planDesc}>{plan.description}</Text>
                </View>
              </View>

              {/* Price */}
              <View style={styles.priceRow}>
                {plan.key === 'FREE' ? (
                  <Text style={styles.priceText}>Gratis</Text>
                ) : (
                  <>
                    <Text style={styles.priceText}>{plan.price}</Text>
                    <Text style={styles.pricePeriod}>{plan.period}</Text>
                  </>
                )}
              </View>

              {/* Features */}
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

              {/* CTA */}
              {isUpgrade && (
                <RipplePress
                  style={[styles.ctaBtn, { backgroundColor: plan.accent }]}
                  borderRadius={12}
                  rippleColor="rgba(255,255,255,0.25)"
                  onPress={() => contactWhatsApp(plan.label)}>
                  <MessageCircle size={16} color="#ffffff" strokeWidth={2} />
                  <Text style={styles.ctaBtnText}>Contratar por WhatsApp</Text>
                </RipplePress>
              )}

              {isExpired && (
                <RipplePress
                  style={[styles.ctaBtn, { backgroundColor: plan.accent }]}
                  borderRadius={12}
                  rippleColor="rgba(255,255,255,0.25)"
                  onPress={() => contactWhatsApp(plan.label)}>
                  <MessageCircle size={16} color="#ffffff" strokeWidth={2} />
                  <Text style={styles.ctaBtnText}>Renovar por WhatsApp</Text>
                </RipplePress>
              )}

              {isCurrent && plan.key !== 'FREE' && (
                <View style={styles.activeInfo}>
                  <Text style={styles.activeInfoText}>
                    {isExpired && expiresAt
                      ? `Expiró el ${fmtDate(expiresAt)} — renuévalo para recuperar tus ventajas`
                      : expiresAt
                        ? `Activo hasta el ${fmtDate(expiresAt)}`
                        : 'Plan activo'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Info section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNum}>
              <Text style={styles.infoStepNumText}>1</Text>
            </View>
            <Text style={styles.infoStepText}>
              Elige tu plan y pulsa "Contratar por WhatsApp"
            </Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNum}>
              <Text style={styles.infoStepNumText}>2</Text>
            </View>
            <Text style={styles.infoStepText}>
              Realiza el pago por transferencia bancaria o pago móvil
            </Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.infoStepNum}>
              <Text style={styles.infoStepNumText}>3</Text>
            </View>
            <Text style={styles.infoStepText}>
              Envíanos el justificante y activamos tu plan en minutos
            </Text>
          </View>
        </View>

        {/* Highlight single ad */}
        <TouchableOpacity
          style={styles.highlightCard}
          activeOpacity={0.8}
          onPress={() => {
            const msg = encodeURIComponent(
              'Hola, quiero destacar un anuncio en Bomelh durante 7 días (1.000 XAF). ¿Cómo procedo?',
            );
            Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`).catch(() =>
              Alert.alert('Error', 'No se pudo abrir WhatsApp.'),
            );
          }}>
          <ArrowUpCircle size={22} color={colors.primary} strokeWidth={1.5} />
          <View style={{ flex: 1 }}>
            <Text style={styles.highlightTitle}>Destacar un anuncio</Text>
            <Text style={styles.highlightDesc}>
              ¿No necesitas un plan? Destaca un anuncio individual por 1.000 XAF durante 7
              días. Aparecerá en las primeras posiciones de su categoría.
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

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
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
      marginBottom: 16,
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
    featureList: {
      gap: 10,
      marginBottom: 16,
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
