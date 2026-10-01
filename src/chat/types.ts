/**
 * Sohbet arayüzünün gösterdiği veri modeli.
 * Faz 1'de sahte sürücü, Faz 2'den itibaren hikaye motoru bu tipleri üretir.
 */

import type { IllustrationId } from '@/ui/illustrations';

export type Sender = 'character' | 'player' | 'system';

/** Oyuncunun gönderdiği mesajın teslim durumu (tek tik / çift tik / mavi çift tik) */
export type DeliveryStatus = 'sent' | 'delivered' | 'read';

export type MessageContent =
  | { kind: 'text'; text: string }
  | { kind: 'voice'; durationSec: number; transcript: string }
  | { kind: 'photo'; image: IllustrationId; caption?: string }
  | { kind: 'location'; label: string; lat: number; lng: number }
  | { kind: 'deleted' }
  | { kind: 'system'; text: string; tone?: 'info' | 'warning' };

export type ChatMessage = {
  id: string;
  sender: Sender;
  /** Mesajın sohbete düştüğü an (epoch ms) */
  at: number;
  content: MessageContent;
  /** Sadece oyuncu mesajlarında */
  status?: DeliveryStatus;
};

/** Başlıktaki durum satırı */
export type Presence =
  | { kind: 'online' }
  | { kind: 'typing' }
  | { kind: 'lastSeen'; at: number }
  | { kind: 'unknown' };

export type ChoiceOption = {
  id: string;
  text: string;
  locked: boolean;
  lockedReason?: string;
};
