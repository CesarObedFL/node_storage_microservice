// ================================================================
// tests/cors.test.js
// CORS middleware tests
// ================================================================
// These tests verify that the server responds with the correct
// CORS headers for allowed and disallowed origins.
//
// The allowed origins are read from the .env file via
// get_cors_origins(), so no sensitive data is hardcoded here.
// ================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { get_cors_origins } from '../config/config.js';

describe('CORS Middleware', () => {
    let server;
    let allowed_origins;
    let origin1;
    let origin2;
    const disallowed_origin = 'https://not-allowed-origin.com';

    beforeAll(() => {
        // Read allowed origins from .env (via config)
        allowed_origins = get_cors_origins();
        if (!Array.isArray(allowed_origins) || allowed_origins.length === 0) {
            throw new Error('CORS_ORIGINS is not set in .env. Please configure it to run CORS tests.');
        }
        origin1 = allowed_origins[0];
        origin2 = allowed_origins[1] || allowed_origins[0];
        server = app.listen(0);
    });

    afterAll(async () => {
        if (server && server.close) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    it('should return Access-Control-Allow-Origin for allowed origin 1', async () => {
        const res = await request(server)
            .options('/test')
            .set('Origin', origin1)
            .set('Access-Control-Request-Method', 'GET');
        expect(res.status).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe(origin1);
        expect(res.headers['access-control-allow-methods']).toContain('GET');
    });

    it('should return Access-Control-Allow-Origin for allowed origin 2', async () => {
        const res = await request(server)
            .options('/test')
            .set('Origin', origin2)
            .set('Access-Control-Request-Method', 'POST');
        expect(res.status).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe(origin2);
        expect(res.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should reject disallowed origin with 403', async () => {
        const res = await request(server)
            .options('/test')
            .set('Origin', disallowed_origin)
            .set('Access-Control-Request-Method', 'GET');
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Not allowed by CORS');
    });

    it('should allow requests without Origin header (e.g., curl, Postman)', async () => {
        const res = await request(server)
            .get('/test')
            .set('Origin', '');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should include correct CORS headers for actual request (non-OPTIONS)', async () => {
        const res = await request(server)
            .get('/test')
            .set('Origin', origin1);
        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe(origin1);
    });
});