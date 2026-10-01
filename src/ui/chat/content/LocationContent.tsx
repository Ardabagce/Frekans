import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { useMediaWidth } from '@/ui/layout';

type Props = { label: string; lat: number; lng: number };

function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'K' : 'G';
  const ew = lng >= 0 ? 'D' : 'B';
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

/** Konum mesajı: stilize bir eş yükselti haritası, işaretçi, etiket ve koordinat */
export function LocationContent({ label, lat, lng }: Props) {
  const { palette } = useTheme();
  const width = useMediaWidth();
  const height = Math.round(width * 0.5);
  const dark = palette.scheme === 'dark';
  const land = dark ? '#22343A' : '#E8EEE6';
  const contour = dark ? '#3D5A60' : '#B9C9B4';
  const snow = dark ? '#2C4148' : '#F6F9FA';

  return (
    <View>
      <View style={[styles.map, { width, height }]}>
        <Svg width={width} height={height} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice">
          <Rect width={300} height={150} fill={land} />
          <G fill="none" stroke={contour} strokeWidth={1.2}>
            <Path d="M-10 120c40-20 70-6 110-26s70-40 120-30 60 20 90 10" />
            <Path d="M-10 100c40-18 70-8 100-26s70-38 110-28 70 18 110 6" />
            <Path d="M30 150c10-30 40-40 70-44s60-30 90-26 60 26 120 16" />
            <Path d="M60 60c30-20 60-26 90-20s50 10 70 0" />
            <Path d="M100 40c20-10 40-12 60-6s30 6 40 0" />
          </G>
          <Path d="M120 30c18-10 40-10 56-2-10 6-26 10-56 2z" fill={snow} />
          {/* Patika */}
          <Path d="M10 140c30-10 50-30 70-34s40-6 60-24 20-10 10-6" stroke="#C0864A" strokeWidth={2} strokeDasharray="4 4" fill="none" />
          {/* Dere */}
          <Path d="M300 30c-30 14-40 30-70 40s-40 30-50 80" stroke={dark ? '#3E6E8C' : '#9CC6E0'} strokeWidth={3} fill="none" />
          {/* İşaretçi */}
          <G transform="translate(150 78)">
            <Circle r={16} fill="#E04A3A" opacity={0.18} />
            <Path d="M0-22a9 9 0 0 0-9 9c0 7 9 17 9 17s9-10 9-17a9 9 0 0 0-9-9z" fill="#E04A3A" />
            <Circle cy={-13} r={3.4} fill="#FFFFFF" />
          </G>
        </Svg>
      </View>
      <Text style={[styles.label, { color: palette.text, maxWidth: width }]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.coord, { color: palette.textSecondary }]}>{formatCoord(lat, lng)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: 6, overflow: 'hidden' },
  label: { fontSize: 15, fontWeight: '500', paddingHorizontal: 4, paddingTop: 6 },
  coord: { fontSize: 12, paddingHorizontal: 4, paddingTop: 1, paddingBottom: 14 },
});
