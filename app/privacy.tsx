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
import { EMAIL, WHATSAPP_NUMBER } from '@/lib/config';

const LAST_UPDATED = '8 de julio de 2026';

interface Section {
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    title: '1. Responsable del tratamiento',
    body: `El responsable del tratamiento de tus datos personales es Bomelh, plataforma de anuncios clasificados con actividad en Guinea Ecuatorial.\n\nPara cualquier consulta relacionada con tus datos, puedes contactarnos en ${EMAIL}`,
  },
  {
    title: '2. Datos que recopilamos',
    body: 'Recopilamos los siguientes datos personales:\n\n• Datos de registro: nombre, dirección de email y foto de perfil, proporcionados automáticamente por Google Sign-In.\n• Datos de perfil: teléfono, ubicación y biografía, que proporcionas voluntariamente.\n• Contenido publicado: anuncios (textos, fotos, precios), valoraciones y comentarios.\n• Datos de uso: productos visitados, búsquedas realizadas y preferencias de notificación.\n• Datos técnicos: token de notificaciones push, tipo de dispositivo y sistema operativo.',
  },
  {
    title: '3. Finalidad del tratamiento',
    body: 'Utilizamos tus datos para:\n\n• Gestionar tu cuenta y autenticación: permitirte iniciar sesión y mantener tu perfil.\n• Publicar y mostrar anuncios: hacer visibles tus productos y servicios a otros usuarios.\n• Comunicaciones: enviarte notificaciones sobre actividad en tus anuncios, nuevos seguidores y valoraciones.\n• Seguridad: detectar y prevenir fraudes, abusos y actividades ilícitas.\n• Mejora del servicio: analizar el uso de la plataforma para mejorar la experiencia.\n\nNo utilizamos tus datos para publicidad de terceros ni para perfilado con fines comerciales.',
  },
  {
    title: '4. Base legal',
    body: '• Ejecución del servicio: necesitamos tus datos de registro y perfil para proporcionarte el servicio.\n• Consentimiento: al registrarte y publicar contenido, consientes el tratamiento de tus datos para los fines descritos.\n• Interés legítimo: para la seguridad de la plataforma y la prevención de fraudes.',
  },
  {
    title: '5. Compartición de datos',
    body: 'Tus datos pueden ser visibles o compartidos en estos casos:\n\n• Perfil público: tu nombre, foto, ubicación, biografía, anuncios y valoraciones son visibles para todos los usuarios. Tu email y teléfono solo se muestran si activas las opciones "Mostrar email" y "Mostrar teléfono" en los ajustes.\n• Proveedores técnicos: utilizamos servicios de terceros para el funcionamiento de la app (almacenamiento en la nube, notificaciones push a través de Expo/Firebase). Estos proveedores solo acceden a los datos necesarios para prestar su servicio.\n• Obligación legal: podemos compartir datos si es requerido por ley o por autoridades competentes de Guinea Ecuatorial.\n\nNo vendemos ni cedemos tus datos personales a terceros para fines comerciales.',
  },
  {
    title: '6. Almacenamiento y seguridad',
    body: 'Tus datos se almacenan en servidores protegidos con medidas de seguridad técnicas y organizativas adecuadas, incluyendo:\n\n• Comunicaciones cifradas (HTTPS/TLS).\n• Contraseñas y tokens almacenados de forma segura.\n• Acceso restringido a los datos por parte del equipo técnico.\n\nConservamos tus datos mientras mantengas tu cuenta activa. Si eliminas tu cuenta, todos tus datos se borran permanentemente de nuestros servidores.',
  },
  {
    title: '7. Tus derechos',
    body: `Como usuario, tienes derecho a:\n\n• Acceso: consultar qué datos tenemos sobre ti. Tu perfil y contenido son visibles desde la app.\n• Rectificación: modificar tus datos en cualquier momento desde "Editar perfil".\n• Eliminación: borrar tu cuenta y todos tus datos desde la sección "Cuenta" en tu perfil. La eliminación es permanente e irreversible.\n• Portabilidad: solicitar una copia de tus datos contactando con soporte.\n• Oposición: desactivar las notificaciones desde los ajustes de la app.\n\nPara ejercer cualquiera de estos derechos, contacta con nosotros en ${EMAIL}`,
  },
  {
    title: '8. Cookies y tecnologías similares',
    body: 'Bomelh es una aplicación móvil nativa y no utiliza cookies. Sin embargo, utilizamos almacenamiento local en el dispositivo (AsyncStorage) para:\n\n• Mantener tu sesión iniciada.\n• Guardar tus preferencias (tema, idioma, notificaciones).\n• Almacenar datos de perfil en caché para un acceso más rápido.\n\nEstos datos se almacenan únicamente en tu dispositivo y se eliminan al cerrar sesión o desinstalar la app.',
  },
  {
    title: '9. Menores de edad',
    body: 'Bomelh no está dirigido a menores de 18 años. No recopilamos intencionadamente datos de menores. Si detectamos que un menor se ha registrado, eliminaremos su cuenta y datos asociados.',
  },
  {
    title: '10. Modificaciones',
    body: 'Podemos actualizar esta Política de Privacidad para reflejar cambios en nuestras prácticas o en la legislación aplicable. Los cambios serán efectivos desde su publicación en la aplicación.\n\nTe notificaremos de cambios significativos a través de la app. El uso continuado de Bomelh después de una actualización implica la aceptación de la nueva política.',
  },
  {
    title: '11. Contacto',
    body: `Para cualquier consulta sobre esta Política de Privacidad o el tratamiento de tus datos:\n\n• Email: ${EMAIL}\n• Contacto: ${WHATSAPP_NUMBER}`,
  },
];

export default function PrivacyScreen() {
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
        <Text style={styles.headerTitle}>Política de privacidad</Text>
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
