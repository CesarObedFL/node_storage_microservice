// ================================================================
// controllers/file_controller.js
// File management endpoints
// ================================================================
// Functions:
//   - list_files              (GET /storage/:project/list)
//   - get_file                (GET /storage/:project/:filename)
//   - create_or_replace_file  (POST /storage/:project/:filename)
//   - update_file             (PUT /storage/:project/:filename)
//   - patch_file              (PATCH /storage/:project/:filename)
//
// @see ../services/storage_service.js
// ================================================================

import * as storageService from '../services/storage_service.js';
import { validate_project, validate_filename } from '../utils/validation.js';
import AppError from '../utils/error_handler.js';

/**
 * GET /storage/:project/list
 * Lists all .json files in the project.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {GET} /storage/:project/list
 * @response {object} 200 - { project: string, files: string[] }
 * @response {object} 400 - { error: "Missing or invalid project name" }
 * @response {object} 500 - { error: "Error listing files" }
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
 * GET /storage/:project/:filename
 * Retrieves the content of a JSON file.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {GET} /storage/:project/:filename
 * @response {object} 200 - Parsed JSON content.
 * @response {object} 404 - { error: "File not found" }
 * @response {object} 400 - { error: "Missing or invalid project name" }
 * @response {object} 400 - { error: "Filename is required" }
 */
export async function get_file(req, res, next) {
    try {
        const filename = validate_filename(req.params.filename);
        const project = validate_project(req.params.project);
        const data = await storageService.read_json_file(project, filename);
        res.json(data);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /storage/:project/:filename
 * Creates a new file or replaces an existing one completely.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {POST} /storage/:project/:filename
 * @response {object} 201 - { message: "File created/replaced", data: object }
 * @response {object} 400 - { error: "Request body must be a JSON object" }
 * @response {object} 400 - { error: "Missing or invalid project name" }
 * @response {object} 400 - { error: "Filename is required" }
 */
export async function create_or_replace_file(req, res, next) {
    try {
        const filename = validate_filename(req.params.filename);
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
 * PUT /storage/:project/:filename
 * Merges the provided data with the existing file (shallow merge).
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {PUT} /storage/:project/:filename
 * @response {object} 200 - { message: "File updated (merged)", data: object }
 * @response {object} 400 - { error: "Request body must be a JSON object" }
 * @response {object} 400 - { error: "Missing or invalid project name" }
 * @response {object} 400 - { error: "Filename is required" }
 */
export async function update_file(req, res, next) {
    try {
        const filename = validate_filename(req.params.filename);
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
 * PATCH /storage/:project/:filename
 * Same as PUT – merges the provided data with the existing file.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {PATCH} /storage/:project/:filename
 * @response {object} 200 - { message: "File patched (merged)", data: object }
 * @response {object} 400 - { error: "Request body must be a JSON object" }
 * @response {object} 400 - { error: "Missing or invalid project name" }
 * @response {object} 400 - { error: "Filename is required" }
 */
export async function patch_file(req, res, next) {
    try {
        const filename = validate_filename(req.params.filename);
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