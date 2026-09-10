// ================================================================
// tests/storage-records.test.js
// Tests for record (array) CRUD operations
// ================================================================
// Covers:
//   - Adding records (POST /:project/:filename/records)
//   - Listing records (GET /:project/:filename/records)
//   - Getting a single record (GET .../records/:id)
//   - Updating a record (PUT .../records/:id)
//   - Deleting a record (DELETE .../records/:id)
//   - Record not found (404)
//   - Auto-conversion of object file to array on first record add
//
// @see ../routes/index.js
// ================================================================

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server.js';
import { clear_tokens_file, create_project_token } from './helpers.js';

describe('Record operations', () => {
    let server;
    let project_token;
    const TEST_PROJECT = 'record_test_project';
    const RECORDS_FILE = 'records.json';
    let recordId;

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

    it('should add a record (POST) - 201', async () => {
        const record = { name: 'Alice', age: 30 };
        const res = await request(server)
            .post(`/${TEST_PROJECT}/${RECORDS_FILE}/records`)
            .set('Authorization', `Bearer ${project_token}`)
            .send(record);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message', 'Record added');
        expect(res.body).toHaveProperty('id');
        expect(res.body.record).toMatchObject(record);
        recordId = res.body.id;
    });

    it('should add another record (POST)', async () => {
        const record = { name: 'Bob', age: 25 };
        const res = await request(server)
            .post(`/${TEST_PROJECT}/${RECORDS_FILE}/records`)
            .set('Authorization', `Bearer ${project_token}`)
            .send(record);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
    });

    it('should list all records (GET /:project/:filename/records)', async () => {
        const res = await request(server)
            .get(`/${TEST_PROJECT}/${RECORDS_FILE}/records`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('records');
        expect(Array.isArray(res.body.records)).toBe(true);
        expect(res.body.records.length).toBeGreaterThan(0);
        const found = res.body.records.find(r => r.id === recordId);
        expect(found).toBeDefined();
    });

    it('should get a single record by ID (GET .../records/:id)', async () => {
        const res = await request(server)
            .get(`/${TEST_PROJECT}/${RECORDS_FILE}/records/${recordId}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('record');
        expect(res.body.record.id).toBe(recordId);
    });

    it('should return 404 when record ID does not exist', async () => {
        const fakeId = 'non_existing_id';
        const res = await request(server)
            .get(`/${TEST_PROJECT}/${RECORDS_FILE}/records/${fakeId}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Record not found');
    });

    it('should update (PUT) a record (merge)', async () => {
        const update = { age: 31 };
        const res = await request(server)
            .put(`/${TEST_PROJECT}/${RECORDS_FILE}/records/${recordId}`)
            .set('Authorization', `Bearer ${project_token}`)
            .send(update);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Record updated');
        expect(res.body.record).toMatchObject({ name: 'Alice', age: 31 });
    });

    it('should delete a record by ID (DELETE .../records/:id)', async () => {
        const res = await request(server)
            .delete(`/${TEST_PROJECT}/${RECORDS_FILE}/records/${recordId}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Record deleted' });
    });

    it('should return 404 when deleting a non-existing record', async () => {
        const fakeId = 'non_existing_id';
        const res = await request(server)
            .delete(`/${TEST_PROJECT}/${RECORDS_FILE}/records/${fakeId}`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Record not found');
    });

    it('should automatically convert an object file to array on first record add', async () => {
        // Create a file containing an object (not an array)
        const objFile = 'object_file.json';
        const objData = { initial: 'data' };
        await request(server)
            .post(`/${TEST_PROJECT}/${objFile}`)
            .set('Authorization', `Bearer ${project_token}`)
            .send(objData)
            .expect(201);

        // Now add a record to that file (should convert it to an array)
        const newRecord = { from: 'object' };
        const res = await request(server)
            .post(`/${TEST_PROJECT}/${objFile}/records`)
            .set('Authorization', `Bearer ${project_token}`)
            .send(newRecord);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');

        // Verify the file is now an array with two records
        const listRes = await request(server)
            .get(`/${TEST_PROJECT}/${objFile}/records`)
            .set('Authorization', `Bearer ${project_token}`);
        expect(listRes.status).toBe(200);
        expect(listRes.body.records).toHaveLength(2);
        expect(listRes.body.records[0]).toHaveProperty('id');
        expect(listRes.body.records[0]).toMatchObject(objData);
        expect(listRes.body.records[1]).toMatchObject({ id: expect.any(String), from: 'object' });
    });
});