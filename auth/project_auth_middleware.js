import AppError from '../utils/error_handler.js';
import { get_project_for_token } from '../controllers/token_controller.js';

/**
 * Middleware para autenticar tokens de proyecto.
 * Verifica que el token enviado corresponda al proyecto de la URL.
 */
export function project_auth_middleware(req, res, next) {
    const auth_header = req.headers.authorization;
    if (!auth_header || !auth_header.startsWith('Bearer ')) {
        return next(new AppError('Missing or invalid Authorization header', 401));
    }

    const token = auth_header.split(' ')[1];
    const project = req.params.project;

    if (!project) {
        return next(new AppError('Project name is required in URL', 400));
    }

    // Obtener el proyecto asociado al token
    const token_project = get_project_for_token(token);
    if (!token_project) {
        return next(new AppError('Invalid or expired token', 401));
    }

    if (token_project !== project) {
        return next(new AppError('Token does not grant access to this project', 403));
    }

    next();
}