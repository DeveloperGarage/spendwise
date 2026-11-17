import {useCallback} from "react";
import {Href, useRouter} from "expo-router";

/**
 * Back navigation that is safe on a cold start. On web (or a deep link) the
 * screen is often the first entry in the history, so `router.back()` is a
 * no-op; we land on `fallback` instead. The fallback *replaces* the dead-end
 * entry rather than stacking on top of it, so pressing back again does not
 * return to the screen the user just left.
 */
export const useGoBack = (fallback = '/' as Href) => {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallback);
  }, [router, fallback]);
};
