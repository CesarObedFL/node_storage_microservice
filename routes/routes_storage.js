import express from 'express';
import AppError from '../utils/error_handler.js';
import auth_middleware from '../auth/auth_middleware.js';

import {
    create_project,
    delete_project,
    list_all_projects,
    list_files,
    get_file,
    create_or_replace_file,
    update_file,
    patch_file,
    list_records,
    get_record,
    add_record,
    update_record,
    delete_record
} from '../controllers/storage_controller.js';

const router = express.Router();

// ==================== VALIDATIONS  ====================
/**
 * Validates that the project name is not empty or just spaces.
 * @param {string} project - Project name from URL.
 * @throws {AppError} 400 if invalid.
 */
router.param('project', (req, res, next, project) => {
    if (!project || project.trim() === '') {
        return next(new AppError('Missing or invalid project name', 400));
    }
    req.params.project = project.trim();
    next();
});

/**
 * Validates that the filename is not empty or just spaces.
 * @param {string} filename - Filename from URL.
 * @throws {AppError} 400 if invalid.
 */
router.param('filename', (req, res, next, filename) => {
    if (!filename || filename.trim() === '') {
        return next(new AppError('Filename is required', 400));
    }
    req.params.filename = filename.trim();
    next();
});

// ==================== ADMIN ROUTES ====================
router.get('/admin/projects', list_all_projects);

// ==================== PROTECTED ROUTES (authentication required) ====================
/**
 * Apply authentication middleware to all routes below this point.
 */
router.use(auth_middleware);

// ==================== PROJECT MANAGEMENT ====================
/**
 * POST /storage/project/:project_name
 * Creates a new project. Requires authentication.
 */
router.post('/storage/project/:project_name', create_project);

/**
 * DELETE /storage/:project
 * Deletes a project. Requires authentication.
 */
router.delete('/storage/:project', delete_project);

// ==================== FILE CRUD ====================
/**
 * GET /storage/:project/list
 * Lists all .json files in the project. Requires authentication.
 */
router.get('/storage/:project/list', list_files);

/**
 * GET /storage/:project/:filename
 * Retrieves a file's content. Requires authentication.
 */
router.get('/storage/:project/:filename', get_file);

/**
 * POST /storage/:project/:filename
 * Creates or replaces a file. Requires authentication.
 */
router.post('/storage/:project/:filename', create_or_replace_file);

/**
 * PUT /storage/:project/:filename
 * Merges data into a file. Requires authentication.
 */
router.put('/storage/:project/:filename', update_file);

/**
 * PATCH /storage/:project/:filename
 * Partially updates a file. Requires authentication.
 */
router.patch('/storage/:project/:filename', patch_file);

// ==================== RECORDS (ARRAY) CRUD ====================
/**
 * GET /storage/:project/:filename/records
 * Lists all records. Requires authentication.
 */
router.get('/storage/:project/:filename/records', list_records);

/**
 * GET /storage/:project/:filename/records/:record_id
 * Retrieves a specific record. Requires authentication.
 */
router.get('/storage/:project/:filename/records/:record_id', get_record);

/**
 * POST /storage/:project/:filename/records
 * Adds a record. Requires authentication.
 */
router.post('/storage/:project/:filename/records', add_record);

/**
 * PUT /storage/:project/:filename/records/:record_id
 * Updates a record. Requires authentication.
 */
router.put('/storage/:project/:filename/records/:record_id', update_record);

/**
 * DELETE /storage/:project/:filename/records/:record_id
 * Deletes a record. Requires authentication.
 */
router.delete('/storage/:project/:filename/records/:record_id', delete_record);

// ==================== TEST ROUTE (public) ====================
/**
 * GET /test
 * Simple health check for the router. Public.
 */
router.get('/test', (req, res) => {
    res.json({ message: 'Router working' });
});

export default router;