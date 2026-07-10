import request from 'supertest';
import app from '../server.js'; // Asegúrate de que tu server.js exporte 'app'

describe('GET /storage/:project', () => {
    it('should list JSON files for a valid project', async () => {
        const projectName = 'mi_proyecto';
        const response = await request(app)
            .get(`/storage/${projectName}`)
            .expect(200);

        expect(response.body).toHaveProperty('project', projectName);
        expect(response.body).toHaveProperty('files');
        expect(Array.isArray(response.body.files)).toBe(true);
    });
});