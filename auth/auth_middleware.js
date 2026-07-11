import { load_token_map } from '../config/config.js';
import AppError from '../utils/error_handler.js';

/**
 * Authentication middleware.
 * Reads Bearer token from Authorization header, validates it,
 * and attaches the associated project name to `req.project`.
 */
export async function auth_middleware(req, res, next) {
    const auth_header = req.headers.authorization;
    if (!auth_header || !auth_header.startsWith('Bearer ')) {
        return next(new AppError('Missing or invalid Authorization header (Bearer token required)', 401));
    }

    const token = auth_header.split(' ')[1];
    if (!token) {
        return next(new AppError('Token not provided', 401));
    }

    const token_map = await load_token_map();
    const project = token_map.get(token);
    if (!project) {
        return next(new AppError('Invalid or expired token', 401));
    }

    req.project = project;
    next();
}