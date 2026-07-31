import React, { useRef, useState } from 'react';
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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { resolveImage } from '@/lib/config';
import { useAutoplayScroll } from '@/hooks/useAutoplayScroll';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 32;
const SLIDE_GAP = 16;
const ITEM_WIDTH = SLIDE_WIDTH + SLIDE_GAP;
const AUTOPLAY_MS = 4500;
const IMAGE_OVERFLOW = SLIDE_WIDTH * 0.18;

interface Slide {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonTextColor: string;
  image: string;
  linkType?: 'none' | 'product' | 'category' | 'url';
  linkValue?: string;
}


interface PromoCarouselProps {
  config?: any;
  onSlidePress?: () => void;
}

function PromoCarousel({ config, onSlidePress }: PromoCarouselProps = {}) {
  const router = useRouter();
  const slides: Slide[] = (config?.slides as Slide[] | undefined) ?? [];

  const handleSlidePress = (slide: Slide) => {
    const value = slide.linkValue?.trim();
    if (!value) return;
    onSlidePress?.();
    switch (slide.linkType) {
      case 'product':
        router.push({ pathname: '/product/[id]', params: { id: value } });
        break;
      case 'category':
        router.push({ pathname: '/explore', params: { filterCat: value } });
        break;
      case 'url':
        Linking.openURL(value).catch(() => {});
        break;
      default:
        break;
    }
  };
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const autoplayHandlers = useAutoplayScroll(scrollRef, {
    itemCount: slides.length,
    pitch: ITEM_WIDTH,
    intervalMs: AUTOPLAY_MS,
  });

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    autoplayHandlers.onMomentumScrollEnd(e);
    const i = autoplayHandlers.indexRef.current;
    if (i !== activeIndex) setActiveIndex(i);
  };

  // Nothing to show yet — either config hasn't arrived (cold cache) or the
  // home-sections config for this slot has an empty slides array.
  if (slides.length === 0) return null;

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
        onScrollBeginDrag={autoplayHandlers.onScrollBeginDrag}
        onScrollEndDrag={autoplayHandlers.onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}>
        {(slides.length > 1 ? [...slides, slides[0]] : slides).map((slide, i) => {
          const isClone = slides.length > 1 && i === slides.length;
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
              key={isClone ? `${slide.id}-clone` : slide.id}
              style={[styles.slide, { transform: [{ scale }], opacity }]}>
              <Animated.Image
                source={{ uri: resolveImage(slide.image) }}
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
                {slide.buttonLabel.length > 0 &&(<TouchableOpacity
                  style={styles.button}
                  activeOpacity={0.85}
                  onPress={() => handleSlidePress(slide)}>
                  <Text
                    style={[styles.buttonText, { color: slide.buttonTextColor }]}>
                    {slide.buttonLabel}
                  </Text>
                </TouchableOpacity>)}
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

export default React.memo(PromoCarousel);

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
