import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = { size?: number; color: string };

export function BackIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill={color} />
    </Svg>
  );
}

export function LockIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-7-2a2 2 0 1 1 4 0v2h-4V7zm2 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
        fill={color}
      />
    </Svg>
  );
}

export function PlayIcon({ size = 28, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 5.5v13a1 1 0 0 0 1.53.85l10.4-6.5a1 1 0 0 0 0-1.7L9.53 4.65A1 1 0 0 0 8 5.5z" fill={color} />
    </Svg>
  );
}

export function PauseIcon({ size = 28, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill={color} />
    </Svg>
  );
}

export function MicIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 0 0-7 0v6A3.5 3.5 0 0 0 12 15zm6-3.5a6 6 0 0 1-12 0H4.5a7.5 7.5 0 0 0 6.75 7.46V21h1.5v-2.04A7.5 7.5 0 0 0 19.5 11.5H18z"
        fill={color}
      />
    </Svg>
  );
}

export function CameraIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M9 4 7.17 6H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.17L15 4H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
        fill={color}
      />
    </Svg>
  );
}

export function PinIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
        fill={color}
      />
    </Svg>
  );
}

export function BanIcon({ size = 15, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M6 6l12 12" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" fill={color} />
    </Svg>
  );
}

export function ThemeIcon({ size = 22, color }: IconProps) {
  // Yarısı dolu daire: açık/koyu/sistem geçişi
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M12 4a8 8 0 0 1 0 16z" fill={color} />
    </Svg>
  );
}

export function SignalIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 18h3v3H3zM8.5 14h3v7h-3zM14 10h3v11h-3z" fill={color} />
      <Path d="M19.5 6h3v15h-3z" fill={color} opacity={0.3} />
    </Svg>
  );
}

/** Gönderilen mesaj tik'leri: tek (gönderildi), çift (iletildi), mavi çift (okundu) */
export function Ticks({ status, color, size = 16 }: { status: 'sent' | 'delivered' | 'read'; color: string; size?: number }) {
  if (status === 'sent') {
    return (
      <Svg width={size * 0.75} height={size * 0.68} viewBox="0 0 12 11">
        <Path d="M1.2 5.9 4.3 9 10.8 1.8" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size * 0.68} viewBox="0 0 16 11">
      <Path d="M1 5.9 4.1 9 10.6 1.8" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7.9 8.4 8.5 9 15 1.8" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
