/**
 * Uygulama açıkken yeni mesaj geldiğinde ses ve titreşim.
 * (Uygulama kapalıyken bildirimler Faz 5'te push ile gelir.)
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { GameStore } from './GameStore';
import { getSettings } from './settings';

type AudioCtx = AudioContext;
let ctx: AudioCtx | null = null;

function audio(): AudioCtx | null {
  if (Platform.OS !== 'web') return null;
  try {
    const Ctor = (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/** Tarayıcılar sesi ancak bir kullanıcı dokunuşundan sonra açar */
function unlockOnFirstGesture() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return () => {};
  const unlock = () => {
    const c = audio();
    if (c && c.state === 'suspended') void c.resume();
  };
  document.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('keydown', unlock);
  return () => {
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
}

/** İki kısa, yumuşak "blip": dosya gerektirmeyen özgün bildirim sesi */
export function playMessageSound() {
  const c = audio();
  if (!c || c.state !== 'running') return;
  const t0 = c.currentTime;
  [
    [740, 0],
    [988, 0.09],
  ].forEach(([freq, offset]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq!;
    gain.gain.setValueAtTime(0.0001, t0 + offset!);
    gain.gain.exponentialRampToValueAtTime(0.12, t0 + offset! + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset! + 0.14);
    osc.connect(gain).connect(c.destination);
    osc.start(t0 + offset!);
    osc.stop(t0 + offset! + 0.16);
  });
}

export function vibrate() {
  try {
    (globalThis as { navigator?: Navigator }).navigator?.vibrate?.(55);
  } catch {
    /* desteklenmiyor */
  }
}

function isVisible() {
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}

/** Kök düzende bir kez çağrılır */
export function useIncomingAlerts() {
  useEffect(() => {
    const off = unlockOnFirstGesture();
    let lastAlert = 0;
    const onIncoming = () => {
      if (!isVisible()) return;
      const now = Date.now();
      if (now - lastAlert < 700) return; // art arda düşen mesajlarda tek ses
      lastAlert = now;
      const s = getSettings();
      if (s.sound) playMessageSound();
      if (s.vibration) vibrate();
    };
    GameStore.incoming.add(onIncoming);
    return () => {
      off();
      GameStore.incoming.delete(onIncoming);
    };
  }, []);
}
