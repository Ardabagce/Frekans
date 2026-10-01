import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { useSvgId } from '@/ui/useSvgId';

/**
 * Frekans'a özgü sohbet duvar kağıdı: dağ sırtları, kar taneleri,
 * telsiz dalgaları, anten ve sinyal çubuklarından oluşan bir doodle deseni.
 * 160x160'lık bir karo tekrarlanır; çizgiler tek renktir, opaklıkla ayarlanır.
 */
function WallpaperImpl() {
  const frekansDoodleId = useSvgId('frekans-doodle');
  const { palette } = useTheme();
  const ink = palette.wallpaperInk;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: palette.chatBackground }]}>
      <Svg width="100%" height="100%" style={{ opacity: palette.wallpaperOpacity }}>
        <Defs>
          <Pattern id={frekansDoodleId} patternUnits="userSpaceOnUse" width={160} height={160}>
            <G stroke={ink} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Dağ sırtı */}
              <Path d="M8 46l14-18 8 9 10-15 16 24" />
              <Path d="M36 22l-3 5 3-1 2 3 2-4" />
              {/* Kar tanesi */}
              <G transform="translate(100 24)">
                <Path d="M0-9v18M-7.8-4.5l15.6 9M-7.8 4.5l15.6-9" />
                <Path d="M-2-7l2 2 2-2M-2 7l2-2 2 2" />
              </G>
              {/* Telsiz dalgaları */}
              <G transform="translate(140 62)">
                <Circle r={2} fill={ink} />
                <Path d="M-6-6a8.5 8.5 0 0 0 0 12M6-6a8.5 8.5 0 0 1 0 12" />
                <Path d="M-11-11a15.5 15.5 0 0 0 0 22M11-11a15.5 15.5 0 0 1 0 22" />
              </G>
              {/* Anten direği */}
              <G transform="translate(30 96)">
                <Path d="M0 30L8 0l8 30M3 19h10M5.5 10h5" />
                <Path d="M2-6a9 9 0 0 1 12 0" />
              </G>
              {/* Sinyal çubukları */}
              <G transform="translate(84 104)">
                <Path d="M0 16v-4M6 16V8M12 16V3M18 16V-2" />
              </G>
              {/* Ladin ağacı */}
              <G transform="translate(126 112)">
                <Path d="M10 0L2 12h5L0 22h20l-7-10h5zM10 22v6" />
              </G>
              {/* Dalgalı çizgi (frekans) */}
              <Path d="M60 150q5-8 10 0t10 0 10 0 10 0" />
              {/* Fener */}
              <G transform="translate(8 138)">
                <Path d="M3 0h8l-1 4H4zM2 4h10v12H2zM4 16h6" />
              </G>
              {/* Ayak izi çifti */}
              <G transform="translate(118 150)">
                <Path d="M0 0q2-6 4 0t-2 5zM8-6q2-6 4 0t-2 5z" />
              </G>
            </G>
            {/* Serpiştirilmiş noktalar (kar) */}
            <G fill={ink}>
              <Circle cx={70} cy={10} r={1.3} />
              <Circle cx={124} cy={8} r={1} />
              <Circle cx={60} cy={70} r={1.2} />
              <Circle cx={100} cy={70} r={1} />
              <Circle cx={12} cy={78} r={1.1} />
              <Circle cx={150} cy={100} r={1.2} />
              <Circle cx={66} cy={124} r={1} />
              <Circle cx={36} cy={60} r={1} />
            </G>
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${frekansDoodleId})`} />
      </Svg>
    </View>
  );
}

export const Wallpaper = memo(WallpaperImpl);
