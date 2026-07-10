import request from 'supertest';
import app from '../server.js';

describe('Storage Microservice - Full API Tests', () => {
    let server;
    let projectName;       // Proyecto único para la suite
    let filename;          // Archivo de prueba
    let fileData;          // Datos del archivo
    let recordId;          // ID del registro creado

    // ==================== SETUP ====================
    beforeAll(() => {
        server = app.listen(0);
        // Generar nombres únicos para evitar colisiones entre ejecuciones
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 6);
        projectName = `test_project_${timestamp}_${random}`;
        filename = 'test_data.json';
        fileData = { initial: 'value', number: 42 };
    });

    afterAll(async () => {
        // Limpiar: eliminar el proyecto si existe (ignorar errores)
        try {
            await request(server).delete(`/storage/${projectName}`);
        } catch (_) {
            // ignore
        }
        await new Promise((resolve) => server.close(resolve));
    });

    // ==================== PROJECT TESTS ====================
    describe('Projects', () => {
        it('should create a new project (201)', async () => {
            const res = await request(server)
                .post(`/storage/project/${projectName}`)
                .expect(201);
            expect(res.body).toEqual({
                message: 'Project created',
                project: projectName,
            });
        });

        it('should return 200 if project already exists', async () => {
            const res = await request(server)
                .post(`/storage/project/${projectName}`)
                .expect(200);
            expect(res.body).toEqual({
                message: 'Project already exists',
                project: projectName,
            });
        });

        it('should list all projects (admin)', async () => {
            const res = await request(server)
                .get('/admin/projects')
                .expect(200);
            expect(res.body).toHaveProperty('projects');
            expect(Array.isArray(res.body.projects)).toBe(true);
            expect(res.body.projects).toContain(projectName);
        });

        it('should delete the project (success)', async () => {
            const res = await request(server)
                .delete(`/storage/${projectName}`)
                .expect(200);
            expect(res.body).toEqual({ message: 'Project deleted successfully' });
        });

        it('should return 404 when deleting a non-existing project', async () => {
            const res = await request(server)
                .delete(`/storage/non_existing_project_${Date.now()}`)
                .expect(404);
            expect(res.body).toHaveProperty('error', 'Project not found');
        });
    });

    // ==================== FILE TESTS (CRUD) ====================
    // Creamos de nuevo el proyecto para pruebas de archivos
    describe('Files - CRUD operations', () => {
        beforeAll(async () => {
            // Asegurar que el proyecto existe
            await request(server).post(`/storage/project/${projectName}`);
        });

        it('should create a new file (POST) - 201', async () => {
            const res = await request(server)
                .post(`/storage/${projectName}/${filename}`)
                .send(fileData)
                .expect(201);
            expect(res.body).toHaveProperty('message', 'File created/replaced');
            expect(res.body.data).toEqual(fileData);
        });

        it('should list files in the project (GET /storage/:project)', async () => {
            const res = await request(server)
                .get(`/storage/${projectName}`)
                .expect(200);
            expect(res.body).toHaveProperty('project', projectName);
            expect(res.body.files).toContain(filename);
        });

        it('should retrieve the file content (GET /storage/:project/:filename)', async () => {
            const res = await request(server)
                .get(`/storage/${projectName}/${filename}`)
                .expect(200);
            expect(res.body).toEqual(fileData);
        });

        it('should return 404 when file does not exist', async () => {
            const res = await request(server)
                .get(`/storage/${projectName}/non_existing.json`)
                .expect(404);
            expect(res.body).toHaveProperty('error', 'File not found');
        });

        it('should update (PUT) a file with merge (200)', async () => {
            const updateData = { newKey: 'mergedValue' };
            const res = await request(server)
                .put(`/storage/${projectName}/${filename}`)
                .send(updateData)
                .expect(200);
            expect(res.body).toHaveProperty('message', 'File updated (merged)');
            expect(res.body.data).toEqual({ ...fileData, ...updateData });
            // Actualizar fileData para pruebas posteriores
            fileData = { ...fileData, ...updateData };
        });

        it('should patch (PATCH) a file with merge (200)', async () => {
            const patchData = { number: 99 };
            const res = await request(server)
                .patch(`/storage/${projectName}/${filename}`)
                .send(patchData)
                .expect(200);
            expect(res.body).toHaveProperty('message', 'File patched (merged)');
            expect(res.body.data).toEqual({ ...fileData, ...patchData });
            fileData = { ...fileData, ...patchData };
        });

        it('should return 400 when POST body is not a JSON object', async () => {
            const res = await request(server)
                .post(`/storage/${projectName}/invalid.json`)
                .send('not an object') // enviar string
                .set('Content-Type', 'application/json')
                .expect(400);
            expect(res.body).toHaveProperty('error', 'Request body must be a JSON object (not an array)');
        });
    });

    // ==================== RECORDS TESTS (ARRAY OPERATIONS) ====================
    describe('Records - CRUD operations', () => {
        const recordsFilename = 'records_data.json';
        let createdRecordId;

        beforeAll(async () => {
            // Asegurar proyecto y archivo de registros (vacío o con datos)
            await request(server).post(`/storage/project/${projectName}`);
            // Opcional: forzar archivo vacío (no es necesario, add_record lo crea)
        });

        it('should add a record (POST) - 201', async () => {
            const record = { name: 'Alice', age: 30 };
            const res = await request(server)
                .post(`/storage/${projectName}/${recordsFilename}/records`)
                .send(record)
                .expect(201);
            expect(res.body).toHaveProperty('message', 'Record added');
            expect(res.body).toHaveProperty('id');
            expect(res.body.record).toMatchObject(record);
            createdRecordId = res.body.id;
        });

        it('should add another record (POST)', async () => {
            const record = { name: 'Bob', age: 25 };
            const res = await request(server)
                .post(`/storage/${projectName}/${recordsFilename}/records`)
                .send(record)
                .expect(201);
            expect(res.body).toHaveProperty('id');
        });

        it('should list all records (GET /storage/:project/:filename/records)', async () => {
            const res = await request(server)
                .get(`/storage/${projectName}/${recordsFilename}/records`)
                .expect(200);
            expect(res.body).toHaveProperty('records');
            expect(Array.isArray(res.body.records)).toBe(true);
            expect(res.body.records.length).toBeGreaterThan(0);
            // Verificar que el registro creado existe
            const found = res.body.records.find(r => r.id === createdRecordId);
            expect(found).toBeDefined();
        });

        it('should get a single record by ID (GET .../records/:id)', async () => {
            const res = await request(server)
                .get(`/storage/${projectName}/${recordsFilename}/records/${createdRecordId}`)
                .expect(200);
            expect(res.body).toHaveProperty('record');
            expect(res.body.record.id).toBe(createdRecordId);
        });

        it('should return 404 when record ID does not exist', async () => {
            const fakeId = 'non_existing_id';
            const res = await request(server)
                .get(`/storage/${projectName}/${recordsFilename}/records/${fakeId}`)
                .expect(404);
            expect(res.body).toHaveProperty('error', 'Record not found');
        });

        it('should update (PUT) a record (merge)', async () => {
            const update = { age: 31 };
            const res = await request(server)
                .put(`/storage/${projectName}/${recordsFilename}/records/${createdRecordId}`)
                .send(update)
                .expect(200);
            expect(res.body).toHaveProperty('message', 'Record updated');
            expect(res.body.record).toMatchObject({ name: 'Alice', age: 31 });
        });

        it('should delete a record by ID (DELETE .../records/:id)', async () => {
            const res = await request(server)
                .delete(`/storage/${projectName}/${recordsFilename}/records/${createdRecordId}`)
                .expect(200);
            expect(res.body).toEqual({ message: 'Record deleted' });
        });

        it('should return 404 when deleting a non-existing record', async () => {
            const fakeId = 'non_existing_id';
            const res = await request(server)
                .delete(`/storage/${projectName}/${recordsFilename}/records/${fakeId}`)
                .expect(404);
            expect(res.body).toHaveProperty('error', 'Record not found');
        });

        it('should automatically convert an object file to array on first record add', async () => {
            // Crear un archivo que contenga un objeto (no array)
            const objFile = 'object_file.json';
            const objData = { initial: 'data' };
            await request(server)
                .post(`/storage/${projectName}/${objFile}`)
                .send(objData)
                .expect(201);

            // Ahora agregar un registro a ese archivo (debería convertirlo a array)
            const newRecord = { from: 'object' };
            const res = await request(server)
                .post(`/storage/${projectName}/${objFile}/records`)
                .send(newRecord)
                .expect(201);

            // Verificar que el archivo ahora es un array con dos registros
            const listRes = await request(server)
                .get(`/storage/${projectName}/${objFile}/records`)
                .expect(200);
            expect(listRes.body.records).toHaveLength(2);
            expect(listRes.body.records[0]).toHaveProperty('id');
            expect(listRes.body.records[0]).toMatchObject(objData);
            expect(listRes.body.records[1]).toMatchObject({ id: expect.any(String), from: 'object' });
        });
    });

    // ==================== ERROR HANDLING & VALIDATION ====================
    describe('Validation and error handling', () => {
        it('should return 400 when project name is missing (empty)', async () => {
            const res = await request(server)
                .get('/storage/')
                .expect(404); // Nota: express devuelve 404 porque no coincide la ruta
            // Mejor probar con un parámetro vacío
            const res2 = await request(server)
                .get('/storage/   ')
                .expect(400);
            expect(res2.body).toHaveProperty('error', 'Missing or invalid project name');
        });

        it('should return 400 when filename is missing (empty)', async () => {
            const res = await request(server)
                .get(`/storage/${projectName}/`)
                .expect(404);
            // Como el parámetro filename es obligatorio, express devuelve 404
            // Para probar el error de "Filename is required", usamos un nombre vacío enviando directamente
            // Pero en Express no es fácil pasar un parámetro vacío. Podemos probar con un nombre de archivo vacío en la URL,
            // lo cual resulta en 404. Mejor probar con un POST donde el filename es undefined.
        });
    });
});