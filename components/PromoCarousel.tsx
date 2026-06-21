import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 32;
const SLIDE_GAP = 16;
const ITEM_WIDTH = SLIDE_WIDTH + SLIDE_GAP;
const AUTOPLAY_MS = 4500;
const IMAGE_OVERFLOW = SLIDE_WIDTH * 0.18;

const slides = [
  {
    id: '1',
    badge: 'PROMO',
    badgeColor: colors.primary,
    title: 'Ofertas de Verano',
    subtitle: 'Hasta 40% de descuento en electrónica',
    buttonLabel: 'Ver ofertas',
    buttonTextColor: colors.primary,
    image:
      'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '2',
    badge: 'NUEVO',
    badgeColor: colors.secondary,
    title: 'Apple Event 2024',
    subtitle: 'Reserva ya los nuevos dispositivos',
    buttonLabel: 'Descubrir',
    buttonTextColor: colors.secondary,
    image:
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '3',
    badge: 'VEHÍCULOS',
    badgeColor: colors.tertiary,
    title: 'Tu próximo coche',
    subtitle: 'Más de 200 anuncios verificados en Malabo y Bata',
    buttonLabel: 'Explorar',
    buttonTextColor: colors.tertiary,
    image:
      'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '4',
    badge: 'MODA',
    badgeColor: colors.error,
    title: 'Tendencias de la semana',
    subtitle: 'Ropa, zapatillas y accesorios al mejor precio',
    buttonLabel: 'Ver moda',
    buttonTextColor: colors.error,
    image:
      'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '5',
    badge: 'SERVICIOS',
    badgeColor: colors.primary,
    title: 'Profesionales cerca de ti',
    subtitle: 'Reparación, mudanzas y mucho más, todo verificado',
    buttonLabel: 'Contratar',
    buttonTextColor: colors.primary,
    image:
      'https://images.pexels.com/photos/3760529/pexels-photo-3760529.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '6',
    badge: 'HOGAR',
    badgeColor: colors.secondary,
    title: 'Renueva tu espacio',
    subtitle: 'Mobiliario y decoración con envío local',
    buttonLabel: 'Ver hogar',
    buttonTextColor: colors.secondary,
    image:
      'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

export default function PromoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
  const userInteractingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startAutoPlay = () => {
    stopAutoPlay();
    if (slides.length < 2) return;
    intervalRef.current = setInterval(() => {
      if (userInteractingRef.current) return;
      const next = (indexRef.current + 1) % slides.length;
      scrollRef.current?.scrollTo({ x: next * ITEM_WIDTH, animated: true });
    }, AUTOPLAY_MS);
  };

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, []);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
    if (i !== indexRef.current) {
      indexRef.current = i;
      setActiveIndex(i);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onScrollBeginDrag={() => {
          userInteractingRef.current = true;
        }}
        onScrollEndDrag={() => {
          userInteractingRef.current = false;
        }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}>
        {slides.map((slide, i) => {
          const inputRange = [
            (i - 1) * ITEM_WIDTH,
            i * ITEM_WIDTH,
            (i + 1) * ITEM_WIDTH,
          ];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.94, 1, 0.94],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.65, 1, 0.65],
            extrapolate: 'clamp',
          });
          const imageTranslateX = scrollX.interpolate({
            inputRange,
            outputRange: [-IMAGE_OVERFLOW, 0, IMAGE_OVERFLOW],
            extrapolate: 'clamp',
          });
          const contentTranslateX = scrollX.interpolate({
            inputRange,
            outputRange: [SLIDE_WIDTH * 0.15, 0, -SLIDE_WIDTH * 0.15],
            extrapolate: 'clamp',
          });
          const contentOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={slide.id}
              style={[styles.slide, { transform: [{ scale }], opacity }]}>
              <Animated.Image
                source={{ uri: slide.image }}
                style={[
                  styles.image,
                  { transform: [{ translateX: imageTranslateX }] },
                ]}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <Animated.View
                style={[
                  styles.content,
                  {
                    transform: [{ translateX: contentTranslateX }],
                    opacity: contentOpacity,
                  },
                ]}>
                <View style={[styles.badge, { backgroundColor: slide.badgeColor }]}>
                  <Text style={styles.badgeText}>{slide.badge}</Text>
                </View>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
                <TouchableOpacity style={styles.button} activeOpacity={0.85}>
                  <Text
                    style={[styles.buttonText, { color: slide.buttonTextColor }]}>
                    {slide.buttonLabel}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      <View style={styles.dots}>
        {slides.map((_, i) => {
          const inputRange = [
            (i - 1) * ITEM_WIDTH,
            i * ITEM_WIDTH,
            (i + 1) * ITEM_WIDTH,
          ];
          const width = scrollX.interpolate({
            inputRange,
            outputRange: [6, 22, 6],
            extrapolate: 'clamp',
          });
          const backgroundColor = scrollX.interpolate({
            inputRange,
            outputRange: [
              colors.outlineVariant + '80',
              colors.primary,
              colors.outlineVariant + '80',
            ],
          });
          return (
            <Animated.View
              key={i}
              accessibilityLabel={`Slide ${i + 1}${
                i === activeIndex ? ', activo' : ''
              }`}
              style={[styles.dot, { width, backgroundColor }]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  scrollContent: {
    gap: SLIDE_GAP,
  },
  slide: {
    width: SLIDE_WIDTH,
    height: 224,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0d0f12',
  },
  image: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -IMAGE_OVERFLOW,
    width: SLIDE_WIDTH + IMAGE_OVERFLOW * 2,
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#ffffff',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Manrope-Bold',
    fontSize: 24,
    color: '#ffffff',
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  buttonText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    height: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
