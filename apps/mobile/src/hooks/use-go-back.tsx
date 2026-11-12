import {Href, useRouter} from "expo-router";

export const  useGoBack = (fallback= '/' as Href) => {
  const router = useRouter()
  return () => router.canGoBack() ? router.back() : router.push(fallback)
}