import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDuration } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { MicIcon, PauseIcon, PlayIcon } from '@/ui/icons';

const BAR_COUNT = 32;

/** Mesaj id'sinden türetilen sabit dalga formu: her açılışta aynı görünür */
function waveform(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const bars: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const r = ((h >>> 0) % 1000) / 1000;
    // Konuşma gibi: kenarlarda alçak, ortada dalgalı
    const envelope = 0.45 + 0.55 * Math.sin((Math.PI * (i + 0.5)) / BAR_COUNT);
    bars.push(Math.max(0.12, Math.min(1, envelope * (0.35 + r * 0.75))));
  }
  return bars;
}

type Props = {
  id: string;
  durationSec: number;
  transcript: string;
  outgoing: boolean;
};

/**
 * Sesli mesaj: ses dosyası yok. Oynat'a basınca ilerleme çubuğu süre boyunca akar,
 * "Metne çevir" konuşmanın dökümünü açar.
 */
export function VoiceContent({ id, durationSec, transcript, outgoing }: Props) {
  const { palette } = useTheme();
  const bars = useMemo(() => waveform(id), [id]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const startRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    startRef.current = Date.now() - progress * durationSec * 1000;
    const timer = setInterval(() => {
      const p = (Date.now() - startRef.current) / (durationSec * 1000);
      if (p >= 1) {
        setProgress(0);
        setPlaying(false);
      } else {
        setProgress(p);
      }
    }, 80);
    return () => clearInterval(timer);
    // progress yalnızca başlangıç anında okunur
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, durationSec]);

  const played = palette.accent;
  const unplayed = palette.scheme === 'dark' ? 'rgba(233,237,239,0.35)' : 'rgba(84,101,111,0.4)';
  const shown = playing || progress > 0 ? durationSec * (1 - progress) : durationSec;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={() => setPlaying((p) => !p)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Duraklat' : 'Sesli mesajı oynat'}
          style={styles.play}
        >
          {playing ? <PauseIcon color={palette.textSecondary} /> : <PlayIcon color={palette.textSecondary} />}
        </Pressable>
        <View style={styles.waveCol}>
          <View style={styles.wave}>
            {bars.map((b, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  { height: 4 + b * 22, backgroundColor: i / BAR_COUNT < progress ? played : unplayed },
                ]}
              />
            ))}
            <View style={[styles.knob, { left: `${progress * 100}%`, backgroundColor: played }]} />
          </View>
          <Text style={[styles.duration, { color: palette.bubbleMeta }]}>{formatDuration(shown)}</Text>
        </View>
        {!outgoing ? (
          <View style={[styles.mic, { backgroundColor: palette.accent }]}>
            <MicIcon color="#FFFFFF" size={14} />
          </View>
        ) : null}
      </View>
      <Pressable onPress={() => setShowTranscript((s) => !s)} hitSlop={6} style={styles.transcriptToggle}>
        <Text style={[styles.transcriptLink, { color: palette.link }]}>
          {showTranscript ? 'Metni gizle' : 'Metne çevir'}
        </Text>
      </Pressable>
      {showTranscript ? (
        <Text style={[styles.transcript, { color: palette.text }]}>“{transcript}”</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 250, paddingTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  play: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  waveCol: { flex: 1, marginLeft: 4 },
  wave: { height: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bar: { width: 3, borderRadius: 2 },
  knob: { position: 'absolute', width: 11, height: 11, borderRadius: 6, marginLeft: -5, top: 8.5 },
  duration: { fontSize: 11, marginTop: 1 },
  mic: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  transcriptToggle: { alignSelf: 'flex-start', marginTop: 4, marginLeft: 38 },
  transcriptLink: { fontSize: 13, fontWeight: '500' },
  transcript: { fontSize: 14, lineHeight: 19, fontStyle: 'italic', marginTop: 4, marginLeft: 38, marginBottom: 2 },
});
