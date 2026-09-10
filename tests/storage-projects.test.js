// ================================================================
// tests/storage-projects.test.js
// Tests for project management endpoints
// ================================================================
// Covers:
//   - Creating a project (POST /project/:project_name)
//   - Deleting a project (DELETE /:project)
//   - Listing all projects (GET /admin/projects)
//   - Admin routes with project token (should return 401)
//
// @see ../routes/index.js
// ================================================================

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server.js';
import { clear_tokens_file, create_project_token } from './helpers.js';

describe('Project management', () => {
    let server;
    let project_token;
    const TEST_PROJECT = `test_project_${Date.now()}`;

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

    it('should create a new project (201)', async () => {
        const res = await request(server)
            .post(`/project/${TEST_PROJECT}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(201);
        expect(res.body).toEqual({ message: 'Project created', project: TEST_PROJECT });
    });

    it('should return 200 if project already exists', async () => {
        const res = await request(server)
            .post(`/project/${TEST_PROJECT}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Project already exists', project: TEST_PROJECT });
    });

    it('should list all projects (public admin endpoint)', async () => {
        const res = await request(server)
            .get('/admin/projects');
        expect(res.status).toBe(200);
        // The project created in previous tests (TEST_PROJECT) should be present
        expect(res.body.projects).toContain(TEST_PROJECT);
    });

    it('should delete the project (200)', async () => {
        const res = await request(server)
            .delete(`/${TEST_PROJECT}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Project deleted successfully' });
    });

    it('should return 403 when deleting a non‑existing project (token mismatch)', async () => {
        const res = await request(server)
            .delete(`/non_existing_project_${Date.now()}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(403);   // changed from 404
        expect(res.body.error).toMatch(/Token does not grant access/);
    });
    
    describe('Admin routes with project token', () => {
        // These routes require master token, so project token should be rejected.
        it('should reject access to /admin/tokens with project token', async () => {
            const res = await request(server)
                .get('/admin/tokens')
                .set('Authorization', `Bearer ${project_token}`);
            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/Invalid master token/);
        });

        it('should reject creation of token with project token', async () => {
            const res = await request(server)
                .post('/admin/tokens')
                .set('Authorization', `Bearer ${project_token}`)
                .send({ project: 'hack_project' });
            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/Invalid master token/);
        });
    });
});