// ================================================================
// tests/storage-projects.test.js
// Tests for project management endpoints
// ================================================================
// Covers:
//   - Creating a project (POST /storage/project/:project_name)
//   - Deleting a project (DELETE /storage/:project)
//   - Listing all projects (GET /storage/admin/projects)
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

    it('should create a new project (201)', async () => {
        const res = await request(server)
            .post(`/storage/project/${TEST_PROJECT}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(201);
        expect(res.body).toEqual({ message: 'Project created', project: TEST_PROJECT });
    });

    it('should return 200 if project already exists', async () => {
        const res = await request(server)
            .post(`/storage/project/${TEST_PROJECT}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Project already exists', project: TEST_PROJECT });
    });

    it('should delete the project (200)', async () => {
        const res = await request(server)
            .delete(`/storage/${TEST_PROJECT}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Project deleted successfully' });
    });

    it('should return 404 when deleting a non-existing project', async () => {
        const res = await request(server)
            .delete(`/storage/non_existing_project_${Date.now()}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Project not found');
    });

    it('should list all projects (public admin endpoint)', async () => {
        // We need to create a project first to ensure it appears in the list.
        // Since we deleted it, we'll create a new one for this test.
        const newProject = 'list_test';
        await request(server)
            .post(`/storage/project/${newProject}`)
            .set('Authorization', `Bearer ${project_token}`);
        const res = await request(server)
            .get('/storage/admin/projects');
        expect(res.status).toBe(200);
        expect(res.body.projects).toContain(newProject);
        // Clean up
        await request(server)
            .delete(`/storage/${newProject}`)
            .set('Authorization', `Bearer ${project_token}`);
    });

    describe('Admin routes with project token', () => {
        // These routes require master token, so project token should be rejected.
        it('should reject access to /storage/admin/tokens with project token', async () => {
            const res = await request(server)
                .get('/storage/admin/tokens')
                .set('Authorization', `Bearer ${project_token}`);
            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/Invalid master token/);
        });

        it('should reject creation of token with project token', async () => {
            const res = await request(server)
                .post('/storage/admin/tokens')
                .set('Authorization', `Bearer ${project_token}`)
                .send({ project: 'hack_project' });
            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/Invalid master token/);
        });
    });
});