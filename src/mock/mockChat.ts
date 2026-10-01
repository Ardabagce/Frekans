/**
 * FAZ 1 — SAHTE SOHBET SÜRÜCÜSÜ
 * Arayüzü gerçekçi bir akışla denemek için zamanlayıcılarla çalışan küçük bir senaryo.
 * Faz 2'de hikaye motoru aynı `ChatSnapshot` biçimini üretecek ve bu dosya kalkacak.
 */
import { useSyncExternalStore } from 'react';

import type { ChatMessage, ChoiceOption, MessageContent, Presence } from '@/chat/types';
import { typingDurationMs } from '@/chat/typing';

export type ChatSnapshot = {
  messages: ChatMessage[];
  presence: Presence;
  choices: ChoiceOption[] | null;
  /** Oyuncunun sohbeti en son gördüğü an; okunmamış rozeti buna göre hesaplanır */
  lastReadAt: number;
  /** Seçim yokken alt çubukta görünen metin */
  idleHint: string;
};

const MIN = 60_000;

/** Belirli bir günün belirli saatine (yerel) denk gelen zaman damgası */
function at(dayOffset: number, hh: number, mm: number): number {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d.getTime();
}

let seq = 0;
const nextId = () => `m${++seq}`;

function history(): ChatMessage[] {
  const now = Date.now();
  const c = (t: number, content: MessageContent): ChatMessage => ({ id: nextId(), sender: 'character', at: t, content });
  const p = (t: number, text: string): ChatMessage => ({
    id: nextId(),
    sender: 'player',
    at: t,
    content: { kind: 'text', text },
    status: 'read',
  });
  const s = (t: number, text: string, tone: 'info' | 'warning' = 'info'): ChatMessage => ({
    id: nextId(),
    sender: 'system',
    at: t,
    content: { kind: 'system', text, tone },
  });

  return [
    s(at(-2, 22, 13), 'Mesajlar zayıf bir frekans üzerinden iletiliyor. Gecikmeler olabilir.'),
    c(at(-2, 22, 14), { kind: 'text', text: 'merhaba?? biri var mı' }),
    c(at(-2, 22, 14), { kind: 'text', text: 'lütfen biri okusun bunu' }),
    p(at(-2, 22, 16), 'Evet, buradayım. Kimsin?'),
    c(at(-2, 22, 17), { kind: 'text', text: 'ben deniz. dağdayım, kar fırtınası var, kimseye ulaşaamıyorum' }),
    c(at(-2, 22, 17), { kind: 'text', text: '*ulaşamıyorum' }),

    c(at(-1, 8, 2), { kind: 'photo', image: 'karli-pencere', caption: 'sabah dışarısı böyle' }),
    c(at(-1, 8, 3), {
      kind: 'voice',
      durationSec: 14,
      transcript: 'Rüzgar o kadar sert ki kapıyı zor açtım. Kar dizime kadar, patikayı hiç göremiyorum.',
    }),
    p(at(-1, 8, 6), 'Sakin ol. Tam olarak neredesin?'),
    c(at(-1, 8, 9), { kind: 'location', label: 'Dağ evi · Kaçkar, Yukarı Kavrun üstü', lat: 40.8862, lng: 41.1517 }),
    c(at(-1, 8, 10), { kind: 'deleted' }),
    s(at(-1, 8, 11), 'Sinyal zayıf', 'warning'),
    c(at(-1, 23, 4), { kind: 'text', text: 'pil %31. sabah yazarım' }),

    c(now - 7 * MIN, { kind: 'text', text: 'günaydın. gece hiç uyuyamadım' }),
    c(now - 6 * MIN, { kind: 'photo', image: 'soba', caption: 'soba sönmüş' }),
  ];
}

function initialState(): ChatSnapshot {
  seq = 0;
  const messages = history();
  return {
    messages,
    presence: { kind: 'lastSeen', at: Date.now() - 6 * MIN },
    choices: null,
    lastReadAt: messages[messages.length - 4]?.at ?? 0,
    idleHint: 'Deniz’den haber bekleniyor…',
  };
}

// ---- Basit dış depo (useSyncExternalStore) ----

let state: ChatSnapshot = initialState();
const listeners = new Set<() => void>();

function setState(patch: Partial<ChatSnapshot> | ((s: ChatSnapshot) => Partial<ChatSnapshot>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureRunning();
  return () => listeners.delete(listener);
}

export function useMockChat(): ChatSnapshot {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function markRead() {
  const last = state.messages[state.messages.length - 1];
  if (last && last.at > state.lastReadAt) setState({ lastReadAt: last.at });
}

// ---- Senaryo yürütücü ----

let runToken = 0;
let running = false;
let pendingChoice: ((id: string) => void) | null = null;

class Cancelled extends Error {}

function sleep(ms: number, token: number) {
  return new Promise<void>((resolve, reject) =>
    setTimeout(() => (token === runToken ? resolve() : reject(new Cancelled())), ms),
  );
}

function push(msg: Omit<ChatMessage, 'id' | 'at'>) {
  const full: ChatMessage = { ...msg, id: nextId(), at: Date.now() };
  setState((s) => ({ messages: [...s.messages, full] }));
  return full.id;
}

function setStatus(id: string, status: ChatMessage['status']) {
  setState((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, status } : m)) }));
}

async function say(token: number, content: MessageContent, pause = 700) {
  await sleep(pause, token);
  const typing = content.kind === 'text' ? typingDurationMs(content.text) : content.kind === 'voice' ? 2500 : 1600;
  setState({ presence: { kind: 'typing' } });
  await sleep(typing, token);
  push({ sender: 'character', content });
  setState({ presence: { kind: 'online' } });
}

const text = (t: string): MessageContent => ({ kind: 'text', text: t });

function system(t: string, tone: 'info' | 'warning' = 'info') {
  push({ sender: 'system', content: { kind: 'system', text: t, tone } });
}

function ask(token: number, choices: ChoiceOption[]): Promise<string> {
  if (token !== runToken) return Promise.reject(new Cancelled());
  setState({ choices });
  return new Promise((resolve) => {
    pendingChoice = (id) => {
      pendingChoice = null;
      setState({ choices: null });
      resolve(id);
    };
  });
}

/** Oyuncunun seçimi: kendi mesajı olarak düşer, tik'ler ilerler */
export function choose(choiceId: string) {
  const option = state.choices?.find((c) => c.id === choiceId);
  if (!option || option.locked || !pendingChoice) return;
  const token = runToken;
  const id = push({ sender: 'player', content: { kind: 'text', text: option.text }, status: 'sent' });
  setTimeout(() => token === runToken && setStatus(id, 'delivered'), 700);
  setTimeout(() => token === runToken && setStatus(id, 'read'), 1600);
  pendingChoice(choiceId);
}

export function resetMockChat() {
  runToken++;
  pendingChoice = null;
  running = false;
  state = initialState();
  listeners.forEach((l) => l());
  ensureRunning();
}

function ensureRunning() {
  if (running) return;
  running = true;
  const token = runToken;
  script(token).catch((e) => {
    if (!(e instanceof Cancelled)) console.error(e);
  });
}

async function script(t: number) {
  await sleep(1500, t);
  setState({ presence: { kind: 'online' } });
  await say(t, text('orda mısın'), 900);
  await say(t, text('elim çok üşüyor, sobayı yakmam lazım ama kibritler nemli olmuş'));
  await say(t, text('3 tane kuru var gibi. ne yapayım'), 400);

  const first = await ask(t, [
    { id: 'cira', text: 'Önce ince çıralarla başla, kibriti boşa harcama', locked: false },
    { id: 'gaz', text: 'Gaz yağı dök, hızlı tutuşsun', locked: false },
    { id: 'ip', text: 'Dışarı çık, ipi kullanıp odunluğa tırman', locked: true, lockedReason: 'Elin yanık, ipi tutamazsın.' },
  ]);

  if (first === 'cira') {
    await say(t, text('tamam mantıklı'), 1200);
    await say(t, text('bıçakla ince ince yontuyorum'));
  } else {
    await say(t, text('gaz yağı mı?? emin misin'), 1200);
    await say(t, text('neyse deniyorum'));
  }

  await say(t, text('telefonu kapatıyorum, pil gidiyor. birazdan yazarım'), 600);
  setState({ presence: { kind: 'lastSeen', at: Date.now() } });
  await sleep(1500, t);
  system('Deniz’in bağlantısı koptu', 'warning');

  await sleep(20_000, t);
  setState({ presence: { kind: 'online' } });
  if (first === 'cira') {
    await say(t, text('YANDI'), 600);
    await say(t, text('cidden yandı. ellerimi ısıtıyorum şu an'), 400);
    await say(t, { kind: 'voice', durationSec: 9, transcript: 'Duyuyor musun? Çıtırdıyor. Teşekkür ederim, gerçekten.' });
  } else {
    await say(t, text('elimi yaktım'), 600);
    await say(t, text('alev bir anda parladı, sağ elim'), 300);
    await say(t, text('kar bastım üstüne. çok acıyor'), 300);
  }

  const again = await ask(t, [
    { id: 'tekrar', text: 'Baştan oynat (demo)', locked: false },
    { id: 'kal', text: 'Burada kal', locked: false },
  ]);
  if (again === 'tekrar') {
    await sleep(800, t);
    resetMockChat();
  } else {
    await say(t, text('bu sadece bir demo akışı. gerçek hikaye faz 3’te geliyor'), 1000);
  }
}
