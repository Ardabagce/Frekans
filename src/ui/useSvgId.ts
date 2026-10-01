import { useId } from 'react';

/**
 * SVG <Defs> içindeki gradient/pattern için bileşen örneğine özgü id.
 * Web'de aynı id iki kez DOM'da olursa ve ilki gizli (display:none) bir ekrandaysa
 * Chrome url(#id) referansını boş çizer; bu yüzden sabit id kullanılmaz.
 */
export function useSvgId(prefix: string): string {
  return `${prefix}-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
}
