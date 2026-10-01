import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { ILLUSTRATION_ASPECT, Illustration, type IllustrationId } from '@/ui/illustrations';
import { useMediaWidth } from '@/ui/layout';

type Props = {
  image: IllustrationId;
  caption?: string;
  /** Altyazı yoksa saat fotoğrafın üstüne bindirilir; çağıran yerleştirir */
  metaOverlay?: ReactNode;
  captionSuffix?: string;
};

export function PhotoContent({ image, caption, metaOverlay, captionSuffix = '' }: Props) {
  const { palette } = useTheme();
  const width = useMediaWidth();
  const height = Math.round(width / ILLUSTRATION_ASPECT);
  const [open, setOpen] = useState(false);
  const win = useWindowDimensions();
  // Hem genişliğe hem yüksekliğe sığdır (yatay telefon, kısa dizüstü pencereleri); altyazıya yer bırak
  const maxH = win.height - (caption ? 96 : 32);
  const fullW = Math.round(Math.max(120, Math.min(win.width, 900, maxH * ILLUSTRATION_ASPECT)));
  const fullH = Math.round(fullW / ILLUSTRATION_ASPECT);

  return (
    <View>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="imagebutton" accessibilityLabel="Fotoğrafı aç">
        <View style={[styles.frame, { width, height }]}>
          <Illustration id={image} width={width} height={height} />
          {metaOverlay ? <View style={styles.overlayMeta}>{metaOverlay}</View> : null}
        </View>
      </Pressable>
      {caption ? (
        <Text style={[styles.caption, { color: palette.text, maxWidth: width }]}>
          {caption}
          {captionSuffix}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.lightbox} onPress={() => setOpen(false)} accessibilityLabel="Kapat">
          <Illustration id={image} width={fullW} height={fullH} />
          {caption ? <Text style={styles.lightboxCaption}>{caption}</Text> : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 6, overflow: 'hidden' },
  overlayMeta: { position: 'absolute', right: 6, bottom: 5 },
  caption: { fontSize: 15.5, lineHeight: 21, paddingHorizontal: 4, paddingTop: 5 },
  lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  lightboxCaption: { color: '#FFFFFF', fontSize: 15, marginTop: 14, paddingHorizontal: 24, textAlign: 'center' },
});
