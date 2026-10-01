import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useSvgId } from '@/ui/useSvgId';

type Props = {
  initials: string;
  color: string;
  size?: number;
  dimmed?: boolean;
};

/**
 * Karakter avatarı: renk geçişli daire, alt kısımda soyut bir dağ silueti, üstünde baş harf.
 * Her hikaye kendi rengini verir; fotoğraf kullanılmaz.
 */
export function Avatar({ initials, color, size = 48, dimmed = false }: Props) {
  const gradId = useSvgId('av');
  return (
    <View style={{ width: size, height: size, opacity: dimmed ? 0.55 : 1 }}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.75} />
            <Stop offset="1" stopColor={color} />
          </LinearGradient>
        </Defs>
        <Circle cx={24} cy={24} r={24} fill={`url(#${gradId})`} />
        <Path d="M4 38l10-10 6 5 9-11 15 16a24 24 0 0 1-40 0z" fill="#FFFFFF" opacity={0.18} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.initials, { fontSize: size * 0.42 }]} allowFontScaling={false}>
          {initials}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontWeight: '600' },
});
