import express from 'express';
import AppError from '../utils/error_handler.js';

import {
    create_project,
    delete_project,
    list_all_projects,
    list_files,
    get_file,
    create_or_replace_file,
    update_file,
    patch_file,
    list_records,
    get_record,
    add_record,
    update_record,
    delete_record
} from '../controllers/storage_controller.js';

const router = express.Router();

// ==================== VALIDATIONS  ====================
/**
 * Validates that the project name is not empty or just spaces.
 * @param {string} project - Project name from URL.
 * @throws {AppError} 400 if invalid.
 */
router.param('project', (req, res, next, project) => {
    if (!project || project.trim() === '') {
        return next(new AppError('Missing or invalid project name', 400));
    }
    req.params.project = project.trim();
    next();
});

/**
 * Validates that the filename is not empty or just spaces.
 * @param {string} filename - Filename from URL.
 * @throws {AppError} 400 if invalid.
 */
router.param('filename', (req, res, next, filename) => {
    if (!filename || filename.trim() === '') {
        return next(new AppError('Filename is required', 400));
    }
    req.params.filename = filename.trim();
    next();
});

// ==================== ADMIN ROUTES ====================
router.get('/admin/projects', list_all_projects);

// ==================== PROJECT MANAGEMENT ====================
router.post('/storage/project/:project_name', create_project);
router.delete('/storage/:project', delete_project);

// ==================== FILE CRUD ====================
router.get('/storage/:project/list', list_files);
router.get('/storage/:project/:filename', get_file);
router.post('/storage/:project/:filename', create_or_replace_file);
router.put('/storage/:project/:filename', update_file);
router.patch('/storage/:project/:filename', patch_file);

// ==================== RECORDS (ARRAY) CRUD ====================
router.get('/storage/:project/:filename/records', list_records);
router.get('/storage/:project/:filename/records/:record_id', get_record);
router.post('/storage/:project/:filename/records', add_record);
router.put('/storage/:project/:filename/records/:record_id', update_record);
router.delete('/storage/:project/:filename/records/:record_id', delete_record);

// ==================== TEST ROUTE ====================
router.get('/test', (req, res) => {
    res.json({ message: 'Router working' });
});

export default router;