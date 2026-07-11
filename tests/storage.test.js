import request from 'supertest';
import app from '../server.js';
import { load_token_map } from '../config/config.js';

/**
 * Full API test suite for the Storage Microservice with authentication.
 * Tests all CRUD operations for projects, files, and records.
 */
describe('Storage Microservice - Full API Tests with Authentication', () => {
    let server;
    let project_name;
    let filename;
    let file_data;
    let valid_token;

    // ==================== SETUP ====================
    /**
     * Set up the test environment:
     * - Load token map and get a valid token
     * - Start the server on a random port
     * - Generate unique names for project and file
     */
    beforeAll(async () => {
        // Load the token map from config (reads .env and tokens.json)
        const token_map = await load_token_map();
        const tokens = Array.from(token_map.keys());
        if (tokens.length === 0) {
            throw new Error('No tokens found in config. Please set PROJECT_TOKEN_* in .env or create tokens via admin API.');
        }
        valid_token = tokens[0];

        // Start the server
        server = app.listen(0);

        // Generate unique names to avoid collisions between test runs
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 6);
        project_name = `test_project_${timestamp}_${random}`;
        filename = 'test_data.json';
        file_data = { initial: 'value', number: 42 };
    });

    /**
     * Clean up after all tests:
     * - Attempt to delete the test project (ignore errors)
     * - Close the server
     */
    afterAll(async () => {
        // Cleanup: delete the project if it exists (ignore errors)
        try {
            await request(server)
                .delete(`/storage/${project_name}`)
                .set('Authorization', `Bearer ${valid_token}`);
        } catch (_) {
            // ignore
        }

        // Close the server
        if (server && server.close) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    /**
     * Helper function to make authenticated requests.
     *
     * @param {string} method - HTTP method (get, post, put, patch, delete).
     * @param {string} url - Endpoint URL.
     * @param {object|null} data - Request body (optional).
     * @returns {object} SuperTest request object.
     */
    const auth_request = (method, url, data = null) => {
        let req = request(server)[method](url);
        req.set('Authorization', `Bearer ${valid_token}`);
        if (data) req.send(data);
        return req;
    };

    // ==================== AUTHENTICATION TESTS ====================
    describe('Authentication', () => {
        it('should return 401 when no token is provided', async () => {
            await request(server)
                .get(`/storage/${project_name}/list`)
                .expect(401)
                .expect((res) => {
                    expect(res.body).toHaveProperty('error', 'Missing or invalid Authorization header (Bearer token required)');
                });
        });

        it('should return 401 when invalid token is provided', async () => {
            await request(server)
                .get(`/storage/${project_name}/list`)
                .set('Authorization', 'Bearer invalid_token_123')
                .expect(401)
                .expect((res) => {
                    expect(res.body).toHaveProperty('error', 'Invalid or expired token');
                });
        });

        it('should return 401 when Authorization header format is wrong', async () => {
            await request(server)
                .get(`/storage/${project_name}/list`)
                .set('Authorization', 'Basic invalid')
                .expect(401)
                .expect((res) => {
                    expect(res.body).toHaveProperty('error', 'Missing or invalid Authorization header (Bearer token required)');
                });
        });
    });

    // ==================== PROJECT TESTS ====================
    describe('Projects', () => {
        it('should create a new project (201)', async () => {
            const res = await auth_request('post', `/storage/project/${project_name}`).expect(201);
            expect(res.body).toEqual({
                message: 'Project created',
                project: project_name,
            });
        });

        it('should return 200 if project already exists', async () => {
            const res = await auth_request('post', `/storage/project/${project_name}`).expect(200);
            expect(res.body).toEqual({
                message: 'Project already exists',
                project: project_name,
            });
        });

        it('should list all projects (admin) - public endpoint', async () => {
            const res = await request(server)
                .get('/admin/projects')
                .expect(200);
            expect(res.body).toHaveProperty('projects');
            expect(Array.isArray(res.body.projects)).toBe(true);
            expect(res.body.projects).toContain(project_name);
        });

        it('should delete the project (success)', async () => {
            const res = await auth_request('delete', `/storage/${project_name}`).expect(200);
            expect(res.body).toEqual({ message: 'Project deleted successfully' });
        });

        it('should return 404 when deleting a non-existing project', async () => {
            const res = await auth_request('delete', `/storage/non_existing_project_${Date.now()}`).expect(404);
            expect(res.body).toHaveProperty('error', 'Project not found');
        });
    });

    // ==================== FILE TESTS (CRUD) ====================
    describe('Files - CRUD operations', () => {
        beforeAll(async () => {
            // Ensure project exists
            await auth_request('post', `/storage/project/${project_name}`);
        });

        it('should create a new file (POST) - 201', async () => {
            const res = await auth_request('post', `/storage/${project_name}/${filename}`, file_data).expect(201);
            expect(res.body).toHaveProperty('message', 'File created/replaced');
            expect(res.body.data).toEqual(file_data);
        });

        it('should list files in the project (GET /storage/:project/list)', async () => {
            const res = await auth_request('get', `/storage/${project_name}/list`).expect(200);
            expect(res.body).toHaveProperty('project', project_name);
            expect(res.body.files).toContain(filename);
        });

        it('should retrieve the file content (GET /storage/:project/:filename)', async () => {
            const res = await auth_request('get', `/storage/${project_name}/${filename}`).expect(200);
            expect(res.body).toEqual(file_data);
        });

        it('should return 404 when file does not exist', async () => {
            const res = await auth_request('get', `/storage/${project_name}/non_existing.json`).expect(404);
            expect(res.body).toHaveProperty('error', 'File not found');
        });

        it('should update (PUT) a file with merge (200)', async () => {
            const update_data = { newKey: 'mergedValue' };
            const res = await auth_request('put', `/storage/${project_name}/${filename}`, update_data).expect(200);
            expect(res.body).toHaveProperty('message', 'File updated (merged)');
            expect(res.body.data).toEqual({ ...file_data, ...update_data });
            // Update file_data for subsequent tests
            file_data = { ...file_data, ...update_data };
        });

        it('should patch (PATCH) a file with merge (200)', async () => {
            const patch_data = { number: 99 };
            const res = await auth_request('patch', `/storage/${project_name}/${filename}`, patch_data).expect(200);
            expect(res.body).toHaveProperty('message', 'File patched (merged)');
            expect(res.body.data).toEqual({ ...file_data, ...patch_data });
            file_data = { ...file_data, ...patch_data };
        });

        it('should return 400 when POST body is not a JSON object', async () => {
            const res = await request(server)
                .post(`/storage/${project_name}/invalid.json`)
                .send('not an object') // send a string
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${valid_token}`)
                .expect(400);
            expect(res.body).toHaveProperty('error', 'Request body must be a valid JSON object');
        });
    });

    // ==================== RECORDS TESTS (ARRAY OPERATIONS) ====================
    describe('Records - CRUD operations', () => {
        const records_filename = 'records_data.json';
        let created_record_id;

        beforeAll(async () => {
            // Ensure project exists
            await auth_request('post', `/storage/project/${project_name}`);
        });

        it('should add a record (POST) - 201', async () => {
            const record = { name: 'Alice', age: 30 };
            const res = await auth_request('post', `/storage/${project_name}/${records_filename}/records`, record).expect(201);
            expect(res.body).toHaveProperty('message', 'Record added');
            expect(res.body).toHaveProperty('id');
            expect(res.body.record).toMatchObject(record);
            created_record_id = res.body.id;
        });

        it('should add another record (POST)', async () => {
            const record = { name: 'Bob', age: 25 };
            const res = await auth_request('post', `/storage/${project_name}/${records_filename}/records`, record).expect(201);
            expect(res.body).toHaveProperty('id');
        });

        it('should list all records (GET /storage/:project/:filename/records)', async () => {
            const res = await auth_request('get', `/storage/${project_name}/${records_filename}/records`).expect(200);
            expect(res.body).toHaveProperty('records');
            expect(Array.isArray(res.body.records)).toBe(true);
            expect(res.body.records.length).toBeGreaterThan(0);
            // Verify the created record exists
            const found = res.body.records.find((r) => r.id === created_record_id);
            expect(found).toBeDefined();
        });

        it('should get a single record by ID (GET .../records/:id)', async () => {
            const res = await auth_request('get', `/storage/${project_name}/${records_filename}/records/${created_record_id}`).expect(200);
            expect(res.body).toHaveProperty('record');
            expect(res.body.record.id).toBe(created_record_id);
        });

        it('should return 404 when record ID does not exist', async () => {
            const fake_id = 'non_existing_id';
            const res = await auth_request('get', `/storage/${project_name}/${records_filename}/records/${fake_id}`).expect(404);
            expect(res.body).toHaveProperty('error', 'Record not found');
        });

        it('should update (PUT) a record (merge)', async () => {
            const update = { age: 31 };
            const res = await auth_request('put', `/storage/${project_name}/${records_filename}/records/${created_record_id}`, update).expect(200);
            expect(res.body).toHaveProperty('message', 'Record updated');
            expect(res.body.record).toMatchObject({ name: 'Alice', age: 31 });
        });

        it('should delete a record by ID (DELETE .../records/:id)', async () => {
            const res = await auth_request('delete', `/storage/${project_name}/${records_filename}/records/${created_record_id}`).expect(200);
            expect(res.body).toEqual({ message: 'Record deleted' });
        });

        it('should return 404 when deleting a non-existing record', async () => {
            const fake_id = 'non_existing_id';
            const res = await auth_request('delete', `/storage/${project_name}/${records_filename}/records/${fake_id}`).expect(404);
            expect(res.body).toHaveProperty('error', 'Record not found');
        });

        it('should automatically convert an object file to array on first record add', async () => {
            // Create a file containing an object (not an array)
            const obj_file = 'object_file.json';
            const obj_data = { initial: 'data' };
            await auth_request('post', `/storage/${project_name}/${obj_file}`, obj_data).expect(201);

            // Now add a record to that file (should convert it to an array)
            const new_record = { from: 'object' };
            const res = await auth_request('post', `/storage/${project_name}/${obj_file}/records`, new_record).expect(201);
            expect(res.body).toHaveProperty('id');

            // Verify the file is now an array with two records
            const list_res = await auth_request('get', `/storage/${project_name}/${obj_file}/records`).expect(200);
            expect(list_res.body.records).toHaveLength(2);
            expect(list_res.body.records[0]).toHaveProperty('id');
            expect(list_res.body.records[0]).toMatchObject(obj_data);
            expect(list_res.body.records[1]).toMatchObject({ id: expect.any(String), from: 'object' });
        });
    });

    // ==================== PARAMETER VALIDATION TESTS ====================
    describe('Parameter validation', () => {
        it('should return 404 when project name is empty (no route match)', async () => {
            await auth_request('get', '/storage//list').expect(404);
        });

        it('should return 404 when trying to create project with empty name', async () => {
            await auth_request('post', '/storage/project/').expect(404);
        });

        it('should return 404 when filename is empty (trailing slash)', async () => {
            await auth_request('get', `/storage/${project_name}/`).expect(404);
        });
    });
});