/**
 * Hikayelerdeki "fotoğraf" mesajları için stilize SVG illüstrasyonlar.
 * Yeni bir görsel eklemek için: bileşeni yaz, ILLUSTRATIONS'a kaydet.
 * Hikaye dosyaları görsellere yalnızca id ile başvurur.
 */
import type { ComponentType } from 'react';

import { DagSiluetiIllustration } from './DagSilueti';
import { KarliPencereIllustration } from './KarliPencere';
import type { IllustrationId } from './ids';
import { SobaIllustration } from './Soba';

export { ILLUSTRATION_IDS, type IllustrationId } from './ids';

export type IllustrationProps = { width: number; height: number };

export const ILLUSTRATIONS = {
  'karli-pencere': KarliPencereIllustration,
  soba: SobaIllustration,
  'dag-silueti': DagSiluetiIllustration,
  // GEÇİCİ: illüstratör kendi çizimleriyle değiştirecek
  'ozan-cantasi': KarliPencereIllustration,
  'sos-isareti': DagSiluetiIllustration,
  helikopter: DagSiluetiIllustration,
  'not-kagidi': KarliPencereIllustration,
  'coban-kulubesi': DagSiluetiIllustration,
  'sirt-sinyal': DagSiluetiIllustration,
} satisfies Record<IllustrationId, ComponentType<IllustrationProps>>;

/** Fotoğraf balonlarının en/boy oranı */
export const ILLUSTRATION_ASPECT = 4 / 3;

export function Illustration({ id, width, height }: { id: IllustrationId } & IllustrationProps) {
  const Component = ILLUSTRATIONS[id];
  return <Component width={width} height={height} />;
}
