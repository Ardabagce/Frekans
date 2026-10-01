import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ChoiceOption } from '@/chat/types';
import { useTheme } from '@/theme/ThemeProvider';
import { LockIcon } from '@/ui/icons';

type Props = {
  choices: ChoiceOption[] | null;
  onChoose: (id: string) => void;
  /** Seçim yokken sahte yazı alanında görünen metin */
  idleHint: string;
};

const useNativeDriver = Platform.OS !== 'web';

/**
 * Yazı alanının yerini alan seçim çubuğu.
 * Kilitli seçimler gizlenmez: gri, üstü çizili ve altında sebebiyle görünür.
 */
export function ChoiceBar({ choices, onChoose, idleHint }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [enter] = useState(() => new Animated.Value(0));
  const hasChoices = Boolean(choices && choices.length > 0);

  useEffect(() => {
    enter.setValue(0);
    if (hasChoices) {
      Animated.timing(enter, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver }).start();
    }
  }, [choices, hasChoices, enter]);

  return (
    <View style={[styles.bar, { backgroundColor: palette.composerBar, paddingBottom: 8 + insets.bottom }]}>
      {hasChoices ? (
        <Animated.View
          style={{
            gap: 6,
            opacity: enter,
            transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          {choices!.map((c) =>
            c.locked ? (
              <View
                key={c.id}
                testID={`choice-locked-${c.id}`}
                style={[styles.option, { backgroundColor: palette.lockedBackground, borderColor: 'transparent' }]}
                accessibilityState={{ disabled: true }}
                accessibilityLabel={`${c.text}. Kilitli: ${c.lockedReason ?? ''}`}
              >
                <View style={styles.lockedRow}>
                  <LockIcon color={palette.lockedText} />
                  <Text style={[styles.optionText, styles.struck, { color: palette.lockedText }]}>{c.text}</Text>
                </View>
                {c.lockedReason ? (
                  <Text style={[styles.reason, { color: palette.lockedReason }]}>{c.lockedReason}</Text>
                ) : null}
              </View>
            ) : (
              <Pressable
                key={c.id}
                testID={`choice-${c.id}`}
                onPress={() => onChoose(c.id)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: pressed ? palette.choicePressed : palette.choiceBackground,
                    borderColor: palette.choiceBorder,
                  },
                ]}
              >
                <Text style={[styles.optionText, { color: palette.choiceText }]}>{c.text}</Text>
              </Pressable>
            ),
          )}
        </Animated.View>
      ) : (
        <View style={[styles.idle, { backgroundColor: palette.composerField }]}>
          <Text style={[styles.idleText, { color: palette.composerPlaceholder }]} numberOfLines={1}>
            {idleHint}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 8, paddingTop: 8 },
  option: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 42,
    justifyContent: 'center',
  },
  optionText: { fontSize: 15, lineHeight: 20 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  struck: { textDecorationLine: 'line-through', flexShrink: 1 },
  reason: { fontSize: 12.5, marginTop: 3, marginLeft: 21, fontStyle: 'italic' },
  idle: { height: 44, borderRadius: 22, justifyContent: 'center', paddingHorizontal: 18 },
  idleText: { fontSize: 15 },
});
