import { get_project_from_token } from '../config/config.js';
import AppError from '../utils/error_handler.js';

/**
 * Authentication middleware.
 * Reads Bearer token from Authorization header, validates it,
 * and attaches the associated project name to `req.project`.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @throws {AppError} 401 if token is missing, invalid, or format is wrong.
 */
export function auth_middleware(req, res, next) {
    const auth_header = req.headers.authorization;
    if (!auth_header || !auth_header.startsWith('Bearer ')) {
        return next(new AppError('Missing or invalid Authorization header (Bearer token required)', 401));
    }

    const token = auth_header.split(' ')[1];
    if (!token) {
        return next(new AppError('Token not provided', 401));
    }

    const project = get_project_from_token(token);
    if (!project) {
        return next(new AppError('Invalid or expired token', 401));
    }

    // Attach project name to request for downstream use
    req.project = project;
    next();
}