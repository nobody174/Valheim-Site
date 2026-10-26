import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Repo's canonical name on GitHub; do not derive from the clone URL.
export default defineConfig({
  base: '/Valheim-Site/',
  plugins: [react()],
  test: { include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'] },
});
