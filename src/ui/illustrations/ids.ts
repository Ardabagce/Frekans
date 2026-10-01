/**
 * Fotoğraf mesajlarında kullanılabilecek illüstrasyon kimlikleri.
 * React'e bağımlı değil; hikaye doğrulama script'i de bunu kullanır.
 * Yeni görsel: buraya kimliği ekle, index.tsx'te bileşenini kaydet.
 */
export const ILLUSTRATION_IDS = [
  'karli-pencere',
  'soba',
  'dag-silueti',
  'ozan-cantasi',
  'sos-isareti',
  'helikopter',
  'not-kagidi',
  'coban-kulubesi',
  'sirt-sinyal',
] as const;

export type IllustrationId = (typeof ILLUSTRATION_IDS)[number];
