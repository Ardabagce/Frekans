import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useSvgId } from '@/ui/useSvgId';

import type { IllustrationProps } from './index';

/** İçeriden, buğulu ve karla yarı kapanmış bir pencere; dışarıda tipi. */
export function KarliPencereIllustration({ width, height }: IllustrationProps) {
  const kpSkyId = useSvgId('kp-sky');
  const kpWallId = useSvgId('kp-wall');
  return (
    <Svg width={width} height={height} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={kpSkyId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5E7482" />
          <Stop offset="1" stopColor="#B9C6CC" />
        </LinearGradient>
        <LinearGradient id={kpWallId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3B2A20" />
          <Stop offset="1" stopColor="#24180F" />
        </LinearGradient>
      </Defs>
      <Rect width={400} height={300} fill={`url(#${kpWallId})`} />
      {/* Ahşap kaplama çizgileri */}
      <G stroke="#1A110A" strokeWidth={2} opacity={0.5}>
        <Path d="M0 40h400M0 95h400M0 250h400" />
      </G>
      {/* Pencere boşluğu */}
      <Rect x={90} y={45} width={220} height={190} rx={4} fill={`url(#${kpSkyId})`} />
      {/* Uzak ağaç siluetleri */}
      <G fill="#6E828C" opacity={0.7}>
        <Path d="M110 200l14-40 14 40zM140 205l18-52 18 52zM230 205l16-46 16 46zM262 200l12-34 12 34z" />
      </G>
      {/* Yağan kar */}
      <G fill="#FFFFFF">
        <Circle cx={120} cy={70} r={2.5} opacity={0.9} />
        <Circle cx={150} cy={110} r={2} opacity={0.8} />
        <Circle cx={190} cy={80} r={3} />
        <Circle cx={230} cy={120} r={2} opacity={0.8} />
        <Circle cx={270} cy={65} r={2.5} />
        <Circle cx={285} cy={140} r={2} opacity={0.7} />
        <Circle cx={175} cy={150} r={2.5} opacity={0.9} />
        <Circle cx={210} cy={170} r={1.8} opacity={0.7} />
        <Circle cx={130} cy={160} r={2.2} />
        <Circle cx={250} cy={95} r={1.8} />
      </G>
      {/* Pencerenin alt yarısını kapatan kar yığını */}
      <Path d="M90 235V178c30-14 52-6 80-16 34-12 62 4 92-6 20-6 34-2 48 6v73z" fill="#EEF3F5" />
      <Path d="M90 192c40-10 70 0 110-8 40-8 70 2 110-2" stroke="#D4DEE3" strokeWidth={3} fill="none" />
      {/* Buğu */}
      <Rect x={90} y={45} width={220} height={190} fill="#FFFFFF" opacity={0.12} />
      {/* Kasa ve kayıt */}
      <G fill="none" stroke="#5A3E2B" strokeWidth={12}>
        <Rect x={90} y={45} width={220} height={190} />
        <Path d="M200 45v190M90 140h220" />
      </G>
      <Rect x={70} y={238} width={260} height={14} rx={3} fill="#6B4A33" />
    </Svg>
  );
}
