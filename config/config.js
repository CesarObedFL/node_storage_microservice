import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la carpeta config
dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * Application configuration.
 * Loaded from environment variables.
 */
export const port = process.env.PORT || 4000;
export const storage_path = process.env.STORAGE_PATH || './storage';

/**
 * Map of valid API tokens to project names.
 * Tokens are defined in .env as: PROJECT_TOKEN_<project_name>=<token>
 * Example: PROJECT_TOKEN_demo=abc123
 */
export const token_map = (() => {
    const map = new Map();
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith('PROJECT_TOKEN_')) {
            // Extract project name from key (e.g., "PROJECT_TOKEN_demo" -> "demo")
            const project_name = key.replace('PROJECT_TOKEN_', '').toLowerCase();
            map.set(value, project_name);
        }
    }
    return map;
})();

/**
 * Validates that a given token exists in the token map.
 *
 * @param {string} token - The token to validate.
 * @returns {string|null} The project name associated with the token, or null if invalid.
 */
export function get_project_from_token(token) {
    if (!token || typeof token !== 'string') return null;
    return token_map.get(token) || null;
}