import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

export const port = process.env.PORT || 4000;
export const storage_path = process.env.STORAGE_PATH || './storage';
export const master_token = process.env.MASTER_TOKEN;


// Ruta al archivo de tokens dinámicos
const tokens_file_path = path.join(__dirname, 'tokens.json');


/**
 * Parse CORS origins from environment variable.
 * Supports comma-separated list, with optional spaces.
 *
 * @returns {string[]} Array of allowed origins.
 */
export function get_cors_origins() {
  const origins = process.env.CORS_ORIGINS || '';
  if (!origins) return [];
  return origins.split(',').map(o => o.trim()).filter(o => o.length > 0);
}

/**
 * Carga el mapa de tokens desde el archivo tokens.json y los tokens del .env.
 * Los tokens del .env tienen prioridad y no se pueden modificar.
 */
export async function load_token_map() {
    let dynamic_tokens = {};
    try {
        const data = await fs.readFile(tokens_file_path, 'utf8');
        dynamic_tokens = JSON.parse(data);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Error reading tokens file:', error);
        }
        // Si el archivo no existe, comenzamos con vacío
    }

    // Construir mapa combinando .env y archivo
    const map = new Map();
    // Primero los del .env (PROJECT_TOKEN_*)
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith('PROJECT_TOKEN_')) {
            const project_name = key.replace('PROJECT_TOKEN_', '').toLowerCase();
            map.set(value, project_name);
        }
    }
    // Luego los del archivo (sobrescriben si hay conflicto, pero no debería)
    for (const [token, project] of Object.entries(dynamic_tokens)) {
        map.set(token, project);
    }
    return map;
}

/**
 * Guarda un token en el archivo tokens.json.
 * @param {string} token - Token a guardar.
 * @param {string} project - Nombre del proyecto.
 */
export async function save_token(token, project) {
    let tokens = {};
    try {
        const data = await fs.readFile(tokens_file_path, 'utf8');
        tokens = JSON.parse(data);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    tokens[token] = project;
    await fs.writeFile(tokens_file_path, JSON.stringify(tokens, null, 2));
}

/**
 * Elimina un token del archivo tokens.json.
 * @param {string} token - Token a eliminar.
 * @returns {boolean} true si se eliminó, false si no existía.
 */
export async function delete_token(token) {
    let tokens = {};
    try {
        const data = await fs.readFile(tokens_file_path, 'utf8');
        tokens = JSON.parse(data);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        return false;
    }
    if (!tokens[token]) return false;
    delete tokens[token];
    await fs.writeFile(tokens_file_path, JSON.stringify(tokens, null, 2));
    return true;
}