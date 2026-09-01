// ================================================================
// Unified router for the Storage Microservice
// ================================================================
// This file defines all public, admin, and project routes.
// - Public routes: /health, /test
// - Admin routes: /storage/admin/*  (protected by master token)
// - Project routes: /storage/*       (protected by project token)
//
// @see https://expressjs.com/en/guide/routing.html
// ================================================================

import express from 'express';
import AppError from '../utils/error_handler.js';
import { project_auth_middleware } from '../auth/project_auth.js';
import { master_auth_middleware } from '../auth/master_auth.js';

// ---------- Controllers ----------
// Projects
import {
    create_project,
    delete_project,
    list_all_projects,
} from '../controllers/project_controller.js';

// Files
import {
    list_files,
    get_file,
    create_or_replace_file,
    update_file,
    patch_file,
} from '../controllers/file_controller.js';

// Records
import {
    list_records,
    get_record,
    add_record,
    update_record,
    delete_record,
} from '../controllers/record_controller.js';

// Tokens (admin)
import {
    create_token,
    list_tokens,
    revoke_token,
} from '../controllers/token_controller.js';

const router = express.Router();

// ================================================================
// Parameter validators
// ================================================================

/**
 * Validates that a project name is non‑empty and without extra spaces.
 *
 * @param {string} project - Project name from the URL.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @throws {AppError} 400 if project name is missing or invalid.
 */
router.param('project', (req, res, next, project) => {
    if (!project || project.trim() === '') {
        return next(new AppError('Missing or invalid project name', 400));
    }
    req.params.project = project.trim();
    next();
});

/**
 * Validates that a filename is non‑empty and without extra spaces.
 *
 * @param {string} filename - Filename from the URL.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @throws {AppError} 400 if filename is missing or invalid.
 */
router.param('filename', (req, res, next, filename) => {
    if (!filename || filename.trim() === '') {
        return next(new AppError('Filename is required', 400));
    }
    req.params.filename = filename.trim();
    next();
});

// ================================================================
// Public routes (no authentication)
// ================================================================

/**
 * GET /health
 * Simple health check endpoint.
 *
 * @route {GET} /storage/health
 * @response {object} 200 - { status: "ok", microservice: 'microservice name', timestamp: string }
 */
router.get('/storage/health', (req, res) => {
    res.json({ status: 'ok', microservice: 'storage microservice', timestamp: new Date().toISOString() });
});

/**
 * GET /test
 * Test route to verify that the router is mounted correctly.
 *
 * @route {GET} /storage/test
 * @response {object} 200 - { message: "Router working" }
 */
router.get('/storage/test', (req, res) => {
    res.json({ message: 'Router working' });
});

// ================================================================
// Admin routes (under /storage/admin)
// ================================================================

/**
 * GET /storage/admin/projects
 * Lists all project folders in the storage directory.
 * This endpoint is public (no authentication required).
 *
 * @route {GET} /storage/admin/projects
 * @response {object} 200 - { projects: string[] }
 * @response {object} 500 - { error: "Error listing projects" }
 */
router.get('/storage/admin/projects', list_all_projects);

// ---------- Token management (protected by master token) ----------

/**
 * Apply master authentication to all /storage/admin/tokens routes.
 */
router.use('/storage/admin/tokens', master_auth_middleware);

/**
 * POST /storage/admin/tokens
 * Creates a new token for a project.
 *
 * @route {POST} /storage/admin/tokens
 * @header {string} Authorization - Bearer master token.
 * @body {object} - { project: string }
 * @response {object} 201 - { message: "Token created", token: string, project: string }
 * @response {object} 400 - { error: "Project name is required" }
 * @response {object} 401 - { error: "Invalid master token" }
 */
router.post('/storage/admin/tokens', create_token);

/**
 * GET /storage/admin/tokens
 * Lists all dynamic tokens (projects with tokens).
 *
 * @route {GET} /storage/admin/tokens
 * @header {string} Authorization - Bearer master token.
 * @response {object} 200 - { tokens: object } (token → project map)
 * @response {object} 401 - { error: "Invalid master token" }
 */
router.get('/storage/admin/tokens', list_tokens);

/**
 * DELETE /storage/admin/tokens/:token
 * Revokes (deletes) a specific token.
 *
 * @route {DELETE} /storage/admin/tokens/:token
 * @header {string} Authorization - Bearer master token.
 * @param {string} token - Token to revoke.
 * @response {object} 200 - { message: "Token revoked successfully" }
 * @response {object} 404 - { error: "Token not found" }
 * @response {object} 401 - { error: "Invalid master token" }
 */
router.delete('/storage/admin/tokens/:token', revoke_token);

// ================================================================
// Project routes (under /storage)
// ================================================================

/**
 * Apply project authentication to all routes below this point.
 */
router.use('/storage', project_auth_middleware);

// ---------- Project management ----------

/**
 * POST /storage/project/:project_name
 * Creates a new project folder.
 *
 * @route {POST} /storage/project/:project_name
 * @param {string} project_name - Name of the project.
 * @header {string} Authorization - Bearer project token.
 * @response {object} 201 - { message: "Project created", project: string }
 * @response {object} 200 - { message: "Project already exists", project: string }
 * @response {object} 400 - { error: "Missing or invalid project name" }
 */
router.post('/storage/project/:project_name', create_project);

/**
 * DELETE /storage/:project
 * Deletes an entire project folder and its contents.
 *
 * @route {DELETE} /storage/:project
 * @param {string} project - Name of the project.
 * @header {string} Authorization - Bearer project token.
 * @response {object} 200 - { message: "Project deleted successfully" }
 * @response {object} 404 - { error: "Project not found" }
 * @response {object} 400 - { error: "Missing or invalid project name" }
 */
router.delete('/storage/:project', delete_project);

// ---------- File operations ----------

/**
 * GET /storage/:project/list
 * Lists all .json files in the project.
 *
 * @route {GET} /storage/:project/list
 * @param {string} project - Name of the project.
 * @header {string} Authorization - Bearer project token.
 * @response {object} 200 - { project: string, files: string[] }
 * @response {object} 400 - { error: "Missing or invalid project name" }
 */
router.get('/storage/:project/list', list_files);

/**
 * GET /storage/:project/:filename
 * Retrieves the content of a JSON file.
 *
 * @route {GET} /storage/:project/:filename
 * @param {string} project - Name of the project.
 * @param {string} filename - Name of the JSON file.
 * @header {string} Authorization - Bearer project token.
 * @response {object} 200 - Parsed JSON content.
 * @response {object} 404 - { error: "File not found" }
 * @response {object} 400 - { error: "Missing or invalid project name" }
 */
router.get('/storage/:project/:filename', get_file);

/**
 * POST /storage/:project/:filename
 * Creates a new file or replaces an existing one completely.
 *
 * @route {POST} /storage/:project/:filename
 * @param {string} project - Name of the project.
 * @param {string} filename - Name of the JSON file.
 * @body {object} - JSON object to store.
 * @header {string} Authorization - Bearer project token.
 * @response {object} 201 - { message: "File created/replaced", data: object }
 * @response {object} 400 - { error: "Request body must be a JSON object" }
 */
router.post('/storage/:project/:filename', create_or_replace_file);

/**
 * PUT /storage/:project/:filename
 * Merges the provided data with the existing file (shallow merge).
 *
 * @route {PUT} /storage/:project/:filename
 * @param {string} project - Name of the project.
 * @param {string} filename - Name of the JSON file.
 * @body {object} - JSON object to merge.
 * @header {string} Authorization - Bearer project token.
 * @response {object} 200 - { message: "File updated (merged)", data: object }
 */
router.put('/storage/:project/:filename', update_file);

/**
 * PATCH /storage/:project/:filename
 * Same as PUT – merges the provided data with the existing file.
 *
 * @route {PATCH} /storage/:project/:filename
 * @param {string} project - Name of the project.
 * @param {string} filename - Name of the JSON file.
 * @body {object} - JSON object to merge.
 * @header {string} Authorization - Bearer project token.
 * @response {object} 200 - { message: "File patched (merged)", data: object }
 */
router.patch('/storage/:project/:filename', patch_file);

// ---------- Record operations (array‑based) ----------

/**
 * GET /storage/:project/:filename/records
 * Lists all records (array) from the JSON file.
 *
 * @route {GET} /storage/:project/:filename/records
 * @param {string} project - Name of the project.
 * @param {string} filename - Name of the JSON file.
 * @header {string} Authorization - Bearer project token.
 * @response {object} 200 - { records: object[] }
 * @response {object} 404 - { error: "File not found" }
 */
router.get('/storage/:project/:filename/records', list_records);

/**
 * GET /storage/:project/:filename/records/:record_id
 * Retrieves a single record by its ID.
 *
 * @route {GET} /storage/:project/:filename/records/:record_id
 * @param {string} project - Name of the project.
 * @param {string} filename - Name of the JSON file.
 * @param {string} record_id - ID of the record.
 * @header {string} Authorization - Bearer project token.
 * @response {object} 200 - { record: object }
 * @response {object} 404 - { error: "Record not found" }
 */
router.get('/storage/:project/:filename/records/:record_id', get_record);

/**
 * POST /storage/:project/:filename/records
 * Adds a new record (with auto‑generated ID) to the JSON array.
 *
 * @route {POST} /storage/:project/:filename/records
 * @param {string} project - Name of the project.
 * @param {string} filename - Name of the JSON file.
 * @body {object} - Record data (object).
 * @header {string} Authorization - Bearer project token.
 * @response {object} 201 - { message: "Record added", id: string, record: object }
 */
router.post('/storage/:project/:filename/records', add_record);

/**
 * PUT /storage/:project/:filename/records/:record_id
 * Updates a record by ID (shallow merge).
 *
 * @route {PUT} /storage/:project/:filename/records/:record_id
 * @param {string} project - Name of the project.
 * @param {string} filename - Name of the JSON file.
 * @param {string} record_id - ID of the record.
 * @body {object} - Data to update.
 * @header {string} Authorization - Bearer project token.
 * @response {object} 200 - { message: "Record updated", record: object }
 * @response {object} 404 - { error: "Record not found" }
 */
router.put('/storage/:project/:filename/records/:record_id', update_record);

/**
 * DELETE /storage/:project/:filename/records/:record_id
 * Deletes a record by ID.
 *
 * @route {DELETE} /storage/:project/:filename/records/:record_id
 * @param {string} project - Name of the project.
 * @param {string} filename - Name of the JSON file.
 * @param {string} record_id - ID of the record.
 * @header {string} Authorization - Bearer project token.
 * @response {object} 200 - { message: "Record deleted" }
 * @response {object} 404 - { error: "Record not found" }
 */
router.delete('/storage/:project/:filename/records/:record_id', delete_record);

export default router;