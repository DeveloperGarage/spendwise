import { useUIStore } from './ui-store';

describe('ui-store', () => {
  it('defaults the color scheme to system', () => {
    expect(useUIStore.getState().colorScheme).toBe('system');
  });

  it('updates the color scheme', () => {
    useUIStore.getState().setColorScheme('dark');
    expect(useUIStore.getState().colorScheme).toBe('dark');
  });
});
