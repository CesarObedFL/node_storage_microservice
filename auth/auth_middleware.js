import { load_token_map } from '../config/config.js';
import AppError from '../utils/error_handler.js';

export async function auth_middleware(req, res, next) {
    const auth_header = req.headers.authorization;
    if (!auth_header || !auth_header.startsWith('Bearer ')) {
        return next(new AppError('Missing or invalid Authorization header', 401));
    }

    const token = auth_header.split(' ')[1];
    const token_map = await load_token_map();
    const project_from_token = token_map.get(token);
    if (!project_from_token) {
        return next(new AppError('Invalid or expired token', 401));
    }

    // Solo verificar el proyecto si existe en la URL
    if (req.params && req.params.project) {
        const requested_project = req.params.project;
        if (project_from_token !== requested_project) {
            return next(new AppError('Token does not grant access to this project', 403));
        }
    }

    req.project = project_from_token;
    next();
}