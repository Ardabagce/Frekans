/**
 * Sanal saat. Normal oyunda gerçek saatle aynıdır (speed 1, kayma yok).
 * Geliştirici modunda hızlandırılabilir (60x) veya bir sonraki olaya atlanabilir.
 * Saat ayarı kayıtla birlikte saklanır; böylece sayfa yenilense de zaman çizelgesi tutarlı kalır.
 */
export type ClockState = {
  speed: number;
  /** Bu gerçek anda sanal saat `anchorVirtual` idi */
  anchorReal: number;
  anchorVirtual: number;
  /** 'Anında' modu: seçim beklenmiyorsa saat kendiliğinden bir sonraki olaya atlar */
  instant?: boolean;
};

export const REAL_CLOCK: ClockState = { speed: 1, anchorReal: 0, anchorVirtual: 0 };

export function virtualNow(clock: ClockState, realNow: number = Date.now()): number {
  return clock.anchorVirtual + (realNow - clock.anchorReal) * clock.speed;
}

/** Sanal zamanda `virtualDelta` sonra olacak bir şey için gerçek bekleme süresi */
export function realDelay(clock: ClockState, virtualDelta: number): number {
  return Math.max(0, virtualDelta / clock.speed);
}

export function withSpeed(clock: ClockState, speed: number, realNow: number = Date.now()): ClockState {
  return { speed, anchorReal: realNow, anchorVirtual: virtualNow(clock, realNow), instant: clock.instant };
}

/** Sanal saati ileri sar (geri sarmaya izin yok: zaman çizelgesi bozulur) */
export function advancedTo(clock: ClockState, virtualTarget: number, realNow: number = Date.now()): ClockState {
  const current = virtualNow(clock, realNow);
  return { ...clock, anchorReal: realNow, anchorVirtual: Math.max(current, virtualTarget) };
}

export function isRealClock(clock: ClockState): boolean {
  return clock.speed === 1 && clock.anchorReal === clock.anchorVirtual && !clock.instant;
}
