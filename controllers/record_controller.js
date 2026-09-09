// ================================================================
// controllers/record_controller.js
// Record (array) endpoints
// ================================================================

import * as storageService from '../services/storage_service.js';
import { validate_project, validate_filename } from '../utils/validation.js';
import AppError from '../utils/error_handler.js';

export async function list_records(req, res, next) {
    try {
        const filename = validate_filename(req.params.filename);
        const project = validate_project(req.params.project);
        const records = await storageService.list_records(project, filename);
        res.json({ records });
    } catch (error) {
        next(error);
    }
}

export async function get_record(req, res, next) {
    try {
        const { record_id } = req.params;
        if (!record_id) {
            throw new AppError('Record ID is required', 400);
        }
        const filename = validate_filename(req.params.filename);
        const project = validate_project(req.params.project);
        const record = await storageService.get_record(project, filename, record_id);
        res.json({ record });
    } catch (error) {
        next(error);
    }
}

export async function add_record(req, res, next) {
    try {
        const filename = validate_filename(req.params.filename);
        const project = validate_project(req.params.project);
        const record_data = req.body;
        if (typeof record_data !== 'object' || Array.isArray(record_data)) {
            throw new AppError('Record data must be a JSON object', 400);
        }
        const result = await storageService.add_record(project, filename, record_data);
        res.status(201).json({ message: 'Record added', id: result.id, record: result.record });
    } catch (error) {
        next(error);
    }
}

export async function update_record(req, res, next) {
    try {
        const { record_id } = req.params;
        if (!record_id) {
            throw new AppError('Record ID is required', 400);
        }
        const filename = validate_filename(req.params.filename);
        const project = validate_project(req.params.project);
        const update_data = req.body;
        if (typeof update_data !== 'object' || Array.isArray(update_data)) {
            throw new AppError('Update data must be a JSON object', 400);
        }
        const updated_record = await storageService.update_record(project, filename, record_id, update_data);
        res.json({ message: 'Record updated', record: updated_record });
    } catch (error) {
        next(error);
    }
}

export async function delete_record(req, res, next) {
    try {
        const { record_id } = req.params;
        if (!record_id) {
            throw new AppError('Record ID is required', 400);
        }
        const filename = validate_filename(req.params.filename);
        const project = validate_project(req.params.project);
        await storageService.delete_record(project, filename, record_id);
        res.json({ message: 'Record deleted' });
    } catch (error) {
        next(error);
    }
}