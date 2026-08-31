import request from 'supertest';
import app from '../server.js';
import { master_token } from '../config/config.js';

export const MASTER_TOKEN = master_token || 'cho8AdminToken&31231mkfasdoiff';

export const create_project_token = async (project) => {
    const res = await request(app)
        .post('/admin/tokens')
        .set('Authorization', `Bearer ${MASTER_TOKEN}`)
        .send({ project });
    return res.body.token;
};

export const TEST_PROJECT = 'test_project';
export const TEST_FILE = 'test.json';