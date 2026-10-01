import { useWindowDimensions } from 'react-native';

/** Web'de (masaüstü tarayıcıda) uygulama bu genişlikte ortalanır; telefonda tam ekran. */
export const APP_MAX_WIDTH = 560;

/** Uygulama sütununun gerçek genişliği */
export function useAppWidth(): number {
  const { width } = useWindowDimensions();
  return Math.min(width, APP_MAX_WIDTH);
}

/** Fotoğraf ve konum balonlarının içerik genişliği */
export function useMediaWidth(): number {
  const appWidth = useAppWidth();
  return Math.round(Math.min(appWidth * 0.72, 300));
}
