import {Href, useRouter} from "expo-router";

export const  useGoBack = (fallback= '/' as Href) => {
  const router = useRouter()
  return () => {
    if (router.canGoBack()) router.back()
    router.replace(fallback)
  }
}