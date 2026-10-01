import Svg, { Path } from 'react-native-svg';

export const TAIL_WIDTH = 8;
const TAIL_HEIGHT = 13;

/** Grubun ilk balonunun üst köşesindeki kuyruk. Gelen mesajda sola, gidende sağa bakar. */
export function BubbleTail({ side, color }: { side: 'left' | 'right'; color: string }) {
  const d =
    side === 'left'
      ? 'M1.6 0H8v13C6 8.6 3.6 4.6.7 1.7.1 1.1.4 0 1.6 0z'
      : 'M6.4 0H0v13C2 8.6 4.4 4.6 7.3 1.7 7.9 1.1 7.6 0 6.4 0z';
  return (
    <Svg
      width={TAIL_WIDTH}
      height={TAIL_HEIGHT}
      viewBox="0 0 8 13"
      style={{ position: 'absolute', top: 0, [side]: -TAIL_WIDTH + 0.5 }}
    >
      <Path d={d} fill={color} />
    </Svg>
  );
}
