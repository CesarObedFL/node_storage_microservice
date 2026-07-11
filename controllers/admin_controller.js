import * as config from '../config/config.js';
import AppError from '../utils/error_handler.js';

/**
 * Controller for POST /admin/tokens/:project_name
 * Creates or retrieves a token for a project.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 */
export async function create_project_token(req, res, next) {
    try {
        const { project_name } = req.params;
        if (!project_name || project_name.trim() === '') {
            throw new AppError('Project name is required', 400);
        }

        const token = await config.set_token_for_project(project_name.trim());
        res.status(201).json({
            message: 'Token created or retrieved',
            project: project_name.trim(),
            token
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for GET /admin/tokens
 * Lists all tokens.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 */
export async function list_all_project_tokens(req, res, next) {
    try {
        const tokens = await config.list_all_tokens();
        res.json({ tokens });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for DELETE /admin/tokens/:project_name
 * Revokes (deletes) a project's token.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 */
export async function revoke_project_token(req, res, next) {
    try {
        const { project_name } = req.params;
        if (!project_name || project_name.trim() === '') {
            throw new AppError('Project name is required', 400);
        }

        const deleted = await config.revoke_token_for_project(project_name.trim());
        if (!deleted) {
            throw new AppError('Project not found or no token associated', 404);
        }

        res.json({
            message: 'Token revoked successfully',
            project: project_name.trim()
        });
    } catch (error) {
        next(error);
    }
}