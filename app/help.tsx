import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronDown,
  ShoppingBag,
  Tag,
  User,
  Shield,
  MessageCircle,
  Truck,
  Wallet,
} from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';
import { EMAIL, WHATSAPP_NUMBER } from '@/lib/config';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  title: string;
  icon: React.ElementType;
  color: string;
  items: FaqItem[];
}

const FAQ_DATA: ((c: ThemeColors) => FaqSection)[] = [
  (c) => ({
    title: 'Comprar',
    icon: ShoppingBag,
    color: c.primary,
    items: [
      {
        q: '¿Cómo contacto a un vendedor?',
        a: 'Desde el detalle del producto, pulsa en el nombre del vendedor para ver su perfil. Allí encontrarás su teléfono o email si los tiene visibles. También puedes contactarle por WhatsApp directamente.',
      },
      {
        q: '¿Los pagos se hacen dentro de la app?',
        a: 'No. Bomell es una plataforma de anuncios. Los pagos se acuerdan directamente entre comprador y vendedor. Te recomendamos usar métodos seguros y, si es posible, realizar el intercambio en persona.',
      },
      {
        q: '¿Cómo sé si un vendedor es de confianza?',
        a: 'Revisa su perfil: la insignia de verificado indica que ha confirmado su identidad. También puedes consultar sus valoraciones, el número de seguidores y cuánto tiempo lleva en la plataforma.',
      },
    ],
  }),
  (c) => ({
    title: 'Vender',
    icon: Tag,
    color: c.tertiary,
    items: [
      {
        q: '¿Cómo publico un anuncio?',
        a: 'Ve a la pestaña "Publicar", elige el tipo de anuncio (marketplace, vehículos, inmobiliaria, servicios o empleo), rellena los campos y añade hasta 4 fotos. Revisa la vista previa y pulsa "Publicar".',
      },
      {
        q: '¿Cuántas fotos puedo subir?',
        a: 'Puedes subir hasta 4 fotos por anuncio. La primera foto será la portada. Cada foto debe pesar menos de 2 MB.',
      },
      {
        q: '¿Puedo editar mi anuncio después de publicarlo?',
        a: 'Sí. Ve a tu perfil, en la pestaña "Anuncios" encontrarás un icono de editar en cada anuncio. Podrás modificar cualquier campo, incluyendo fotos, precio y descripción.',
      },
      {
        q: '¿Publicar anuncios tiene algún coste?',
        a: 'No. Publicar anuncios en Bomell es completamente gratuito.',
      },
    ],
  }),
  (c) => ({
    title: 'Cuenta',
    icon: User,
    color: c.secondary,
    items: [
      {
        q: '¿Cómo edito mi perfil?',
        a: 'En tu perfil, pulsa el botón "Editar perfil". Podrás cambiar tu nombre, ubicación, biografía, foto de perfil y foto de portada.',
      },
      {
        q: '¿Cómo elimino mi cuenta?',
        a: 'En tu perfil, baja hasta la sección "Cuenta" y pulsa "Eliminar cuenta". Se borrarán permanentemente todos tus datos: anuncios, valoraciones, seguidores y favoritos. Esta acción no se puede deshacer.',
      },
      {
        q: '¿Puedo ocultar mi teléfono o email?',
        a: 'Sí. Ve a Ajustes (icono de engranaje en tu perfil) y desactiva "Mostrar teléfono" o "Mostrar email". Los demás usuarios no podrán verlos en tu perfil público.',
      },
    ],
  }),
  (c) => ({
    title: 'Seguridad',
    icon: Shield,
    color: c.error,
    items: [
      {
        q: '¿Cómo reporto un usuario o anuncio?',
        a: 'En el perfil del usuario o en el detalle del producto, pulsa el botón "Reportar". Elige el motivo y envía tu reporte. Nuestro equipo lo revisará lo antes posible.',
      },
      {
        q: '¿Qué hago si me estafan?',
        a: 'Reporta al usuario inmediatamente desde su perfil. Contacta con nuestro equipo de soporte para que podamos tomar medidas. Si la estafa involucra dinero, te recomendamos también denunciarlo ante las autoridades locales.',
      },
      {
        q: 'Consejos para compras seguras',
        a: '• Queda en lugares públicos y concurridos para hacer el intercambio.\n• No envíes dinero por adelantado a desconocidos.\n• Revisa el producto antes de pagar.\n• Desconfía de precios demasiado bajos.\n• Verifica el perfil del vendedor: valoraciones, tiempo en la plataforma y verificación.',
      },
    ],
  }),
  (c) => ({
    title: 'Envíos y entregas',
    icon: Truck,
    color: c.outline,
    items: [
      {
        q: '¿Cómo se hace la entrega?',
        a: 'La entrega se acuerda entre comprador y vendedor. Lo más habitual es quedar en persona en un lugar público. Coordina los detalles por teléfono o WhatsApp antes de la cita.',
      },
      {
        q: '¿Hay envíos entre ciudades?',
        a: 'Bomell no gestiona envíos, pero muchos vendedores envían productos entre Malabo y Bata usando servicios de transporte locales. Consulta directamente con el vendedor las opciones disponibles y los costes.',
      },
    ],
  }),
  (c) => ({
    title: 'Precios y pagos',
    icon: Wallet,
    color: c.tertiary,
    items: [
      {
        q: '¿En qué moneda se publican los precios?',
        a: 'Todos los precios se muestran en francos CFA (XFA), la moneda oficial de Guinea Ecuatorial.',
      },
      {
        q: '¿Se puede negociar el precio?',
        a: 'Sí. Los precios publicados son orientativos. Puedes contactar al vendedor y negociar directamente. Es una práctica habitual y aceptada.',
      },
      {
        q: '¿Qué métodos de pago se usan?',
        a: 'El método de pago se acuerda entre comprador y vendedor. Los más comunes en Guinea Ecuatorial son: efectivo, transferencia bancaria y pago móvil.',
      },
    ],
  }),
  (c) => ({
    title: 'Contacto',
    icon: MessageCircle,
    color: c.primary,
    items: [
      {
        q: '¿Cómo contacto al equipo de Bomell?',
        a: `Puedes escribirnos por email a ${EMAIL} o por contacto al ${WHATSAPP_NUMBER}. Respondemos de lunes a viernes, de 9:00 a 18:00.`,
      },
      {
        q: '¿Cuánto tardan en responder?',
        a: 'Intentamos responder en menos de 24 horas en días laborables. Los reportes de seguridad tienen prioridad y se revisan lo antes posible.',
      },
    ],
  }),
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const sections = FAQ_DATA.map((fn) => fn(colors));

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: insets.top + 52 },
        ]}>
        <RipplePress
          style={styles.headerBtn}
          borderRadius={18}
          rippleColor={colors.primary + '18'}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
          <ChevronLeft size={22} color={colors.onSurface} strokeWidth={2} />
        </RipplePress>
        <Text style={styles.headerTitle}>Centro de ayuda</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 32,
        }}>
        <Text style={styles.pageSubtitle}>
          ¿En qué podemos ayudarte?
        </Text>

        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconWrap, { backgroundColor: section.color + '15' }]}>
                  <Icon size={18} color={section.color} strokeWidth={1.8} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>

              {section.items.map((item, idx) => {
                const key = `${section.title}-${idx}`;
                const isOpen = !!expanded[key];
                return (
                  <View key={key}>
                    <TouchableOpacity
                      style={[
                        styles.questionRow,
                        idx === section.items.length - 1 && !isOpen && styles.questionRowLast,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => toggle(key)}>
                      <Text style={styles.questionText}>{item.q}</Text>
                      <ChevronDown
                        size={16}
                        color={colors.onSurfaceVariant}
                        strokeWidth={1.8}
                        style={isOpen ? { transform: [{ rotate: '180deg' }] } : undefined}
                      />
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={[
                        styles.answerWrap,
                        idx === section.items.length - 1 && styles.answerWrapLast,
                      ]}>
                        <Text style={styles.answerText}>{item.a}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
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
      paddingHorizontal: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.outlineVariant + '33',
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 17,
      color: colors.onSurface,
      letterSpacing: -0.3,
    },
    pageSubtitle: {
      fontFamily: 'Manrope-Regular',
      fontSize: 15,
      color: colors.onSurfaceVariant,
      marginBottom: 20,
    },
    section: {
      marginBottom: 20,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 16,
      borderWidth: 0.5,
      borderColor: colors.outlineVariant + '33',
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.outlineVariant + '22',
    },
    sectionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 16,
      color: colors.onSurface,
    },
    questionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.outlineVariant + '22',
    },
    questionRowLast: {
      borderBottomWidth: 0,
    },
    questionText: {
      fontFamily: 'Manrope-SemiBold',
      fontSize: 14,
      color: colors.onSurface,
      flex: 1,
      marginRight: 12,
    },
    answerWrap: {
      paddingHorizontal: 16,
      paddingBottom: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.outlineVariant + '22',
    },
    answerWrapLast: {
      borderBottomWidth: 0,
    },
    answerText: {
      fontFamily: 'Manrope-Regular',
      fontSize: 13,
      color: colors.onSurfaceVariant,
      lineHeight: 20,
    },
  });
