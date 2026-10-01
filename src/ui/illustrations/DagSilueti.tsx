import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useSvgId } from '@/ui/useSvgId';

import type { IllustrationProps } from './index';

/** Alacakaranlıkta karlı sırtlar; yamaçta tek bir ışık. */
export function DagSiluetiIllustration({ width, height }: IllustrationProps) {
  const dsSkyId = useSvgId('ds-sky');
  return (
    <Svg width={width} height={height} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={dsSkyId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2A3550" />
          <Stop offset="0.6" stopColor="#7D6E86" />
          <Stop offset="1" stopColor="#D9A88A" />
        </LinearGradient>
      </Defs>
      <Rect width={400} height={300} fill={`url(#${dsSkyId})`} />
      <G fill="#FFFFFF" opacity={0.8}>
        <Circle cx={60} cy={40} r={1.4} />
        <Circle cx={140} cy={25} r={1} />
        <Circle cx={300} cy={50} r={1.3} />
        <Circle cx={350} cy={22} r={1} />
      </G>
      {/* Uzak sıra */}
      <Path d="M0 190l60-70 40 30 70-90 60 70 40-40 70 80 60-40v160H0z" fill="#56607A" />
      <Path d="M170 60l-22 30 14-6 8 12 10-14 12 8zM290 90l-16 18 10-2 6 8 8-10z" fill="#E6E9F0" opacity={0.85} />
      {/* Orta sıra */}
      <Path d="M0 230l80-60 50 30 60-70 70 80 50-30 90 60v60H0z" fill="#3A4258" />
      <Path d="M190 130l-18 22 12-4 6 10 8-12 10 6z" fill="#DDE2EA" opacity={0.8} />
      {/* Ön yamaç */}
      <Path d="M0 300v-40c60-30 120-10 180-30s140-10 220 10v60z" fill="#E9EEF3" />
      <Path d="M0 300v-20c80-18 160 0 240-12s110 4 160 8v24z" fill="#CBD5DE" />
      {/* Yamaçta küçük ev ve ışığı */}
      <Path d="M262 244l16-14 16 14v14h-32z" fill="#3B2A20" />
      <Path d="M258 246l20-18 20 18" stroke="#F4F6F8" strokeWidth={4} fill="none" />
      <Rect x={272} y={248} width={8} height={7} fill="#F2B45A" />
      <Circle cx={276} cy={251} r={12} fill="#F2B45A" opacity={0.18} />
    </Svg>
  );
}
