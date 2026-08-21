import { master_token } from '../config/config.js';
import { write_log } from '../utils/logger.js';
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
    
    const auth_header = req.headers.authorization;
    if (!auth_header || !auth_header.startsWith('Bearer ')) {
        write_log(`Auth failed: Missing or invalid header from ${req.ip}`, 'warn');
        return next(new AppError('Missing token', 401));
    }
    
    const token = auth_header.split(' ')[1];
    if (token !== master_token) {
        write_log(`Auth failed: Invalid token from ${req.ip}`, 'warn');
        return next(new AppError('Invalid token', 401));
    }
    
    write_log(`Auth success: Admin access from ${req.ip}`, 'info');
    next();
}