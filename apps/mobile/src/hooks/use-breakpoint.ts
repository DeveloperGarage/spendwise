import { useWindowDimensions } from 'react-native';

/** Width (px) at/above which screens switch from the stacked mobile layout to the split desktop layout. */
export const WIDE_BREAKPOINT = 768;

/** Reactive breakpoint helper shared across responsive screens. */
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return { width, isWide: width >= WIDE_BREAKPOINT };
}
