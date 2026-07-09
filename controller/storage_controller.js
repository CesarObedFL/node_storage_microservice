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
 * Controller for GET /storage
 * Lists all .json files in the project.
 *
 * @param {object} req - Express request object (expects req.project).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 */
export async function list_files(req, res, next) {
    try {
        const project = validate_project(req.project);
        const files = await storageService.list_project_files(project);
        res.json({ project, files });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for GET /storage/:filename
 * Retrieves and returns the content of a specific JSON file.
 *
 * @param {object} req - Express request object (params.filename, req.project).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 */
export async function get_file(req, res, next) {
    try {
        const { filename } = req.params;
        if (!filename || filename.trim() === '') {
            throw new AppError('Filename is required', 400);
        }
        const project = validate_project(req.project);
        const data = await storageService.read_json_file(project, filename);
        res.json(data);
    } catch (error) {
        next(error);
    }
}