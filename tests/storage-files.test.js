// ================================================================
// tests/storage-files.test.js
// Tests for file CRUD operations
// ================================================================
// Covers:
//   - Creating a file (POST /:project/:filename)
//   - Listing files (GET /:project/list)
//   - Getting a file (GET /:project/:filename)
//   - Updating (PUT) and patching (PATCH) files
//   - File not found (404)
//   - Invalid JSON body (400)
//
// @see ../routes/index.js
// ================================================================

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server.js';
import { clear_tokens_file, create_project_token } from './helpers.js';

describe('File operations', () => {
    let server;
    let project_token;
    const TEST_PROJECT = 'file_test_project';
    const TEST_FILE = 'test_file.json';
    const initialData = { foo: 'bar', number: 42 };

    beforeAll(async () => {
        await clear_tokens_file();
        server = app.listen(0);
        project_token = await create_project_token(TEST_PROJECT, server);
        // Ensure project exists
        await request(server)
            .post(`/project/${TEST_PROJECT}`)
            .set('Authorization', `Bearer ${project_token}`);
    });

    afterAll(async () => {
        if (server && server.close) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    it('should create a new file (POST) - 201', async () => {
        const res = await request(server)
            .post(`/${TEST_PROJECT}/${TEST_FILE}`)
            .set('Authorization', `Bearer ${project_token}`)
            .send(initialData);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message', 'File created/replaced');
        expect(res.body.data).toEqual(initialData);
    });

    it('should list files in the project (GET /:project/list)', async () => {
        const res = await request(server)
            .get(`/${TEST_PROJECT}/list`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('project', TEST_PROJECT);
        expect(res.body.files).toContain(TEST_FILE);
    });

    it('should retrieve the file content (GET /:project/:filename)', async () => {
        const res = await request(server)
            .get(`/${TEST_PROJECT}/${TEST_FILE}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual(initialData);
    });

    it('should return 404 when file does not exist', async () => {
        const res = await request(server)
            .get(`/${TEST_PROJECT}/non_existing.json`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'File not found');
    });

    it('should update (PUT) a file with merge (200)', async () => {
        const updateData = { newKey: 'mergedValue' };
        const res = await request(server)
            .put(`/${TEST_PROJECT}/${TEST_FILE}`)
            .set('Authorization', `Bearer ${project_token}`)
            .send(updateData);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'File updated (merged)');
        expect(res.body.data).toEqual({ ...initialData, ...updateData });
    });

    it('should patch (PATCH) a file with merge (200)', async () => {
        const patchData = { number: 99 };
        const res = await request(server)
            .patch(`/${TEST_PROJECT}/${TEST_FILE}`)
            .set('Authorization', `Bearer ${project_token}`)
            .send(patchData);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'File patched (merged)');
        expect(res.body.data).toEqual({ ...initialData, newKey: 'mergedValue', number: 99 });
    });

    it('should return 400 when POST body is not a JSON object', async () => {
        const res = await request(server)
            .post(`/${TEST_PROJECT}/invalid.json`)
            .set('Authorization', `Bearer ${project_token}`)
            .set('Content-Type', 'application/json')
            .send('not an object');
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Request body must be a valid JSON object');
    });
});