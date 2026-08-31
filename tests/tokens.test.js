import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKENS_FILE = path.join(__dirname, '../config/tokens.json');

describe('Admin Token Management', () => {
    let server;
    const MASTER_TOKEN = master_token;
    const INVALID_TOKEN = 'invalid_token';

    beforeAll(async () => {
        await fs.writeFile(TOKENS_FILE, '{}', 'utf8');
        server = app.listen(0);
    });

    afterAll(async () => {
        if (server && server.close) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    const master_request = (method, url, data = null) => {
        let req = request(server)[method](url);
        req.set('Authorization', `Bearer ${MASTER_TOKEN}`);
        if (data) req.send(data);
        return req;
    };

    describe('POST /storage/admin/tokens', () => {
        it('should create a new token (201)', async () => {
            const project = 'new_project';
            const res = await master_request('post', '/storage/admin/tokens', { project }).expect(201);
            expect(res.body).toHaveProperty('message', 'Token created');
            expect(res.body).toHaveProperty('token');
            expect(res.body.project).toBe(project);
            // Verificar que el token se haya guardado
            const token_map = await load_token_map();
            expect(token_map.get(res.body.token)).toBe(project);
        });

        it('should return 400 if project name is missing', async () => {
            const res = await master_request('post', '/storage/admin/tokens', {}).expect(400);
            expect(res.body).toHaveProperty('error', 'Project name is required');
        });

        it('should return 400 if project name has invalid characters', async () => {
            const res = await master_request('post', '/storage/admin/tokens', { project: 'bad@project' }).expect(400);
            expect(res.body).toHaveProperty('error', 'Project name can only contain letters, numbers, and underscores');
        });

        it('should return 401 if master token is invalid', async () => {
            await request(server)
                .post('/storage/admin/tokens')
                .set('Authorization', `Bearer ${INVALID_TOKEN}`)
                .send({ project: 'test' })
                .expect(401);
        });
    });

    describe('GET /storage/admin/tokens', () => {
        it('should list all tokens (200)', async () => {
            const res = await master_request('get', '/storage/admin/tokens').expect(200);
            expect(res.body).toHaveProperty('tokens');
            expect(typeof res.body.tokens).toBe('object');
        });

        it('should return 401 if master token is invalid', async () => {
            await request(server)
                .get('/storage/admin/tokens')
                .set('Authorization', `Bearer ${INVALID_TOKEN}`)
                .expect(401);
        });
    });

    describe('DELETE /storage/admin/tokens/:token', () => {
        let created_token;

        beforeEach(async () => {
            const res = await master_request('post', '/storage/admin/tokens', { project: 'temp_project' }).expect(201);
            created_token = res.body.token;
        });

        afterEach(async () => {
            try {
                await delete_token(created_token);
            } catch (_) { }
        });

        it('should revoke a token (200)', async () => {
            const res = await master_request('delete', `/storage/admin/tokens/${created_token}`).expect(200);
            expect(res.body).toHaveProperty('message', 'Token revoked successfully');
            const token_map = await load_token_map();
            expect(token_map.has(created_token)).toBe(false);
        });

        it('should return 404 if token does not exist', async () => {
            const res = await master_request('delete', '/storage/admin/tokens/non_existing_token').expect(404);
            expect(res.body).toHaveProperty('error', 'Token not found');
        });

        it('should return 401 if master token is invalid', async () => {
            await request(server)
                .delete(`/storage/admin/tokens/${created_token}`)
                .set('Authorization', `Bearer ${INVALID_TOKEN}`)
                .expect(401);
        });
    });
}); 