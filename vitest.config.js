import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,       // para usar describe, it, expect sin importar
        environment: 'node',
        include: ['tests/**/*.test.js'],
        // coverage: { enabled: true, provider: 'v8' } // opcional
    },
});