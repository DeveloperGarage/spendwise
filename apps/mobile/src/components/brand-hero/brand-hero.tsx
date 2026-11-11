import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';

import { BRAND_GRADIENT, LogoBadge } from '@/components/logo-badge';

import { styles } from './brand-hero.styles';

/**
 * The branded gradient hero (logo mark + "Spendwise" wordmark) shown on the
 * left half of the desktop split layout across auth screens.
 */
export function BrandHero() {
  return (
    <LinearGradient
      colors={[BRAND_GRADIENT[1], BRAND_GRADIENT[0]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}>
      <LogoBadge size={64} />
      <Text style={styles.wordmark}>Spendwise</Text>
    </LinearGradient>
  );
}
