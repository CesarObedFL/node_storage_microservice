import request from 'supertest';
import app from '../server.js';
import { master_token, load_token_map, delete_token } from '../config/config.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKENS_FILE = path.join(__dirname, '../config/tokens.json');

/**
 * Restablish the file tokens.json to an empty file.
 * Usefull to clean the tests state.
 */
export async function clear_tokens_file() {
    await fs.writeFile(TOKENS_FILE, '{}', 'utf8');
}

/**
 * Creates a token for a project using the master token.
 *
 * @param {string} project - project name.
 * @param {object} server - server instance (app.listen(0)).
 * @returns {Promise<string>} generated Token .
 * @throws {Error} if there is an error.
 */
export async function create_project_token(project, server) {
    const res = await request(server)
        .post('/storage/admin/tokens')
        .set('Authorization', `Bearer ${master_token}`)
        .send({ project });
    if (res.status !== 201) {
        throw new Error(`Failed to create token: ${res.body.error || res.status}`);
    }
    return res.body.token;
}

/**
 * Obtains a valid token válido from the token map (the first available).
 * Useful to test that do not need to create an specific project.
 *
 * @param {object} server - Server instance.
 * @returns {Promise<string>} valid Token .
 * @throws {Error} If there is not available tokens.
 */
export async function get_valid_token(server) {
    const token_map = await load_token_map();
    const tokens = Array.from(token_map.keys());
    if (tokens.length === 0) {
        throw new Error('No tokens available. Please ensure at least one PROJECT_TOKEN_* is set in .env or create one via admin API.');
    }
    return tokens[0];
}

/**
 * Remove a token from the storage (useful to cleaning).
 *
 * @param {string} token - Token to eliminate.
 * @returns {Promise<boolean>} true if the token has been deleted, false if do not exists.
 */
export async function revoke_token(token) {
    return await delete_token(token);
}