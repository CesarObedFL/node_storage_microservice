// ================================================================
// tests/auth.test.js
// Authentication tests (project tokens and master tokens)
// ================================================================
// Covers:
//   - Project token authentication (correct project, wrong project,
//     invalid token, missing token)
//   - Admin routes with master token (list tokens, create token,
//     reject project token)
//
// @see ../auth/project_auth.js
// @see ../auth/master_auth.js
// ================================================================

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server.js';
import { master_token } from '../config/config.js';
import { clear_tokens_file, create_project_token } from './helpers.js';

describe('Authentication tests', () => {
    let server;
    let project_token;
    const TEST_PROJECT = 'test_project';

    beforeAll(async () => {
        await clear_tokens_file();
        server = app.listen(0);
        project_token = await create_project_token(TEST_PROJECT, server);
    });

    afterAll(async () => {
        if (server && server.close) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    // ============================================================
    // Project token authentication
    // ============================================================
    describe('Project token authentication', () => {
        it('should allow access to the correct project', async () => {
            const res = await request(server)
                .post(`/storage/${TEST_PROJECT}/test.json/records`)
                .set('Authorization', `Bearer ${project_token}`)
                .send({ test: 'ok' });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
        });

        it('should deny access to a different project', async () => {
            const res = await request(server)
                .post('/storage/other_project/test.json/records')
                .set('Authorization', `Bearer ${project_token}`)
                .send({ test: 'fail' });
            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Token does not grant access to this project');
        });

        it('should reject invalid token', async () => {
            const res = await request(server)
                .post(`/storage/${TEST_PROJECT}/test.json/records`)
                .set('Authorization', 'Bearer invalid_token')
                .send({ test: 'fail' });
            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Invalid or expired token');
        });

        it('should reject missing token', async () => {
            const res = await request(server)
                .post(`/storage/${TEST_PROJECT}/test.json/records`)
                .send({ test: 'fail' });
            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Missing or invalid Authorization header');
        });
    });

    // ============================================================
    // Admin routes with master token
    // ============================================================
    describe('Admin routes with master token', () => {
        it('should list tokens with master token', async () => {
            const res = await request(server)
                .get('/storage/admin/tokens')
                .set('Authorization', `Bearer ${master_token}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('tokens');
        });

        it('should create a token with master token', async () => {
            const res = await request(server)
                .post('/storage/admin/tokens')
                .set('Authorization', `Bearer ${master_token}`)
                .send({ project: 'new_project' });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
        });

        it('should reject admin access with project token', async () => {
            const res = await request(server)
                .get('/storage/admin/tokens')
                .set('Authorization', `Bearer ${project_token}`);
            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Invalid master token');
        });
    });
});