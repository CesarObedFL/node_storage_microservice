import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { master_token } from '../config/config.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKENS_FILE = path.join(__dirname, '../config/tokens.json');

// ======================================================
// 1. CONFIGURACIÓN Y HELPERS
// ======================================================

const MASTER_TOKEN = master_token || 'cho8AdminToken&31231mkfasdoiff';
const TEST_PROJECT = 'test_storage_project';
const TEST_FILE = 'test_data.json';
const TEST_RECORD = { name: 'Test User', age: 30, active: true };

let project_token;

/**
 * Crea un token para el proyecto de prueba usando el token maestro.
 */
// Helper para crear token de proyecto usando master token
async function create_project_token(project) {
    const res = await request(app)
        .post('/storage/admin/tokens')
        .set('Authorization', `Bearer ${master_token}`)
        .send({ project });
    if (res.status !== 201) {
        throw new Error(`Failed to create token: ${res.body.error || res.status}`);
    }
    return res.body.token;
}

/**
 * Limpia los datos del proyecto de prueba después de las pruebas.
 */
async function clean_test_project() {
    // Si el storage tiene un endpoint para eliminar proyectos, úsalo.
    // Ejemplo: DELETE /storage/:project
    // Si no, puedes eliminar el archivo manualmente.
    // Por ahora, intentamos eliminar el archivo de prueba si existe.
    try {
        await request(app)
            .delete(`/storage/${TEST_PROJECT}`)
            .set('Authorization', `Bearer ${MASTER_TOKEN}`);
    } catch (error) {
        // Ignoramos errores si el proyecto no existe.
    }
}

// ======================================================
// 2. PRUEBAS DE OPERACIONES CRUD
// ======================================================

describe('Storage CRUD operations', () => {
    // Antes de todas las pruebas, crear el token de proyecto.
    beforeAll(async () => {
        await fs.writeFile(TOKENS_FILE, '{}', 'utf8');
        project_token = await create_project_token(TEST_PROJECT);
        expect(project_token).toBeDefined();
    });

    // Después de todas las pruebas, limpiar los datos.
    afterAll(async () => {
        await clean_test_project();
    });

    // --------------------------------------------------
    // 2.1 Guardar un registro (POST)
    // --------------------------------------------------
    describe('POST /storage/:project/:file/records', () => {
        test('debe guardar un registro con token válido', async () => {
            const res = await request(app)
                .post(`/storage/${TEST_PROJECT}/${TEST_FILE}/records`)
                .set('Authorization', `Bearer ${project_token}`)
                .send(TEST_RECORD);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.record).toMatchObject(TEST_RECORD);
        });

        test('debe rechazar si no se envía token', async () => {
            const res = await request(app)
                .post(`/storage/${TEST_PROJECT}/${TEST_FILE}/records`)
                .send(TEST_RECORD);

            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/Missing or invalid Authorization header/i);
        });

        test('debe rechazar si el token es inválido', async () => {
            const res = await request(app)
                .post(`/storage/${TEST_PROJECT}/${TEST_FILE}/records`)
                .set('Authorization', 'Bearer invalid_token')
                .send(TEST_RECORD);

            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/Invalid or expired token/i);
        });

        test('debe rechazar si el token no corresponde al proyecto', async () => {
            const res = await request(app)
                .post('/storage/other_project/other.json/records')
                .set('Authorization', `Bearer ${project_token}`)
                .send(TEST_RECORD);

            expect(res.status).toBe(403);
            expect(res.body.error).toMatch(/Token does not grant access to this project/i);
        });
    });

    // --------------------------------------------------
    // 2.2 Obtener registros (GET)
    // --------------------------------------------------
    describe('GET /storage/:project/:file/records', () => {
        test('debe obtener los registros con token válido', async () => {
            // Primero guardamos un registro para asegurar que hay datos.
            await request(app)
                .post(`/storage/${TEST_PROJECT}/${TEST_FILE}/records`)
                .set('Authorization', `Bearer ${project_token}`)
                .send(TEST_RECORD);

            const res = await request(app)
                .get(`/storage/${TEST_PROJECT}/${TEST_FILE}/records`)
                .set('Authorization', `Bearer ${project_token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.records)).toBe(true);
            expect(res.body.records).toContainEqual(expect.objectContaining(TEST_RECORD));
        });

        test('debe rechazar con token inválido', async () => {
            const res = await request(app)
                .get(`/storage/${TEST_PROJECT}/${TEST_FILE}/records`)
                .set('Authorization', 'Bearer invalid_token');

            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/Invalid or expired token/i);
        });

        test('debe rechazar con token de proyecto incorrecto', async () => {
            const res = await request(app)
                .get('/storage/other_project/other.json/records')
                .set('Authorization', `Bearer ${project_token}`);

            expect(res.status).toBe(403);
            expect(res.body.error).toMatch(/Token does not grant access to this project/i);
        });
    });

    // --------------------------------------------------
    // 2.3 Actualizar un registro (PUT / PATCH)
    // --------------------------------------------------
    describe('PUT /storage/:project/:file/records/:id', () => {
        let record_id;

        beforeAll(async () => {
            // Guardamos un registro para obtener su ID.
            const res = await request(app)
                .post(`/storage/${TEST_PROJECT}/${TEST_FILE}/records`)
                .set('Authorization', `Bearer ${project_token}`)
                .send({ name: 'To Update', age: 25 });
            record_id = res.body.id;
        });

        test('debe actualizar un registro existente', async () => {
            const updateData = { name: 'Updated Name', age: 26 };
            const res = await request(app)
                .put(`/storage/${TEST_PROJECT}/${TEST_FILE}/records/${record_id}`)
                .set('Authorization', `Bearer ${project_token}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.record).toMatchObject(updateData);
        });

        test('debe rechazar con token inválido', async () => {
            const res = await request(app)
                .put(`/storage/${TEST_PROJECT}/${TEST_FILE}/records/${record_id}`)
                .set('Authorization', 'Bearer invalid_token')
                .send({ name: 'Fail' });

            expect(res.status).toBe(401);
        });
    });

    // --------------------------------------------------
    // 2.4 Eliminar un registro (DELETE)
    // --------------------------------------------------
    describe('DELETE /storage/:project/:file/records/:id', () => {
        let record_id;

        beforeAll(async () => {
            const res = await request(app)
                .post(`/storage/${TEST_PROJECT}/${TEST_FILE}/records`)
                .set('Authorization', `Bearer ${project_token}`)
                .send({ name: 'To Delete' });
            record_id = res.body.id;
        });

        test('debe eliminar un registro existente', async () => {
            const res = await request(app)
                .delete(`/storage/${TEST_PROJECT}/${TEST_FILE}/records/${record_id}`)
                .set('Authorization', `Bearer ${project_token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/deleted|removed/i);
        });

        test('debe rechazar con token inválido', async () => {
            const res = await request(app)
                .delete(`/storage/${TEST_PROJECT}/${TEST_FILE}/records/${record_id}`)
                .set('Authorization', 'Bearer invalid_token');

            expect(res.status).toBe(401);
        });
    });

    // --------------------------------------------------
    // 2.5 Pruebas de rutas de administración con token de proyecto
    // --------------------------------------------------
    describe('Admin routes with project token', () => {
        test('debe rechazar acceso a /admin/tokens con token de proyecto', async () => {
            const res = await request(app)
                .get('/storage/admin/tokens')
                .set('Authorization', `Bearer ${project_token}`);

            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/invalid|expired/i);
        });

        test('debe rechazar creación de token con token de proyecto', async () => {
            const res = await request(app)
                .post('/storage/admin/tokens')
                .set('Authorization', `Bearer ${project_token}`)
                .send({ project: 'hack_project' });

            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/invalid|expired/i);
        });
    });
});

// ======================================================
// 3. PRUEBAS DE AUTENTICACIÓN GLOBAL
// ======================================================

describe('Authentication middleware', () => {
    test('debe rechazar peticiones sin token', async () => {
        const res = await request(app)
            .get('/storage/any/any.json/records');
        expect(res.status).toBe(401);
    });

    test('debe rechazar peticiones con token mal formado', async () => {
        const res = await request(app)
            .get('/storage/any/any.json/records')
            .set('Authorization', 'Token sin Bearer');
        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/Missing or invalid Authorization header/i);
    });
});