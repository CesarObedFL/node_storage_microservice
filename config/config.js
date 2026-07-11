import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * Application configuration.
 * Loaded from environment variables.
 */
export const port = process.env.PORT || 4000;
export const storage_path = process.env.STORAGE_PATH || './storage';

/**
 * Token admin for administrative routes.
 * Must be defined in .env as TOKEN_ADMIN.
 */
export const token_admin = process.env.TOKEN_ADMIN || null;

/**
 * Path to the tokens.json file.
 */
const TOKENS_FILE_PATH = path.join(__dirname, 'tokens.json');

/**
 * Loads tokens from the JSON file.
 * If the file does not exist, creates it with an empty object.
 *
 * @returns {Promise<object>} Object mapping project names to tokens.
 */
async function load_tokens_from_file() {
    try {
        const content = await fs.readFile(TOKENS_FILE_PATH, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist → create it
            await fs.writeFile(TOKENS_FILE_PATH, JSON.stringify({}, null, 2));
            return {};
        }
        throw new Error(`Failed to load tokens: ${error.message}`);
    }
}

/**
 * Saves tokens to the JSON file.
 *
 * @param {object} tokens - Object mapping project names to tokens.
 * @returns {Promise<void>}
 */
async function save_tokens_to_file(tokens) {
    await fs.writeFile(TOKENS_FILE_PATH, JSON.stringify(tokens, null, 2));
}

/**
 * Returns a map of token -> project name (for authentication).
 * Combines tokens from the JSON file and the .env file (PROJECT_TOKEN_*).
 *
 * @returns {Promise<Map>} Map of token -> project name.
 */
export async function load_token_map() {
    const map = new Map();

    // 1. Load from .env (PROJECT_TOKEN_* variables)
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith('PROJECT_TOKEN_')) {
            const project_name = key.replace('PROJECT_TOKEN_', '').toLowerCase();
            map.set(value, project_name);
        }
    }

    // 2. Load from tokens.json
    const file_tokens = await load_tokens_from_file();
    for (const [project_name, token] of Object.entries(file_tokens)) {
        map.set(token, project_name);
    }

    return map;
}

/**
 * Gets the token for a specific project from the JSON file.
 *
 * @param {string} project_name - The project name.
 * @returns {Promise<string|null>} The token, or null if not found.
 */
export async function get_token_for_project(project_name) {
    const tokens = await load_tokens_from_file();
    return tokens[project_name] || null;
}

/**
 * Sets or creates a token for a project.
 * If the project already has a token, it is returned (no overwrite).
 * To force regeneration, use `revoke_token` first.
 *
 * @param {string} project_name - The project name.
 * @param {string} token - The token to assign (optional; if not provided, generates one).
 * @returns {Promise<string>} The token assigned.
 */
export async function set_token_for_project(project_name, token = null) {
    const tokens = await load_tokens_from_file();
    if (tokens[project_name]) {
        return tokens[project_name]; // Return existing token
    }

    // Generate a token if not provided
    const new_token = token || generate_token();
    tokens[project_name] = new_token;
    await save_tokens_to_file(tokens);
    return new_token;
}

/**
 * Revokes (deletes) a token for a project.
 *
 * @param {string} project_name - The project name.
 * @returns {Promise<boolean>} True if the token was deleted, false if not found.
 */
export async function revoke_token_for_project(project_name) {
    const tokens = await load_tokens_from_file();
    if (!tokens[project_name]) {
        return false;
    }
    delete tokens[project_name];
    await save_tokens_to_file(tokens);
    return true;
}

/**
 * Lists all tokens (project -> token).
 *
 * @returns {Promise<object>} Object mapping project names to tokens.
 */
export async function list_all_tokens() {
    return await load_tokens_from_file();
}

/**
 * Generates a random token.
 *
 * @returns {string} Random token string.
 */
function generate_token() {
    const crypto = await import('crypto');
    return crypto.randomBytes(32).toString('hex');
}