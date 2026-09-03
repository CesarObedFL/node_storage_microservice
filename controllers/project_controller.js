// ================================================================
// controllers/project_controller.js
// Project management endpoints
// ================================================================
// Functions:
//   - create_project   (POST /storage/project/:project_name)
//   - delete_project   (DELETE /storage/:project)
//   - list_all_projects (GET /storage/admin/projects)
//
// @see ../services/storage_service.js
// ================================================================

import * as storageService from '../services/storage_service.js';
import { validate_project } from '../utils/validation.js';

/**
 * POST /storage/project/:project_name
 * Creates a new project folder.
 *
 * @param {object} req - Express request object.
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
        const project = validate_project(req.params.project_name);
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
 * DELETE /storage/:project
 * Deletes an entire project folder and its contents.
 *
 * @param {object} req - Express request object.
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

/**
 * GET /storage/admin/projects
 * Lists all projects (folders) in the storage directory.
 * This endpoint is public (no authentication required).
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @route {GET} /storage/admin/projects
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