import request from 'supertest';
import app from '../server.js';
import { master_token, load_token_map, delete_token } from '../config/config.js';

describe('Admin Token Management', () => {
    let server;

    beforeAll(() => {
        server = app.listen(0);
    });

    afterAll(async () => {
        await new Promise((resolve) => server.close(resolve));
    });

    const valid_master_token = master_token;
    const invalid_token = 'invalid_token';

    // Helper para peticiones autenticadas con master token
    const master_request = (method, url, data = null) => {
        let req = request(server)[method](url);
        req.set('Authorization', `Bearer ${valid_master_token}`);
        if (data) req.send(data);
        return req;
    };

    describe('POST /admin/tokens', () => {
        it('should create a new token (201)', async () => {
            const project = 'new_project';
            const res = await master_request('post', '/admin/tokens', { project }).expect(201);
            expect(res.body).toHaveProperty('message', 'Token created');
            expect(res.body).toHaveProperty('token');
            expect(res.body.project).toBe(project);

            // Verificar que el token se haya guardado
            const token_map = await load_token_map();
            expect(token_map.get(res.body.token)).toBe(project);
        });

        it('should return 400 if project name is missing', async () => {
            const res = await master_request('post', '/admin/tokens', {}).expect(400);
            expect(res.body).toHaveProperty('error', 'Project name is required');
        });

        it('should return 400 if project name has invalid characters', async () => {
            const res = await master_request('post', '/admin/tokens', { project: 'bad@project' }).expect(400);
            expect(res.body).toHaveProperty('error', 'Project name can only contain letters, numbers, and underscores');
        });

        it('should return 401 if master token is invalid', async () => {
            await request(server)
                .post('/admin/tokens')
                .set('Authorization', `Bearer ${invalid_token}`)
                .send({ project: 'test' })
                .expect(401);
        });
    });

    describe('GET /admin/tokens', () => {
        it('should list all tokens (200)', async () => {
            const res = await master_request('get', '/admin/tokens').expect(200);
            expect(res.body).toHaveProperty('tokens');
            expect(typeof res.body.tokens).toBe('object');
        });

        it('should return 401 if master token is invalid', async () => {
            await request(server)
                .get('/admin/tokens')
                .set('Authorization', `Bearer ${invalid_token}`)
                .expect(401);
        });
    });

    describe('DELETE /admin/tokens/:token', () => {
        let created_token;

        beforeEach(async () => {
            // Crear un token para pruebas
            const res = await master_request('post', '/admin/tokens', { project: 'temp_project' }).expect(201);
            created_token = res.body.token;
        });

        afterEach(async () => {
            // Limpiar token creado en caso de que la prueba falle
            try {
                await delete_token(created_token);
            } catch (_) { }
        });

        it('should revoke a token (200)', async () => {
            const res = await master_request('delete', `/admin/tokens/${created_token}`).expect(200);
            expect(res.body).toHaveProperty('message', 'Token revoked successfully');

            // Verificar que ya no existe
            const token_map = await load_token_map();
            expect(token_map.has(created_token)).toBe(false);
        });

        it('should return 404 if token does not exist', async () => {
            const res = await master_request('delete', '/admin/tokens/non_existing_token').expect(404);
            expect(res.body).toHaveProperty('error', 'Token not found');
        });

        it('should return 401 if master token is invalid', async () => {
            await request(server)
                .delete(`/admin/tokens/${created_token}`)
                .set('Authorization', `Bearer ${invalid_token}`)
                .expect(401);
        });
    });
});