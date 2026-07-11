import { master_token } from '../config/config.js';
import AppError from '../utils/error_handler.js';

/**
 * Middleware to authenticate using the master token.
 * Only allows requests with a valid master token.
 */
export function master_auth_middleware(req, res, next) {
    const auth_header = req.headers.authorization;
    if (!auth_header || !auth_header.startsWith('Bearer ')) {
        return next(new AppError('Missing or invalid Authorization header (Bearer token required)', 401));
    }

    const token = auth_header.split(' ')[1];
    if (token !== master_token) {
        return next(new AppError('Invalid master token', 401));
    }

    next();
}