import request from 'supertest';
import app from '../server.js';
import { MASTER_TOKEN, create_project_token, TEST_PROJECT, TEST_FILE } from './helpers/test_setup.js';

describe('Authentication tests', () => {
    let project_token;

    beforeAll(async () => {
        project_token = await create_project_token(TEST_PROJECT);
    });

    describe('Project token authentication', () => {
        test('should allow access to the correct project', async () => {
            const res = await request(app)
                .post(`/storage/${TEST_PROJECT}/${TEST_FILE}/records`)
                .set('Authorization', `Bearer ${project_token}`)
                .send({ test: 'ok' });
            expect(res.status).toBe(201);
        });

        test('should deny access to a different project', async () => {
            const res = await request(app)
                .post('/storage/other_project/test.json/records')
                .set('Authorization', `Bearer ${project_token}`)
                .send({ test: 'fail' });
            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Token does not grant access to this project');
        });

        test('should reject invalid token', async () => {
            const res = await request(app)
                .post(`/storage/${TEST_PROJECT}/${TEST_FILE}/records`)
                .set('Authorization', 'Bearer invalid_token')
                .send({ test: 'fail' });
            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Invalid or expired token');
        });

        test('should reject missing token', async () => {
            const res = await request(app)
                .post(`/storage/${TEST_PROJECT}/${TEST_FILE}/records`)
                .send({ test: 'fail' });
            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Missing or invalid Authorization header');
        });
    });

    describe('Admin routes with master token', () => {
        test('should list tokens with master token', async () => {
            const res = await request(app)
                .get('/admin/tokens')
                .set('Authorization', `Bearer ${MASTER_TOKEN}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('tokens');
        });

        test('should create a token with master token', async () => {
            const res = await request(app)
                .post('/admin/tokens')
                .set('Authorization', `Bearer ${MASTER_TOKEN}`)
                .send({ project: 'new_project' });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
        });

        test('should reject admin access with project token', async () => {
            const res = await request(app)
                .get('/admin/tokens')
                .set('Authorization', `Bearer ${project_token}`);
            expect(res.status).toBe(401);
        });
    });
});