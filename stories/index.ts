import type { StoryMeta } from '@/engine/meta';

/**
 * Hikaye kayıt defteri. Sohbet listesi bu sırayla gösterilir.
 * Kilitli hikayeler, karakter henüz "frekansı bulmadığı" için maskeli numarayla görünür.
 */
export const STORIES: readonly StoryMeta[] = [
  {
    id: 'dag-evi',
    title: 'Dağ Evi',
    character: { name: 'Deniz', avatar: { initials: 'D', color: '#3F7F8C' } },
    locked: false,
  },
  {
    id: 'gece-vardiyasi',
    title: 'Gece Vardiyası',
    character: { name: '+90 5•• ••• 41 07', avatar: { initials: '?', color: '#6B5B7A' } },
    locked: true,
    teaser: 'Gece Vardiyası',
  },
  {
    id: 'derin-su',
    title: 'Derin Su',
    character: { name: '+90 5•• ••• 88 23', avatar: { initials: '?', color: '#4A6A86' } },
    locked: true,
    teaser: 'Derin Su',
  },
  {
    id: 'kayip-sinyal',
    title: 'Kayıp Sinyal',
    character: { name: 'Bilinmeyen numara', avatar: { initials: '?', color: '#7A6A4A' } },
    locked: true,
    teaser: 'Kayıp Sinyal',
  },
];

export function getStoryMeta(id: string): StoryMeta | undefined {
  return STORIES.find((s) => s.id === id);
}
