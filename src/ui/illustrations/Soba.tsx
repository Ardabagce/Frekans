import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useSvgId } from '@/ui/useSvgId';

import type { IllustrationProps } from './index';

/** Karanlık bir odada, kapağı aralık eski bir döküm soba. */
export function SobaIllustration({ width, height }: IllustrationProps) {
  const sbGlowId = useSvgId('sb-glow');
  const sbFireId = useSvgId('sb-fire');
  return (
    <Svg width={width} height={height} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <RadialGradient id={sbGlowId} cx="0.5" cy="0.62" r="0.55">
          <Stop offset="0" stopColor="#E9873A" stopOpacity={0.55} />
          <Stop offset="1" stopColor="#1A120D" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={sbFireId} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#F7C25B" />
          <Stop offset="1" stopColor="#D2481F" />
        </LinearGradient>
      </Defs>
      <Rect width={400} height={300} fill="#1A120D" />
      <Rect width={400} height={300} fill={`url(#${sbGlowId})`} />
      {/* Zemin */}
      <Path d="M0 250h400v50H0z" fill="#2A1C13" />
      {/* Boru */}
      <Rect x={186} y={0} width={28} height={110} fill="#2B2B2E" />
      <Rect x={180} y={100} width={40} height={12} rx={2} fill="#38383C" />
      {/* Gövde */}
      <Rect x={120} y={110} width={160} height={130} rx={10} fill="#323236" />
      <Rect x={112} y={104} width={176} height={14} rx={4} fill="#3E3E43" />
      {/* Kapak (aralık) ve ateş */}
      <Rect x={150} y={150} width={100} height={64} rx={6} fill="#120C09" />
      <G>
        <Path d="M168 214c-4-20 10-26 8-40 12 10 14 22 12 30 6-6 6-16 4-24 14 12 20 22 16 34z" fill={`url(#${sbFireId})`} />
        <Path d="M196 214c-2-12 6-16 6-26 8 8 12 16 10 26z" fill="#F7D57A" opacity={0.85} />
      </G>
      <Path d="M250 150l34-12v84l-34-8z" fill="#2A2A2E" stroke="#47474D" strokeWidth={2} />
      <Circle cx={274} cy={182} r={4} fill="#6A6A70" />
      {/* Ayaklar */}
      <Rect x={130} y={238} width={14} height={16} fill="#2B2B2E" />
      <Rect x={256} y={238} width={14} height={16} fill="#2B2B2E" />
      {/* Yanında odun */}
      <G fill="#5C3B24" stroke="#3A2414" strokeWidth={2}>
        <Rect x={300} y={222} width={70} height={16} rx={8} />
        <Rect x={308} y={206} width={60} height={16} rx={8} />
        <Rect x={296} y={238} width={78} height={14} rx={7} />
      </G>
      <G fill="#C79A6B">
        <Circle cx={304} cy={230} r={5} />
        <Circle cx={312} cy={214} r={5} />
      </G>
    </Svg>
  );
}
