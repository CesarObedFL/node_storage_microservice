import { master_token } from '../config/config.js';
import AppError from '../utils/error_handler.js';

/**
 * Admin authentication middleware.
 * Validates that the request contains the admin token.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware.
 * @throws {AppError} 401 if token is missing or invalid.
 */
export function admin_auth_middleware(req, res, next) {
    if (!master_token) {
        throw new Error('MASTER TOKEN not defined in .env');
    }

    const auth_header = req.headers.authorization;
    if (!auth_header || !auth_header.startsWith('Bearer ')) {
        return next(new AppError('Missing or invalid Authorization header (Bearer token required)', 401));
    }

    const token = auth_header.split(' ')[1];
    if (token !== master_token) {
        return next(new AppError('Invalid admin token', 401));
    }

    next();
}