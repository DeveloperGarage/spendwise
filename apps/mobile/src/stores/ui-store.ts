import { create } from 'zustand';

/**
 * UI-only state. Nothing here comes from the server.
 * Server data lives in TanStack Query, never in this store (see ADR 0007).
 */
type UIState = {
  colorScheme: 'light' | 'dark' | 'system';
  setColorScheme: (scheme: UIState['colorScheme']) => void;
};

export const useUIStore = create<UIState>((set) => ({
  colorScheme: 'system',
  setColorScheme: (colorScheme) => set({ colorScheme }),
}));
