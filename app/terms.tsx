import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '@/constants/theme';
import RipplePress from '@/components/RipplePress';

const LAST_UPDATED = '8 de julio de 2026';

interface Section {
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    title: '1. Información general',
    body: 'Market EG es una plataforma de anuncios clasificados que permite a los usuarios de Guinea Ecuatorial publicar, buscar y contactar sobre productos y servicios. Market EG no es parte en las transacciones entre usuarios y actúa únicamente como intermediario tecnológico.\n\nAl registrarte o usar la aplicación, aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no utilices la plataforma.',
  },
  {
    title: '2. Registro y cuenta',
    body: '• Para usar Market EG necesitas crear una cuenta mediante Google Sign-In.\n• Debes proporcionar información veraz y mantenerla actualizada.\n• Eres responsable de la seguridad de tu cuenta y de toda actividad que se realice desde ella.\n• No está permitido crear múltiples cuentas ni compartir tu acceso con terceros.\n• Debes tener al menos 18 años para registrarte.',
  },
  {
    title: '3. Publicación de anuncios',
    body: '• Los anuncios deben describir productos o servicios reales y disponibles.\n• Las fotos deben corresponder al producto o servicio ofrecido.\n• Los precios deben expresarse en francos CFA (XFA) y reflejar el valor real del artículo.\n• Está prohibido publicar anuncios de productos ilegales, falsificados, robados, armas, drogas, medicamentos sin receta, animales protegidos o cualquier artículo cuya venta esté prohibida por la legislación de Guinea Ecuatorial.\n• Está prohibido publicar contenido ofensivo, discriminatorio, violento o sexual.\n• Market EG se reserva el derecho de eliminar cualquier anuncio que incumpla estas normas sin previo aviso.',
  },
  {
    title: '4. Conducta del usuario',
    body: '• Debes tratar a otros usuarios con respeto.\n• Está prohibido el acoso, las amenazas, el spam, la suplantación de identidad y cualquier forma de fraude o estafa.\n• No debes usar la plataforma para fines distintos a la compraventa de productos y servicios legítimos.\n• El incumplimiento de estas normas puede resultar en la suspensión o eliminación permanente de tu cuenta.',
  },
  {
    title: '5. Transacciones entre usuarios',
    body: 'Market EG no participa, media ni garantiza las transacciones entre usuarios. No somos responsables de:\n\n• La calidad, seguridad o legalidad de los productos o servicios publicados.\n• La veracidad de los anuncios o la identidad de los usuarios.\n• La capacidad de los vendedores para vender o de los compradores para pagar.\n• Problemas derivados de envíos, entregas o pagos.\n\nTe recomendamos seguir los consejos de seguridad disponibles en el Centro de ayuda antes de realizar cualquier transacción.',
  },
  {
    title: '6. Propiedad intelectual',
    body: 'El contenido que publicas (textos, fotos, descripciones) sigue siendo de tu propiedad. Sin embargo, al publicarlo en Market EG, nos otorgas una licencia no exclusiva, gratuita y mundial para mostrarlo, distribuirlo y promocionarlo dentro de la plataforma.\n\nLa marca Market EG, su logotipo, diseño y código son propiedad de sus creadores y están protegidos. No está permitido copiar, modificar ni distribuir ningún elemento de la aplicación sin autorización.',
  },
  {
    title: '7. Protección de datos',
    body: 'Market EG recopila y trata los siguientes datos personales:\n\n• Nombre, email y foto de perfil (proporcionados por Google Sign-In).\n• Teléfono, ubicación y biografía (proporcionados voluntariamente).\n• Anuncios publicados, valoraciones y actividad dentro de la app.\n\nUsamos estos datos para el funcionamiento de la plataforma, la comunicación con los usuarios y la mejora del servicio. No vendemos ni compartimos tus datos con terceros para fines comerciales.\n\nPuedes solicitar la eliminación de tus datos eliminando tu cuenta desde la sección "Cuenta" de tu perfil.',
  },
  {
    title: '8. Limitación de responsabilidad',
    body: 'Market EG se proporciona "tal cual", sin garantías de ningún tipo. No garantizamos:\n\n• La disponibilidad ininterrumpida del servicio.\n• La ausencia de errores o vulnerabilidades.\n• Los resultados obtenidos mediante el uso de la plataforma.\n\nEn ningún caso Market EG será responsable de daños directos, indirectos o consecuentes derivados del uso de la plataforma o de transacciones entre usuarios.',
  },
  {
    title: '9. Suspensión y eliminación de cuentas',
    body: 'Market EG se reserva el derecho de suspender o eliminar cuentas que:\n\n• Incumplan estos Términos y Condiciones.\n• Publiquen contenido ilegal, fraudulento o dañino.\n• Reciban múltiples reportes de otros usuarios.\n• Realicen un uso abusivo de la plataforma.\n\nLa eliminación de una cuenta conlleva la eliminación de todos los datos asociados: anuncios, valoraciones, seguidores y favoritos.',
  },
  {
    title: '10. Modificaciones',
    body: 'Market EG puede modificar estos Términos y Condiciones en cualquier momento. Los cambios serán efectivos desde su publicación en la aplicación. El uso continuado de la plataforma después de un cambio implica la aceptación de los nuevos términos.\n\nTe notificaremos de cambios importantes a través de la aplicación.',
  },
  {
    title: '11. Contacto',
    body: 'Para cualquier consulta sobre estos Términos y Condiciones, puedes contactarnos en:\n\n• Email: soporte@marketeg.com\n• WhatsApp: +240 222 000 000',
  },
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

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
        <Text style={styles.headerTitle}>Términos y condiciones</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 32,
        }}>
        <Text style={styles.updated}>Última actualización: {LAST_UPDATED}</Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
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
    updated: {
      fontFamily: 'Manrope-Regular',
      fontSize: 12,
      color: colors.onSurfaceVariant + '88',
      marginBottom: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontFamily: 'Manrope-Bold',
      fontSize: 15,
      color: colors.onSurface,
      marginBottom: 8,
    },
    sectionBody: {
      fontFamily: 'Manrope-Regular',
      fontSize: 13,
      color: colors.onSurfaceVariant,
      lineHeight: 21,
    },
  });
