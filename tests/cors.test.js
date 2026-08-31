// tests/cors.test.js
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import app from '../server.js';

describe('CORS Middleware', () => {
    let server;

    beforeAll(() => {
        // Mockear las variables de entorno para CORS
        // Esto evita modificar el .env real durante las pruebas
        vi.stubEnv('CORS_ORIGINS', 'https://cesarobedfl.pro,https://solucionesyoas.com.mx');
        // Recargar la configuración de CORS (si es necesario, pero en server.js se lee dinámicamente)
        // Si tu server.js lee CORS_ORIGINS al inicio, puedes forzar la recarga del módulo.
        // Como es más sencillo, simplemente iniciamos el servidor.
        server = app.listen(0);
    });

    afterAll(() => {
        vi.unstubAllEnvs();
        server.close();
    });

    // ========== ORÍGENES PERMITIDOS ==========
    it('should return Access-Control-Allow-Origin for allowed origin 1', async () => {
        const origin = 'https://cesarobedfl.pro';
        const res = await request(server)
            .options('/test')
            .set('Origin', origin)
            .set('Access-Control-Request-Method', 'GET');

        expect(res.status).toBe(204); // o 200, depende de tu configuración
        expect(res.headers['access-control-allow-origin']).toBe(origin);
        expect(res.headers['access-control-allow-methods']).toContain('GET');
    });

    it('should return Access-Control-Allow-Origin for allowed origin 2', async () => {
        const origin = 'https://solucionesyoas.com.mx';
        const res = await request(server)
            .options('/test')
            .set('Origin', origin)
            .set('Access-Control-Request-Method', 'POST');

        expect(res.status).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe(origin);
        expect(res.headers['access-control-allow-methods']).toContain('POST');
    });

    // ========== ORÍGENES NO PERMITIDOS ==========
    it('should reject disallowed origin with 403', async () => {
        const origin = 'https://evil.com';
        const res = await request(server)
            .options('/test')
            .set('Origin', origin)
            .set('Access-Control-Request-Method', 'GET');

        // Debe devolver 403 (si manejas el error correctamente) o 500 si no
        // Asumimos que has modificado server.js para devolver 403
        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/Not allowed by CORS/);
    });

    // ========== SOLICITUDES SIN ORIGEN ==========
    it('should allow requests without Origin header (e.g., curl, Postman)', async () => {
        const res = await request(server)
            .get('/test')
            .set('Origin', ''); // sin origen

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        // No debería haber header Access-Control-Allow-Origin porque no hay origen
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    // ========== PRUEBA CON HEADER ORIGEN PERO SIN PREFLIGHT ==========
    it('should include correct CORS headers for actual request (non-OPTIONS)', async () => {
        const origin = 'https://cesarobedfl.pro';
        const res = await request(server)
            .get('/test')
            .set('Origin', origin);

        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe(origin);
    });
});