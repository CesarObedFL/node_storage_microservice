// ================================================================
// tests/cors.test.js
// CORS middleware tests
// ================================================================
// These tests verify that the server responds with the correct
// CORS headers for allowed and disallowed origins.
//
// Environment variable CORS_ORIGINS is set via vi.stubEnv for this
// test suite only, avoiding hardcoding in the repository.
// ================================================================

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('CORS Middleware', () => {
    let server;

    beforeAll(() => {
        // Set allowed origins for testing (only for this suite)
        vi.stubEnv('CORS_ORIGINS', 'https://cesarobedfl.pro,https://solucionesyoas.com.mx');
        server = app.listen(0);
    });

    afterAll(async () => {
        vi.unstubAllEnvs();
        if (server && server.close) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    const allowedOrigin1 = 'https://cesarobedfl.pro';
    const allowedOrigin2 = 'https://solucionesyoas.com.mx';

    it('should return Access-Control-Allow-Origin for allowed origin 1', async () => {
        const res = await request(server)
            .options('/storage/test')
            .set('Origin', allowedOrigin1)
            .set('Access-Control-Request-Method', 'GET');
        expect(res.status).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe(allowedOrigin1);
        expect(res.headers['access-control-allow-methods']).toContain('GET');
    });

    it('should return Access-Control-Allow-Origin for allowed origin 2', async () => {
        const res = await request(server)
            .options('/storage/test')
            .set('Origin', allowedOrigin2)
            .set('Access-Control-Request-Method', 'POST');
        expect(res.status).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe(allowedOrigin2);
        expect(res.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should reject disallowed origin with 403', async () => {
        const res = await request(server)
            .options('/storage/test')
            .set('Origin', 'https://evil.com')
            .set('Access-Control-Request-Method', 'GET');
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Not allowed by CORS');
    });

    it('should allow requests without Origin header (e.g., curl, Postman)', async () => {
        const res = await request(server)
            .get('/storage/test')
            .set('Origin', '');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Router working');
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should include correct CORS headers for actual request (non-OPTIONS)', async () => {
        const origin = allowedOrigin1;
        const res = await request(server)
            .get('/storage/test')
            .set('Origin', origin);
        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe(origin);
    });
});