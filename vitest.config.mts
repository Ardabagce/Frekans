import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@stories': fileURLToPath(new URL('./stories', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // Tarih testleri yerel saate göre yazıldı; sabit bir dilimde koşsun
    env: { TZ: 'Europe/Istanbul' },
  },
});
