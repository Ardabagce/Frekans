/**
 * Hikayelerdeki "fotoğraf" mesajları için stilize SVG illüstrasyonlar.
 * Yeni bir görsel eklemek için: bileşeni yaz, ILLUSTRATIONS'a kaydet.
 * Hikaye dosyaları görsellere yalnızca id ile başvurur.
 */
import type { ComponentType } from 'react';

import { DagSiluetiIllustration } from './DagSilueti';
import { KarliPencereIllustration } from './KarliPencere';
import { SobaIllustration } from './Soba';

export type IllustrationProps = { width: number; height: number };

export const ILLUSTRATIONS = {
  'karli-pencere': KarliPencereIllustration,
  soba: SobaIllustration,
  'dag-silueti': DagSiluetiIllustration,
} satisfies Record<string, ComponentType<IllustrationProps>>;

export type IllustrationId = keyof typeof ILLUSTRATIONS;

/** Fotoğraf balonlarının en/boy oranı */
export const ILLUSTRATION_ASPECT = 4 / 3;

export function Illustration({ id, width, height }: { id: IllustrationId } & IllustrationProps) {
  const Component = ILLUSTRATIONS[id];
  return <Component width={width} height={height} />;
}
