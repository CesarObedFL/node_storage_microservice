import fs from 'fs/promises';
import path from 'path';
import AppError from '../utils/error_handler.js';

const storage_path = process.env.STORAGE_PATH || './storage';

/**
 * Resolves and validates a file path to prevent directory traversal attacks.
 *
 * @param {string} project - The project name (subfolder under storage).
 * @param {string} filename - The file name.
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

// ==================== PROJECT MANAGEMENT ====================

/**
 * Creates a new project folder.
 *
 * @param {string} project - The project name.
 * @returns {Promise<{ created: boolean }>} - Whether the folder was newly created.
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

/**
 * Retrieves a list of all projects (folders) in the storage directory.
 *
 * @returns {Promise<string[]>} Array of project names.
 * @throws {AppError} If reading the storage directory fails.
 */
export async function list_projects() {
    try {
        const entries = await fs.readdir(storage_path, { withFileTypes: true });
        return entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw new AppError('Error listing projects', 500);
    }
}

// ==================== FILE OPERATIONS (READ) ====================

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
            return [];
        }
        throw new AppError('Error listing files', 500);
    }
}

/**
 * Reads and parses a JSON file from the project directory.
 *
 * @param {string} project - The project name.
 * @param {string} filename - The file name.
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

// ==================== FILE OPERATIONS (WRITE) ====================

/**
 * Writes (or replaces) a JSON file in the project directory.
 *
 * @param {string} project - The project name.
 * @param {string} filename - The file name.
 * @param {object} data - JSON-serializable object to write.
 * @param {boolean} merge - If true, perform a shallow merge with existing data.
 * @returns {Promise<object>} The final data written.
 * @throws {AppError} If data is not an object, or write fails (500).
 */
export async function write_json_file(project, filename, data, merge = false) {
    const project_dir = get_project_dir(project);
    await fs.mkdir(project_dir, { recursive: true });

    const file_path = get_safe_path(project, filename);
    let final_data = data;

    if (merge) {
        try {
            const existing_content = await fs.readFile(file_path, 'utf8');
            const existing_data = JSON.parse(existing_content);
            final_data = { ...existing_data, ...data };
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw new AppError('Error reading existing file for merge', 500);
            }
        }
    }

    try {
        await fs.writeFile(file_path, JSON.stringify(final_data, null, 2), 'utf8');
        return final_data;
    } catch (error) {
        throw new AppError('Error writing file', 500);
    }
}

// ==================== RECORD OPERATIONS (ARRAY-BASED) ====================

/**
 * Reads the records array from a JSON file.
 * Assumes the file contains an array of objects.
 *
 * @param {string} project - Project name.
 * @param {string} filename - File name.
 * @returns {Promise<object[]>} Array of records.
 * @throws {AppError} If file not found, or content is not an array.
 */
async function read_records_array(project, filename) {
    const file_path = get_safe_path(project, filename);
    try {
        const content = await fs.readFile(file_path, 'utf8');
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
            throw new AppError('File must contain an array of records', 400);
        }
        return parsed;
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new AppError('File not found', 404);
        }
        if (error instanceof AppError) throw error;
        throw new AppError('Error reading records file', 500);
    }
}

/**
 * Writes the records array to a JSON file.
 *
 * @param {string} project - Project name.
 * @param {string} filename - File name.
 * @param {object[]} records - Array of records.
 * @returns {Promise<void>}
 * @throws {AppError} If write fails (500).
 */
async function write_records_array(project, filename, records) {
    const file_path = get_safe_path(project, filename);
    try {
        await fs.writeFile(file_path, JSON.stringify(records, null, 2), 'utf8');
    } catch (error) {
        throw new AppError('Error writing records file', 500);
    }
}

/**
 * Lists all records (entire array) from the JSON file.
 *
 * @param {string} project - Project name.
 * @param {string} filename - File name.
 * @returns {Promise<object[]>} Array of records.
 * @throws {AppError} If file not found or invalid format.
 */
export async function list_records(project, filename) {
    return await read_records_array(project, filename);
}

/**
 * Retrieves a single record by its ID.
 *
 * @param {string} project - Project name.
 * @param {string} filename - File name.
 * @param {string} record_id - Record ID.
 * @returns {Promise<object>} The found record.
 * @throws {AppError} If record not found (404) or file not found.
 */
export async function get_record(project, filename, record_id) {
    const records = await read_records_array(project, filename);
    const record = records.find(r => r.id === record_id);
    if (!record) {
        throw new AppError('Record not found', 404);
    }
    return record;
}

/**
 * Adds a new record (with generated ID) to the array.
 * If the file does not exist, creates it with the record.
 * If the file exists and is an object, converts it to an array (preserving the object as first record).
 *
 * @param {string} project - Project name.
 * @param {string} filename - File name.
 * @param {object} record_data - The data for the new record (will be merged with id).
 * @returns {Promise<{ id: string, record: object }>} The created record with its ID.
 * @throws {AppError} If record_data is not an object, or file content is invalid.
 */
export async function add_record(project, filename, record_data) {
    if (typeof record_data !== 'object' || Array.isArray(record_data)) {
        throw new AppError('Record data must be a JSON object', 400);
    }

    const project_dir = get_project_dir(project);
    await fs.mkdir(project_dir, { recursive: true });

    const file_path = get_safe_path(project, filename);
    let records = [];

    try {
        const content = await fs.readFile(file_path, 'utf8');
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed)) {
            records = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
            // Convert existing object to a record with a generated ID
            const existing_id = Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
            const existing_record = { id: existing_id, ...parsed };
            records = [existing_record];
        } else {
            throw new AppError('File content must be an object or array', 400);
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            // Only ENOENT means file doesn't exist; other errors are real problems
            if (error instanceof AppError) throw error;
            throw new AppError('Error reading existing file for record addition', 500);
        }
        // File doesn't exist → start with empty array
        records = [];
    }

    // Generate new ID
    const id = Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const new_record = { id, ...record_data };
    records.push(new_record);

    try {
        await fs.writeFile(file_path, JSON.stringify(records, null, 2), 'utf8');
        return { id, record: new_record };
    } catch (error) {
        throw new AppError('Error writing record to file', 500);
    }
}

/**
 * Updates a record by ID (shallow merge with existing).
 *
 * @param {string} project - Project name.
 * @param {string} filename - File name.
 * @param {string} record_id - Record ID.
 * @param {object} update_data - Data to merge (shallow).
 * @returns {Promise<object>} The updated record.
 * @throws {AppError} If record not found (404) or invalid data.
 */
export async function update_record(project, filename, record_id, update_data) {
    if (typeof update_data !== 'object' || Array.isArray(update_data)) {
        throw new AppError('Update data must be a JSON object', 400);
    }

    const records = await read_records_array(project, filename);
    const index = records.findIndex(r => r.id === record_id);
    if (index === -1) {
        throw new AppError('Record not found', 404);
    }

    // Shallow merge
    const updated_record = { ...records[index], ...update_data };
    records[index] = updated_record;

    await write_records_array(project, filename, records);
    return updated_record;
}

/**
 * Deletes a record by ID.
 *
 * @param {string} project - Project name.
 * @param {string} filename - File name.
 * @param {string} record_id - Record ID.
 * @returns {Promise<{ deleted: boolean }>}
 * @throws {AppError} If record not found (404) or file not found.
 */
export async function delete_record(project, filename, record_id) {
    const records = await read_records_array(project, filename);
    const initial_length = records.length;
    const filtered = records.filter(r => r.id !== record_id);
    if (filtered.length === initial_length) {
        throw new AppError('Record not found', 404);
    }
    await write_records_array(project, filename, filtered);
    return { deleted: true };
}