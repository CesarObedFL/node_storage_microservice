// ================================================================
// tests/tokens.test.js
// Token management tests (admin API)
// ================================================================
// Covers:
//   - Create token (201, 400, 401)
//   - List tokens (200, 401)
//   - Revoke token (200, 404, 401)
//
// @see ../controllers/token_controller.js
// @see ../auth/master_auth.js
// ================================================================

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import app from '../server.js';
import { master_token, delete_token } from '../config/config.js';
import { clear_tokens_file } from './helpers.js';

describe('Token management (admin API)', () => {
    let server;
    const INVALID_TOKEN = 'invalid_token';
    let created_token;

    beforeAll(async () => {
        await clear_tokens_file();
        server = app.listen(0);
    });

    afterAll(async () => {
        if (server && server.close) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    // Helper for authenticated admin requests
    const admin_request = (method, url, data = null) => {
        const req = request(server)[method](url);
        req.set('Authorization', `Bearer ${master_token}`);
        if (data) req.send(data);
        return req;
    };

    // ============================================================
    // POST /admin/tokens
    // ============================================================
    describe('POST /admin/tokens', () => {
        it('should create a new token (201)', async () => {
            const project = 'new_project';
            const res = await admin_request('post', '/admin/tokens', { project });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('message', 'Token created');
            expect(res.body).toHaveProperty('token');
            expect(res.body.project).toBe(project);
        });

        it('should return 400 if project name is missing', async () => {
            const res = await admin_request('post', '/admin/tokens', {});
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Project name is required');
        });

        it('should return 400 if project name has invalid characters', async () => {
            const res = await admin_request('post', '/admin/tokens', { project: 'bad@project' });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Project name can only contain letters, numbers, and underscores');
        });

        it('should return 401 if master token is invalid', async () => {
            const res = await request(server)
                .post('/admin/tokens')
                .set('Authorization', `Bearer ${INVALID_TOKEN}`)
                .send({ project: 'test' });
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid master token');
        });
    });

    // ============================================================
    // GET /admin/tokens
    // ============================================================
    describe('GET /admin/tokens', () => {
        it('should list all tokens (200)', async () => {
            const res = await admin_request('get', '/admin/tokens');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('tokens');
            expect(typeof res.body.tokens).toBe('object');
        });

        it('should return 401 if master token is invalid', async () => {
            const res = await request(server)
                .get('/admin/tokens')
                .set('Authorization', `Bearer ${INVALID_TOKEN}`);
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid master token');
        });
    });

    // ============================================================
    // DELETE /admin/tokens/:token
    // ============================================================
    describe('DELETE /admin/tokens/:token', () => {
        beforeEach(async () => {
            // Create a token for testing revocation
            const res = await admin_request('post', '/admin/tokens', { project: 'temp_project' });
            if (res.status === 201) {
                created_token = res.body.token;
            } else {
                throw new Error('Failed to create token for test');
            }
        });

        afterEach(async () => {
            // Clean up: delete the token if it still exists
            try {
                await delete_token(created_token);
            } catch (_) {
                // ignore
            }
        });

        it('should revoke a token (200)', async () => {
            const res = await admin_request('delete', `/admin/tokens/${created_token}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Token revoked successfully');
        });

        it('should return 404 if token does not exist', async () => {
            const res = await admin_request('delete', '/admin/tokens/non_existing_token');
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'Token not found');
        });

        it('should return 401 if master token is invalid', async () => {
            const res = await request(server)
                .delete(`/admin/tokens/${created_token}`)
                .set('Authorization', `Bearer ${INVALID_TOKEN}`);
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid master token');
        });
    });
});