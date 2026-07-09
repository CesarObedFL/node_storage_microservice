import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import AppError from '../utils/errorHandler.js';

const router = express.Router();
const storagePath = process.env.STORAGE_PATH || './storage';
const DEFAULT_PROJECT = 'demo';  // proyecto fijo para pruebas

function getSafePath(project, filename) {
    const base = path.resolve(storagePath);
    const fullPath = path.resolve(base, project, filename);
    if (!fullPath.startsWith(base)) {
        throw new AppError('Acceso denegado: ruta no permitida', 403);
    }
    return fullPath;
}

// GET /storage  -> listar archivos
router.get('/', async (req, res, next) => {
    try {
        const project = DEFAULT_PROJECT;
        const projectDir = path.resolve(storagePath, project);
        let files = [];
        try {
            const allFiles = await fs.readdir(projectDir);
            files = allFiles.filter(f => f.endsWith('.json'));
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw new AppError('Error al listar archivos', 500);
            }
            // si no existe la carpeta, devolvemos lista vacía
        }
        res.json({ project, files });
    } catch (error) {
        next(error);
    }
});

// GET /storage/:filename  -> leer un archivo específico
router.get('/:filename', async (req, res, next) => {
    try {
        const { filename } = req.params;
        const project = DEFAULT_PROJECT;
        const filePath = getSafePath(project, filename);
        let data;
        try {
            const content = await fs.readFile(filePath, 'utf8');
            data = JSON.parse(content);
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new AppError('Archivo no encontrado', 404);
            }
            throw new AppError('Error al leer el archivo', 500);
        }
        res.json(data);
    } catch (error) {
        next(error);
    }
});

export default router;