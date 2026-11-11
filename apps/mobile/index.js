// App entry. In dev web mock mode, start MSW before loading the router.
// __DEV__ and EXPO_PUBLIC_* are inlined at build time, so the mocks branch
// is dead code in production bundles and msw is never included.
if (
  __DEV__ &&
  process.env.EXPO_PUBLIC_USE_MOCKS === 'true' &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator
) {
  require('./mocks/browser')
    .worker.start({ onUnhandledRequest: 'bypass' })
    .finally(() => require('expo-router/entry'));
} else {
  require('expo-router/entry');
}
