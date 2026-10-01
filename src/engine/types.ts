/**
 * Hikaye formatı. Hikaye dosyaları (stories/<id>/) bu tipleri `kit.ts`'deki
 * yardımcılarla üretir; motor yalnızca bu düz veriyle çalışır.
 */
import type { MessageContent } from '@/chat/types';

import type { CharacterMeta } from './meta';

/** Milisaniye (sayı) ya da "30s", "7m", "2h", "1h30m" gibi okunabilir süre */
export type Duration = number | string;

/** Yerel saat, "HH:MM" */
export type ClockTime = `${number}:${number}`;

/** sabah 06–12, ogle 12–17, aksam 17–22, gece 22–06 */
export type TimeOfDay = 'sabah' | 'ogle' | 'aksam' | 'gece';

export type Condition =
  | { flag: string }
  | { injury: string }
  | { item: string }
  | { stat: string; gte?: number; lte?: number; gt?: number; lt?: number }
  | { visited: string }
  | { timeOfDay: TimeOfDay | TimeOfDay[] }
  | { time: { from: ClockTime; to: ClockTime } }
  | { not: Condition }
  | { all: Condition[] }
  | { any: Condition[] };

export type Effect =
  | { set: string }
  | { unset: string }
  | { injure: string }
  | { heal: string }
  | { give: string }
  | { take: string }
  | { stat: string; add?: number; to?: number };

/** Karakterin gönderebileceği mesaj içerikleri (sistem mesajı ayrı adımdır) */
export type MessageSpec = Exclude<MessageContent, { kind: 'system' }>;

export type MessageStep = {
  kind: 'message';
  content: MessageSpec;
  /** Önceki olaydan sonra yazmaya başlamadan önceki bekleme */
  delay?: Duration;
  /** "yazıyor..." süresi; verilmezse metin uzunluğundan hesaplanır */
  typing?: Duration;
  if?: Condition;
};

export type SystemStep = {
  kind: 'system';
  text: string;
  tone?: 'info' | 'warning';
  delay?: Duration;
  if?: Condition;
};

/**
 * Karakter çevrimdışı olur (göreve gider, telefonu kapatır, uyur).
 * `for` sabit süre, `until` yerel saat ("08:00" → bir sonraki 08:00).
 * İkisi birden verilirse hangisi daha geç ise o geçerlidir.
 */
export type AwayStep = {
  kind: 'away';
  for?: Duration;
  until?: ClockTime;
  /** `until` kullanılırken en az bu kadar sürsün (yoksa ertesi güne kayar) */
  minFor?: Duration;
  delay?: Duration;
  /** Çevrimdışı olduğunda ortada çıkan sistem notu, ör. "Deniz'in bağlantısı koptu" */
  notice?: string;
  /** İlk uzun arada bildirim izni ekranını tetikler */
  askNotifications?: boolean;
  if?: Condition;
};

export type EffectsStep = { kind: 'effects'; effects: Effect[]; if?: Condition };

/** Karakter çevrimiçi ama sessiz (okuyor, düşünüyor) */
export type PauseStep = { kind: 'pause'; for: Duration; if?: Condition };

export type Step = MessageStep | SystemStep | AwayStep | EffectsStep | PauseStep;

export type Choice = {
  id: string;
  /** Butonda görünen ve oyuncunun mesajı olarak gönderilen metin */
  text: string;
  /** Mesaj olarak buton metninden farklı bir şey gönderilecekse */
  message?: string;
  to: string;
  effects?: Effect[];
  /** Sağlanmazsa seçenek kilitli (gri, üstü çizili) görünür */
  requires?: Condition;
  lockedReason?: string;
  /** Sağlanmazsa seçenek hiç görünmez */
  visibleIf?: Condition;
};

export type Branch = { if?: Condition; to: string };

export type StoryNode = {
  id: string;
  /** Hikaye günü (1–7); validasyon ve grafik için */
  day: number;
  title?: string;
  /** Dolu ise düğüm henüz yazılmadı: oyuncu buraya gelince "devamı yakında" görür */
  draft?: string;
  onEnter?: Effect[];
  steps: Step[];
  choices?: Choice[];
  /** Seçim yoksa otomatik geçiş; koşullu dallar sırayla denenir */
  next?: string | Branch[];
  /** Hikaye sonu: story.endings anahtarı */
  ending?: string;
  /** Bölüm (gün) sonu notu; grafik ve istatistik için */
  chapterEnd?: string;
  /** Bu düğümün dürtme metinleri; false = dürtme yok */
  nudges?: string[] | false;
};

export type EndingKind = 'iyi' | 'kismi' | 'kotu' | 'olum';

export type EndingDef = { kind: EndingKind; title: string; summary: string };

export type StatDef = { label: string; initial: number; min?: number; max?: number };

export type StoryDefs = {
  flags: Record<string, string>;
  injuries: Record<string, { label: string; description?: string }>;
  items: Record<string, string>;
  stats: Record<string, StatDef>;
};

export type Story = {
  id: string;
  /** İçerik değişince artır; kayıtlar yine oynatılır, sadece bilgi amaçlı */
  version: string;
  title: string;
  character: CharacterMeta;
  start: string;
  defs: StoryDefs;
  endings: Record<string, EndingDef>;
  /** Varsayılan dürtme metinleri (en fazla ilk 2'si kullanılır) */
  nudges: string[];
  /** Seçimler göründükten sonra dürtme zamanları */
  nudgeAfter: Duration[];
  /** Bu saatler arasında dürtme gönderilmez */
  quietHours: { from: ClockTime; to: ClockTime };
  nodes: Record<string, StoryNode>;
};
