// ================================================================
// auth/project_auth.js
// Project token authentication middleware
// ================================================================
// Validates Bearer tokens for project routes.
// Attaches the project name to `req.project` if valid.
//
// @see ../config/config.js (load_token_map)
// ================================================================

import { load_token_map } from '../config/config.js';
import AppError from '../utils/error_handler.js';

/**
 * Middleware to authenticate requests using a project token.
 * Does NOT perform authorization (project matching) – that is done
 * in the controllers to allow proper parameter resolution.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @throws {AppError} 401 if token is missing, malformed, or invalid.
 */
export async function project_auth_middleware(req, res, next) {
    const auth_header = req.headers.authorization;
    if (!auth_header || !auth_header.startsWith('Bearer ')) {
        return next(new AppError('Missing or invalid Authorization header (Bearer token required)', 401));
    }

    const token = auth_header.split(' ')[1];
    if (!token) {
        return next(new AppError('Token not provided', 401));
    }

    const token_map = await load_token_map();
    const project_from_token = token_map.get(token);
    if (!project_from_token) {
        return next(new AppError('Invalid or expired token', 401));
    }

    req.project = project_from_token;
    next();
}