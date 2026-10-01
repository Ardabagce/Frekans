import { useEffect, useState } from 'react';

/** Belirli aralıklarla yenilenen "şimdi". "Bugün/Dün" ve "son görülme" etiketleri gece yarısında doğru dönsün diye. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
