import { save_token, delete_token, load_token_map } from '../config/config.js';
import AppError from '../utils/error_handler.js';
import { write_log } from '../utils/logger.js';
import crypto from 'crypto';

const tokens = {};

/**
 * Genera un token aleatorio.
 * @returns {string} Token de 32 caracteres hexadecimales.
 */
function generate_token() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * POST /admin/tokens
 * Genera un nuevo token para un proyecto.
 * Requiere token maestro en Authorization header.
 */
export async function create_token(req, res, next) {
    try {
        const { project } = req.body;
        if (!project || typeof project !== 'string' || project.trim() === '') {
            throw new AppError('Project name is required', 400);
        }
        const project_trimmed = project.trim();

        // Validar que el proyecto no tenga caracteres peligrosos (solo alfanumérico y guiones bajos)
        if (!/^[a-zA-Z0-9_]+$/.test(project_trimmed)) {
            throw new AppError('Project name can only contain letters, numbers, and underscores', 400);
        }

        // Generar token único
        let token = generate_token();
        tokens[token] = project;
        let token_map = await load_token_map();
        while (token_map.has(token)) {
            token = generate_token();
        }

        await save_token(token, project_trimmed);
        write_log(`Token created for project: ${project}`, 'info');
        res.status(201).json({ message: 'Token created', token, project: project_trimmed });
    } catch (error) {
        write_log(`Error creating token: ${error.message}`, 'error');
        next(error);
    }
}

/**
 * GET /admin/tokens
 * Lista todos los tokens (solo los dinámicos, no los del .env).
 */
export async function list_tokens(req, res, next) {
    try {
        const token_map = await load_token_map();
        // Convertir mapa a objeto para respuesta
        const tokens = {};
        for (const [token, project] of token_map) {
            tokens[token] = project;
        }
        res.json({ tokens });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /admin/tokens/:token
 * Revoca un token (elimina del archivo).
 */
export async function revoke_token(req, res, next) {
    try {
        const { token } = req.params;
        if (!token) {
            throw new AppError('Token is required', 400);
        }
        const deleted = await delete_token(token);
        if (!deleted) {
            throw new AppError('Token not found', 404);
        }
        res.json({ message: 'Token revoked successfully' });
    } catch (error) {
        next(error);
    }
}

/**
 * Obtiene el proyecto asociado a un token.
 * @param {string} token - El token a verificar.
 * @returns {string|null} El nombre del proyecto o null si no existe.
 */
export function get_project_for_token(token) {
    return tokens[token] || null;
}



export function get_tokens() {
    return tokens;
}