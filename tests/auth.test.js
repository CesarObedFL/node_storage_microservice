import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server.js';
import { master_token } from '../config/config.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKENS_FILE = path.join(__dirname, '../config/tokens.json');

describe('Authentication tests', () => {
    let server;
    let project_token;
    const TEST_PROJECT = 'test_project';

    // Helper para crear token de proyecto usando master token
    async function create_project_token(project) {
        const res = await request(server)
            .post('/storage/admin/tokens')
            .set('Authorization', `Bearer ${master_token}`)
            .send({ project });
        if (res.status !== 201) {
            throw new Error(`Failed to create token: ${res.body.error || res.status}`);
        }
        return res.body.token;
    }

    beforeAll(async () => {
        // Asegurar que tokens.json sea válido
        await fs.writeFile(TOKENS_FILE, '{}', 'utf8');
        server = app.listen(0);
        project_token = await create_project_token(TEST_PROJECT);
    });

    afterAll(async () => {
        if (server && server.close) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

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