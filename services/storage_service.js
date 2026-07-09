import fs from 'fs/promises';
import path from 'path';
import AppError from '../utils/error_handler.js';

const storage_path = process.env.STORAGE_PATH || './storage';

/**
 * Resolves and validates a file path to prevent directory traversal attacks.
 *
 * @param {string} project - The project name (subfolder under storage).
 * @param {string} filename - The file name (must end with .json).
 * @returns {string} Absolute safe path to the file.
 * @throws {AppError} If the resolved path is outside the storage root.
 */
export function get_safe_path(project, filename) {
    const base = path.resolve(storage_path);
    const full_path = path.resolve(base, project, filename);
    if (!full_path.startsWith(base)) {
        throw new AppError('Access denied: invalid path', 403);
    }
    return full_path;
}

/**
 * Returns the absolute directory path for a given project.
 *
 * @param {string} project - The project name.
 * @returns {string} Absolute path to the project directory.
 */
export function get_project_dir(project) {
    return path.resolve(storage_path, project);
}

/**
 * Retrieves a list of all .json files in the project directory.
 *
 * @param {string} project - The project name.
 * @returns {Promise<string[]>} Array of filenames (only .json files).
 * @throws {AppError} If reading the directory fails (except for missing folder).
 */
export async function list_project_files(project) {
    const project_dir = get_project_dir(project);
    try {
        const files = await fs.readdir(project_dir);
        return files.filter(f => f.endsWith('.json'));
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Project folder does not exist yet → empty list
        }
        throw new AppError('Error listing files', 500);
    }
}

/**
 * Reads and parses a JSON file from the project directory.
 *
 * @param {string} project - The project name.
 * @param {string} filename - The file name (must end with .json).
 * @returns {Promise<object>} Parsed JSON object.
 * @throws {AppError} If file is not found (404) or read/parse fails (500).
 */
export async function read_json_file(project, filename) {
    const file_path = get_safe_path(project, filename);
    try {
        const content = await fs.readFile(file_path, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new AppError('File not found', 404);
        }
        throw new AppError('Error reading file', 500);
    }
}

/**
 * Writes (or replaces) a JSON file in the project directory.
 * If merge is true, performs a shallow merge with existing data.
 *
 * @param {string} project - The project name.
 * @param {string} filename - The file name (must end with .json).
 * @param {object} data - JSON-serializable object to write.
 * @param {boolean} merge - If true, merge with existing; otherwise overwrite.
 * @returns {Promise<object>} The final data written.
 * @throws {AppError} If data is not an object, or write fails (500).
 */
export async function write_json_file(project, filename, data, merge = false) {
    // Ensure project folder exists
    const project_dir = get_project_dir(project);
    await fs.mkdir(project_dir, { recursive: true });

    const file_path = get_safe_path(project, filename);
    let final_data = data;

    if (merge) {
        try {
            const existing_content = await fs.readFile(file_path, 'utf8');
            const existing_data = JSON.parse(existing_content);
            // Shallow merge
            final_data = { ...existing_data, ...data };
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw new AppError('Error reading existing file for merge', 500);
            }
            // If file doesn't exist, proceed with new data (no merge)
        }
    }

    try {
        await fs.writeFile(file_path, JSON.stringify(final_data, null, 2), 'utf8');
        return final_data;
    } catch (error) {
        throw new AppError('Error writing file', 500);
    }
}

/**
 * Deletes a JSON file from the project directory.
 *
 * @param {string} project - The project name.
 * @param {string} filename - The file name (must end with .json).
 * @returns {Promise<void>}
 * @throws {AppError} If file is not found (404) or deletion fails (500).
 */
export async function delete_json_file(project, filename) {
    const file_path = get_safe_path(project, filename);
    try {
        await fs.unlink(file_path);
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new AppError('File not found', 404);
        }
        throw new AppError('Error deleting file', 500);
    }
}

/**
 * Creates a new project folder in the storage directory.
 *
 * @param {string} project - The project name.
 * @returns {Promise<{ created: boolean }>} - Indicates if the folder was newly created.
 * @throws {AppError} If creation fails due to filesystem error (500).
 */
export async function create_project_folder(project) {
    const project_dir = get_project_dir(project);
    try {
        await fs.mkdir(project_dir, { recursive: false });
        return { created: true };
    } catch (error) {
        if (error.code === 'EEXIST') {
            return { created: false };
        }
        throw new AppError('Error creating project folder', 500);
    }
}

/**
 * Deletes an entire project folder and all its contents.
 *
 * @param {string} project - The project name.
 * @returns {Promise<void>}
 * @throws {AppError} If project folder does not exist (404) or deletion fails (500).
 */
export async function delete_project_folder(project) {
    const project_dir = get_project_dir(project);
    try {
        await fs.rm(project_dir, { recursive: true, force: false });
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new AppError('Project not found', 404);
        }
        throw new AppError('Error deleting project', 500);
    }
}