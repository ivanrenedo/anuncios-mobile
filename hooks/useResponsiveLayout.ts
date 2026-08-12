import { Platform, useWindowDimensions } from 'react-native';

export const PHONE_LANDSCAPE_MIN_WIDTH = 640;
export const TABLET_MIN_WIDTH = 768;
export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 84 : 64;

export function useResponsiveLayout() {
  const { width, height, scale, fontScale } = useWindowDimensions();
  const shortest = Math.min(width, height);
  const longest = Math.max(width, height);
  const isLandscape = width > height;
  const isTablet = shortest >= TABLET_MIN_WIDTH;
  const isWide = width >= PHONE_LANDSCAPE_MIN_WIDTH;

  return {
    width,
    height,
    scale,
    fontScale,
    shortest,
    longest,
    isLandscape,
    isTablet,
    isWide,
    gutter: isWide ? 20 : 16,
    contentMaxWidth: isTablet ? 960 : undefined,
    tabBarHeight: TAB_BAR_HEIGHT,
  };
}

export function columnsForContentWidth(width: number) {
  if (width >= 1040) return 5;
  if (width >= 820) return 4;
  if (width >= 560) return 3;
  return 2;
}
