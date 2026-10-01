/**
 * GELİŞTİRİCİ MODU — sohbet başlığına 3 saniye içinde 7 kez dokununca açılır.
 * Zaman hızlandırma, olaya atlama, düğüme atlama, durum görüntüleme, sıfırlama.
 * Canlıda kapatmak için: EXPO_PUBLIC_DEV_TOOLS=false
 */
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { nextOccurrence } from '@/engine/calendar';
import { formatSpan, HOUR, MINUTE } from '@/engine/duration';
import type { GameSnapshot, GameStore } from '@/game/GameStore';
import { formatClock, formatLongDate } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { FormButton, FormSection, KeyValue as Line } from '@/ui/form';

export const DEV_TOOLS_ENABLED = process.env.EXPO_PUBLIC_DEV_TOOLS !== 'false';

type Props = { visible: boolean; onClose: () => void; store: GameStore; snap: GameSnapshot };

export function DevPanel({ visible, onClose, store, snap }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const { view, clock, dev } = snap;
  const story = store.story;

  const nodes = useMemo(() => {
    const q = filter.trim().toLocaleLowerCase('tr');
    return Object.values(story.nodes)
      .filter((n) => !q || n.id.includes(q) || (n.title ?? '').toLocaleLowerCase('tr').includes(q))
      .sort((a, b) => a.day - b.day || a.id.localeCompare(b.id))
      .slice(0, 60);
  }, [filter, story]);

  const speedLabel = clock.instant ? 'anında' : `${clock.speed}x`;
  const C = palette;
  const rel = (t: number) => (t >= view.now ? `+${formatSpan(t - view.now)}` : `${formatSpan(view.now - t)} önce`);
  const chips = (rec: Record<string, unknown>, empty: string) => {
    const keys = Object.keys(rec);
    return keys.length ? keys.join(' · ') : empty;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: C.background, paddingBottom: insets.bottom + 8 }]}>
          <View style={[styles.head, { borderColor: C.divider }]}>
            <Text style={[styles.headTitle, { color: C.text }]}>Geliştirici modu</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Kapat">
              <Text style={[styles.close, { color: C.accent }]}>Kapat</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <FormSection bordered title="Zaman">
              <Line k="Oyun saati" v={`${formatLongDate(view.now)} ${formatClock(view.now)}`} />
              <Line k="Hız" v={speedLabel} />
              <View style={styles.row}>
                <FormButton small label="1x" active={clock.speed === 1 && !clock.instant} onPress={() => store.setSpeed(1)} />
                <FormButton small label="60x" active={clock.speed === 60 && !clock.instant} onPress={() => store.setSpeed(60)} />
                <FormButton small label="Anında" active={Boolean(clock.instant)} onPress={() => store.setSpeed(1, true)} />
              </View>
              <View style={styles.row}>
                <FormButton small label="Sonraki olay" onPress={() => store.skipToNext()} />
                <FormButton small label="+10 dk" onPress={() => store.skipBy(10 * MINUTE)} />
                <FormButton small label="+1 saat" onPress={() => store.skipBy(HOUR)} />
                <FormButton small label="08:00'e" onPress={() => store.skipBy(nextOccurrence(view.now, '08:00') - view.now)} />
              </View>
              <Text style={[styles.hint, { color: C.textSecondary }]}>
                Anında: seçim beklenmiyorsa saat kendiliğinden bir sonraki olaya atlar. Saat ayarı kayıtla saklanır.
              </Text>
            </FormSection>

            <FormSection bordered title="Durum">
              <Line k="Düğüm" v={view.currentNode} />
              <Line k="Bekleyen" v={`${dev.pendingKind} (${rel(dev.pendingAt)})`} />
              <Line k="Sonraki değişim" v={view.nextChangeAt ? rel(view.nextChangeAt) : '—'} />
              <Line k="Kayıtlı olay" v={String(dev.eventCount)} />
              <Line k="Oyun no" v={String(snap.playthrough)} />
              <Line k="Görülen sonlar" v={snap.endingsSeen.join(', ') || '—'} />
              {dev.replayError ? <Line k="Kayıt uyarısı" v={dev.replayError} /> : null}
              {view.error ? <Line k="Motor hatası" v={view.error} /> : null}
            </FormSection>

            <FormSection bordered title="Değerler">
              {Object.entries(dev.vars.stats).map(([k, v]) => (
                <View key={k} style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: C.textSecondary }]}>{story.defs.stats[k]?.label ?? k}</Text>
                  <View style={[styles.statTrack, { backgroundColor: C.divider }]}>
                    <View style={[styles.statFill, { width: `${Math.max(0, Math.min(100, v))}%`, backgroundColor: C.accent }]} />
                  </View>
                  <Text style={[styles.statValue, { color: C.text }]}>{v}</Text>
                </View>
              ))}
              <Line k="Bayraklar" v={chips(dev.vars.flags, '—')} />
              <Line k="Yaralar" v={chips(dev.vars.injuries, 'yok')} />
              <Line k="Envanter" v={chips(dev.vars.items, 'boş')} />
            </FormSection>

            <FormSection bordered title="Düğüme atla">
              <TextInput
                value={filter}
                onChangeText={setFilter}
                placeholder="ara: g1_soba, uyku…"
                placeholderTextColor={C.composerPlaceholder}
                style={[styles.input, { color: C.text, borderColor: C.choiceBorder, backgroundColor: C.composerField }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {message ? <Text style={[styles.hint, { color: C.lockedReason }]}>{message}</Text> : null}
              {nodes.map((n) => (
                <Pressable
                  key={n.id}
                  onPress={() => {
                    const err = store.jumpTo(n.id);
                    setMessage(err);
                    if (!err) onClose();
                  }}
                  style={({ pressed }) => [styles.nodeRow, { borderColor: C.divider }, pressed && { backgroundColor: C.choicePressed }]}
                >
                  <Text style={[styles.nodeDay, { color: C.accent }]}>G{n.day}</Text>
                  <Text style={[styles.nodeId, { color: C.text }]} numberOfLines={1}>
                    {n.id}
                    {n.draft !== undefined ? ' ✎' : ''}
                    {n.ending ? ' 🏁' : ''}
                  </Text>
                  <Text style={[styles.nodeTitle, { color: C.textSecondary }]} numberOfLines={1}>
                    {n.title ?? ''}
                  </Text>
                </Pressable>
              ))}
            </FormSection>

            <FormSection bordered title="Sıfırla">
              <View style={styles.row}>
                <FormButton small label="Baştan başlat" onPress={() => { store.restart(); onClose(); }} />
                {confirmReset ? (
                  <FormButton small label="Eminim, her şeyi sil" danger onPress={() => { store.hardReset(); setConfirmReset(false); onClose(); }} />
                ) : (
                  <FormButton small label="Tüm kaydı sil…" danger onPress={() => setConfirmReset(true)} />
                )}
              </View>
            </FormSection>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 560, maxHeight: '88%', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headTitle: { fontSize: 17, fontWeight: '700' },
  close: { fontSize: 15, fontWeight: '600' },
  body: { padding: 12, gap: 12 },
  section: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, gap: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  btn: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, height: 34, justifyContent: 'center' },
  btnText: { fontSize: 13.5, fontWeight: '600' },
  hint: { fontSize: 12, marginTop: 4 },
  line: { fontSize: 13.5, lineHeight: 19 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { width: 56, fontSize: 13 },
  statTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  statFill: { height: 8, borderRadius: 4 },
  statValue: { width: 30, textAlign: 'right', fontSize: 13, fontVariant: ['tabular-nums'] },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 40, fontSize: 16 },
  nodeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  nodeDay: { width: 24, fontSize: 12, fontWeight: '700' },
  nodeId: { fontSize: 13.5, fontWeight: '600', maxWidth: '45%' },
  nodeTitle: { flex: 1, fontSize: 12.5 },
});
