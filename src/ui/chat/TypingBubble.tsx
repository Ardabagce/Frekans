import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { BubbleTail, TAIL_WIDTH } from './BubbleTail';

const useNativeDriver = Platform.OS !== 'web';

/** Karakter yazarken listenin en altında beliren üç noktalı balon */
export function TypingBubble({ withTail }: { withTail: boolean }) {
  const { palette } = useTheme();
  const [dots] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));
  const [appear] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(appear, { toValue: 1, duration: 160, useNativeDriver, easing: Easing.out(Easing.quad) }).start();
    const loops = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver, easing: Easing.inOut(Easing.quad) }),
          Animated.delay((2 - i) * 160 + 200),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [appear, dots]);

  return (
    <Animated.View
      style={[styles.row, { marginTop: withTail ? 6 : 2, opacity: appear }]}
      accessibilityLabel="yazıyor"
    >
      <View
        style={[
          styles.bubble,
          { backgroundColor: palette.bubbleIn, boxShadow: `0px 1px 0.5px ${palette.bubbleShadow}` },
          withTail && styles.tail,
        ]}
      >
        {withTail ? <BubbleTail side="left" color={palette.bubbleIn} /> : null}
        {dots.map((v, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: palette.textSecondary,
                opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }],
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 8 + TAIL_WIDTH, flexDirection: 'row', marginBottom: 4 },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 36,
  },
  tail: { borderTopLeftRadius: 0 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
