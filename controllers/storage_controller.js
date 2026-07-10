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

// ============================
// PROJECT MANAGEMENT (CREATE & DELETE)
// ============================

/**
 * Controller for POST /storage/project/:project_name
 * Creates a new project folder.
 *
 * @param {object} req - Express request object (params.project_name).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {POST} /storage/project/:project_name
 * @response {object} 201 - { message: "Project created", project: string }
 * @response {object} 200 - { message: "Project already exists", project: string }
 * @response {object} 400 - { error: "Missing or invalid project name" }
 * @response {object} 500 - { error: "Error creating project folder" }
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

/**
 * Controller for DELETE /storage/:project
 * Deletes the entire project folder.
 *
 * @param {object} req - Express request object (params.project).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {DELETE} /storage/:project
 * @response {object} 200 - { message: "Project deleted successfully" }
 * @response {object} 404 - { error: "Project not found" }
 * @response {object} 400 - { error: "Missing or invalid project name" }
 * @response {object} 500 - { error: "Error deleting project" }
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

// ============================
// ADMIN: LIST ALL PROJECTS (READ)
// ============================

/**
 * Controller for GET /admin/projects
 * Lists all projects (folders) in the storage directory.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {GET} /admin/projects
 * @response {object} 200 - { projects: string[] }
 * @response {object} 500 - { error: "Error listing projects" }
 */
export async function list_all_projects(req, res, next) {
    try {
        const projects = await storageService.list_projects();
        res.json({ projects });
    } catch (error) {
        next(error);
    }
}

// ============================
// FILE READ OPERATIONS
// ============================

/**
 * Controller for GET /storage/:project
 * Lists all .json files in the project.
 *
 * @param {object} req - Express request object (params.project).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {GET} /storage/:project
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
 * Controller for GET /storage/:project/:filename
 * Retrieves the content of a specific JSON file.
 *
 * @param {object} req - Express request object (params.project, params.filename).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {GET} /storage/:project/:filename
 * @response {object} 200 - Parsed JSON content
 * @response {object} 400 - { error: "Missing or invalid project name" } / { error: "Filename is required" }
 * @response {object} 404 - { error: "File not found" }
 * @response {object} 500 - { error: "Error reading file" }
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

// ============================
// FILE WRITE OPERATIONS (CREATE, UPDATE, PATCH)
// ============================

/**
 * Controller for POST /storage/:project/:filename
 * Creates a new file or replaces an existing one completely.
 *
 * @param {object} req - Express request object (params.project, params.filename, body).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {POST} /storage/:project/:filename
 * @response {object} 201 - { message: "File created/replaced", data: object }
 * @response {object} 400 - { error: "Missing or invalid project name" } / { error: "Request body must be a JSON object" }
 * @response {object} 500 - { error: "Error writing file" }
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
 *
 * @param {object} req - Express request object (params.project, params.filename, body).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {PUT} /storage/:project/:filename
 * @response {object} 200 - { message: "File updated (merged)", data: object }
 * @response {object} 400 - { error: "Missing or invalid project name" } / { error: "Request body must be a JSON object" }
 * @response {object} 500 - { error: "Error writing file" }
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
 *
 * @param {object} req - Express request object (params.project, params.filename, body).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {PATCH} /storage/:project/:filename
 * @response {object} 200 - { message: "File patched (merged)", data: object }
 * @response {object} 400 - { error: "Missing or invalid project name" } / { error: "Request body must be a JSON object" }
 * @response {object} 500 - { error: "Error writing file" }
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

// ============================
// RECORD OPERATIONS (FULL CRUD)
// ============================

/**
 * Controller for GET /storage/:project/:filename/records
 * Lists all records from the JSON file (must be an array).
 *
 * @param {object} req - Express request object (params.project, params.filename).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {GET} /storage/:project/:filename/records
 * @response {object} 200 - { records: object[] }
 * @response {object} 400 - { error: "Missing or invalid project name" }
 * @response {object} 404 - { error: "File not found" }
 * @response {object} 500 - { error: "Error reading records" }
 */
export async function list_records(req, res, next) {
    try {
        const { filename } = req.params;
        if (!filename || filename.trim() === '') {
            throw new AppError('Filename is required', 400);
        }
        const project = validate_project(req.params.project);
        const records = await storageService.list_records(project, filename);
        res.json({ records });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for GET /storage/:project/:filename/records/:record_id
 * Retrieves a single record by its ID.
 *
 * @param {object} req - Express request object (params.project, params.filename, params.record_id).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {GET} /storage/:project/:filename/records/:record_id
 * @response {object} 200 - { record: object }
 * @response {object} 400 - { error: "Missing or invalid project name" } / { error: "Record ID is required" }
 * @response {object} 404 - { error: "Record not found" } / { error: "File not found" }
 * @response {object} 500 - { error: "Error reading record" }
 */
export async function get_record(req, res, next) {
    try {
        const { filename, record_id } = req.params;
        if (!filename || filename.trim() === '' || !record_id) {
            throw new AppError('Filename and record ID are required', 400);
        }
        const project = validate_project(req.params.project);
        const record = await storageService.get_record(project, filename, record_id);
        res.json({ record });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for POST /storage/:project/:filename/records
 * Adds a new record (with generated ID) to the JSON array file.
 *
 * @param {object} req - Express request object (params.project, params.filename, body).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {POST} /storage/:project/:filename/records
 * @response {object} 201 - { message: "Record added", id: string, record: object }
 * @response {object} 400 - { error: "Missing or invalid project name" } / { error: "Record data must be a JSON object" }
 * @response {object} 500 - { error: "Error writing record" }
 */
export async function add_record(req, res, next) {
    try {
        const { filename } = req.params;
        if (!filename || filename.trim() === '') {
            throw new AppError('Filename is required', 400);
        }
        const project = validate_project(req.params.project);
        const record_data = req.body;

        if (typeof record_data !== 'object' || Array.isArray(record_data)) {
            throw new AppError('Record data must be a JSON object', 400);
        }

        const result = await storageService.add_record(project, filename, record_data);
        res.status(201).json({ message: 'Record added', id: result.id, record: result.record });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for PUT /storage/:project/:filename/records/:record_id
 * Updates a record by ID (shallow merge).
 *
 * @param {object} req - Express request object (params.project, params.filename, params.record_id, body).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {PUT} /storage/:project/:filename/records/:record_id
 * @response {object} 200 - { message: "Record updated", record: object }
 * @response {object} 400 - { error: "Missing or invalid project name" } / { error: "Update data must be a JSON object" }
 * @response {object} 404 - { error: "Record not found" } / { error: "File not found" }
 * @response {object} 500 - { error: "Error updating record" }
 */
export async function update_record(req, res, next) {
    try {
        const { filename, record_id } = req.params;
        if (!filename || filename.trim() === '' || !record_id) {
            throw new AppError('Filename and record ID are required', 400);
        }
        const project = validate_project(req.params.project);
        const update_data = req.body;

        if (typeof update_data !== 'object' || Array.isArray(update_data)) {
            throw new AppError('Update data must be a JSON object', 400);
        }

        const updated_record = await storageService.update_record(project, filename, record_id, update_data);
        res.json({ message: 'Record updated', record: updated_record });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for DELETE /storage/:project/:filename/records/:record_id
 * Deletes a specific record by ID.
 *
 * @param {object} req - Express request object (params.project, params.filename, params.record_id).
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {DELETE} /storage/:project/:filename/records/:record_id
 * @response {object} 200 - { message: "Record deleted" }
 * @response {object} 400 - { error: "Missing or invalid project name" } / { error: "Filename and record ID are required" }
 * @response {object} 404 - { error: "Record not found" } / { error: "File not found" }
 * @response {object} 500 - { error: "Error deleting record" }
 */
export async function delete_record(req, res, next) {
    try {
        const { filename, record_id } = req.params;
        if (!filename || filename.trim() === '' || !record_id) {
            throw new AppError('Filename and record ID are required', 400);
        }
        const project = validate_project(req.params.project);
        await storageService.delete_record(project, filename, record_id);
        res.json({ message: 'Record deleted' });
    } catch (error) {
        next(error);
    }
}