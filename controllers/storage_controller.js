import * as storageService from '../services/storage_service.js';
import AppError from '../utils/error_handler.js';

/**
 * Validates that a project name is present and non-empty.
 *
 * @param {string} project - Project name to validate.
 * @returns {string} Trimmed project name.
 * @throws {AppError} If project is missing or invalid.
 */
function validate_project(project) {
    if (!project || typeof project !== 'string' || project.trim() === '') {
        throw new AppError('Missing or invalid project name', 400);
    }
    return project.trim();
}

/**
 * Controller for GET /storage/:project
 * Lists all .json files in the project.
 */
export async function list_files(req, res, next) {
    try {
        const project = validate_project(req.params.project);
        const files = await storageService.list_project_files(project);
        res.json({ project, files });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for GET /storage/:project/:filename
 * Retrieves and returns the content of a specific JSON file.
 */
export async function get_file(req, res, next) {
    try {
        const { filename } = req.params;
        if (!filename || filename.trim() === '') {
            throw new AppError('Filename is required', 400);
        }
        const project = validate_project(req.params.project);
        const data = await storageService.read_json_file(project, filename);
        res.json(data);
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for POST /storage/:project/:filename
 * Creates a new file or replaces an existing one.
 */
export async function create_or_replace_file(req, res, next) {
    try {
        const { filename } = req.params;
        if (!filename || filename.trim() === '') {
            throw new AppError('Filename is required', 400);
        }
        const project = validate_project(req.params.project);
        const data = req.body;

        if (typeof data !== 'object' || Array.isArray(data)) {
            throw new AppError('Request body must be a JSON object (not an array)', 400);
        }

        const saved_data = await storageService.write_json_file(project, filename, data, false);
        res.status(201).json({ message: 'File created/replaced', data: saved_data });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for PUT /storage/:project/:filename
 * Merges the provided data with the existing file (upsert).
 */
export async function update_file(req, res, next) {
    try {
        const { filename } = req.params;
        if (!filename || filename.trim() === '') {
            throw new AppError('Filename is required', 400);
        }
        const project = validate_project(req.params.project);
        const data = req.body;

        if (typeof data !== 'object' || Array.isArray(data)) {
            throw new AppError('Request body must be a JSON object (not an array)', 400);
        }

        const saved_data = await storageService.write_json_file(project, filename, data, true);
        res.json({ message: 'File updated (merged)', data: saved_data });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for PATCH /storage/:project/:filename
 * Merges the provided data with the existing file (same as PUT).
 */
export async function patch_file(req, res, next) {
    try {
        const { filename } = req.params;
        if (!filename || filename.trim() === '') {
            throw new AppError('Filename is required', 400);
        }
        const project = validate_project(req.params.project);
        const data = req.body;

        if (typeof data !== 'object' || Array.isArray(data)) {
            throw new AppError('Request body must be a JSON object (not an array)', 400);
        }

        const saved_data = await storageService.write_json_file(project, filename, data, true);
        res.json({ message: 'File patched (merged)', data: saved_data });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for DELETE /storage/:project
 * Deletes the entire project folder.
 */
export async function delete_project(req, res, next) {
    try {
        const project = validate_project(req.params.project);
        await storageService.delete_project_folder(project);
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for POST /storage/project/:project_name
 * Creates a new project folder.
 */
export async function create_project(req, res, next) {
    try {
        const { project_name } = req.params;
        const project = validate_project(project_name);
        const result = await storageService.create_project_folder(project);
        if (result.created) {
            res.status(201).json({ message: 'Project created', project });
        } else {
            res.status(200).json({ message: 'Project already exists', project });
        }
    } catch (error) {
        next(error);
    }
}