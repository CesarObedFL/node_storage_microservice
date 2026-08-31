import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.js'],
        env: {
            CORS_ORIGINS: 'https://cesarobedfl.pro,https://solucionesyoas.com.mx',
        },
    },
});