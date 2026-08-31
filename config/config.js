/**
 * Configuration module for the Storage Microservice.
 * Loads environment variables and provides helper functions.
 *
 * @module config
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// ---------- Setup ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// ---------- Exported constants ----------

/** Port on which the server listens. Default: 3200 */
export const port = process.env.PORT || 3200;

/** Path to the storage directory. Default: './storage' */
export const storage_path = process.env.STORAGE_PATH || './storage';

/** Master token for admin routes. Must be set in .env. */
export const master_token = process.env.MASTER_TOKEN;

/** Path to the tokens JSON file used for dynamic project tokens. */
const tokens_file_path = path.join(__dirname, 'tokens.json');

// ---------- CORS ----------

/**
 * Parses the CORS_ORIGINS environment variable into an array of allowed origins.
 *
 * @returns {string[]} Array of allowed origins (trimmed, non-empty).
 */
export function get_cors_origins() {
  const origins = process.env.CORS_ORIGINS || '';
  if (!origins) return [];
  return origins.split(',').map((o) => o.trim()).filter((o) => o.length > 0);
}

// ---------- Token management (dynamic tokens stored in tokens.json) ----------

/**
 * Loads the token map from both the .env (static PROJECT_TOKEN_*) and the tokens.json file.
 * Static tokens from .env take precedence over dynamic ones.
 *
 * @returns {Promise<Map<string, string>>} A Map where key = token, value = project name.
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
  }

  const map = new Map();

  // Add static tokens from .env (PROJECT_TOKEN_*)
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('PROJECT_TOKEN_')) {
      const project_name = key.replace('PROJECT_TOKEN_', '').toLowerCase();
      map.set(value, project_name);
    }
  }

  // Add dynamic tokens from tokens.json (overwrites if conflict, though it shouldn't happen)
  for (const [token, project] of Object.entries(dynamic_tokens)) {
    map.set(token, project);
  }

  return map;
}

/**
 * Saves a token to the tokens.json file and updates the in-memory map.
 *
 * @param {string} token - The token to save.
 * @param {string} project - The project name associated with the token.
 * @returns {Promise<void>}
 * @throws {AppError} If the tokens.json file cannot be written.
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
 * Deletes a token from the tokens.json file and from the in-memory map.
 *
 * @param {string} token - The token to delete.
 * @returns {Promise<boolean>} True if the token was deleted, false if it did not exist.
 * @throws {AppError} If the tokens.json file cannot be read or written.
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

/**
 * Retrieves the project name associated with a token.
 * First checks the in-memory map (if available), otherwise loads from disk.
 *
 * @param {string} token - The token to look up.
 * @returns {Promise<string|null>} The project name, or null if not found.
 */
export async function get_project_from_token(token) {
  const map = await load_token_map();
  return map.get(token) || null;
}