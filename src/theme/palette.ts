export type Palette = {
  scheme: 'light' | 'dark';
  /** Uygulama çubuğu (liste ve sohbet başlığı) */
  appBar: string;
  appBarText: string;
  appBarSubtext: string;
  /** Liste ekranı zemini */
  background: string;
  /** Web'de telefon genişliği dışındaki alan */
  outerBackground: string;
  divider: string;
  text: string;
  textSecondary: string;
  accent: string;
  badge: string;
  badgeText: string;

  /** Sohbet ekranı */
  chatBackground: string;
  wallpaperInk: string;
  wallpaperOpacity: number;
  bubbleIn: string;
  bubbleOut: string;
  bubbleShadow: string;
  bubbleMeta: string;
  tickPending: string;
  tickRead: string;
  dateChip: string;
  dateChipText: string;
  systemChip: string;
  systemChipText: string;
  /** "Sinyal zayıf" gibi uyarılarda sadece ikon renklenir; kutu yine gridir */
  warningIcon: string;
  link: string;

  /** Alt çubuk / seçimler */
  composerBar: string;
  composerField: string;
  composerPlaceholder: string;
  choiceBackground: string;
  choiceBorder: string;
  choiceText: string;
  choicePressed: string;
  lockedBackground: string;
  lockedText: string;
  lockedReason: string;

  floatingButton: string;
  floatingButtonText: string;
};

export const lightPalette: Palette = {
  scheme: 'light',
  appBar: '#0E5E63',
  appBarText: '#FFFFFF',
  appBarSubtext: 'rgba(255,255,255,0.82)',
  background: '#FFFFFF',
  outerBackground: '#D5DCDD',
  divider: '#E7ECEE',
  text: '#101C21',
  textSecondary: '#62737C',
  accent: '#0E8C7F',
  badge: '#13A38E',
  badgeText: '#FFFFFF',

  chatBackground: '#E9E5DD',
  wallpaperInk: '#8C7F6A',
  wallpaperOpacity: 0.16,
  bubbleIn: '#FFFFFF',
  bubbleOut: '#D3F0E6',
  bubbleShadow: 'rgba(11,20,26,0.13)',
  bubbleMeta: '#667781',
  tickPending: '#8696A0',
  tickRead: '#2A9DF4',
  dateChip: '#FFFFFF',
  dateChipText: '#54656F',
  systemChip: '#E1E6E8',
  systemChipText: '#54656F',
  warningIcon: '#C0623A',
  link: '#0A7C8C',

  composerBar: '#F0F2F2',
  composerField: '#FFFFFF',
  composerPlaceholder: '#8696A0',
  choiceBackground: '#FFFFFF',
  choiceBorder: '#B9DDD6',
  choiceText: '#0B5F5A',
  choicePressed: '#E3F4EF',
  lockedBackground: '#EEF0F0',
  lockedText: '#9AA5AB',
  lockedReason: '#A2522F',

  floatingButton: '#FFFFFF',
  floatingButtonText: '#0B5F5A',
};

export const darkPalette: Palette = {
  scheme: 'dark',
  appBar: '#16252B',
  appBarText: '#E9EDEF',
  appBarSubtext: 'rgba(233,237,239,0.7)',
  background: '#0F1A1F',
  outerBackground: '#070D10',
  divider: '#1F2D33',
  text: '#E9EDEF',
  textSecondary: '#8D9DA5',
  accent: '#3CC7B0',
  badge: '#2BB39E',
  badgeText: '#0B1418',

  chatBackground: '#0B1418',
  wallpaperInk: '#9FB3BA',
  wallpaperOpacity: 0.06,
  bubbleIn: '#1D2B31',
  bubbleOut: '#0E4E48',
  bubbleShadow: 'rgba(0,0,0,0.35)',
  bubbleMeta: 'rgba(233,237,239,0.6)',
  tickPending: 'rgba(233,237,239,0.6)',
  tickRead: '#53BDEB',
  dateChip: '#1A262C',
  dateChipText: '#8D9DA5',
  systemChip: '#1F2C33',
  systemChipText: '#A9B6BC',
  warningIcon: '#E39A78',
  link: '#5BC8D6',

  composerBar: '#101B20',
  composerField: '#1D2B31',
  composerPlaceholder: '#7E8F97',
  choiceBackground: '#1D2B31',
  choiceBorder: '#25544E',
  choiceText: '#66DCC8',
  choicePressed: '#24403D',
  lockedBackground: '#162126',
  lockedText: '#5E6E75',
  lockedReason: '#E39A78',

  floatingButton: '#1D2B31',
  floatingButtonText: '#66DCC8',
};
