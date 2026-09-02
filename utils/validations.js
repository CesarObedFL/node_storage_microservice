// ================================================================
// utils/validation.js
// Shared validation utilities for controllers
// ================================================================
// Provides functions to validate project names and filenames,
// throwing AppError with appropriate status codes.
//
// @see ../utils/error_handler.js
// ================================================================

import AppError from './error_handler.js';

/**
 * Validates that a project name is present and non‑empty.
 *
 * @param {string} project - Project name to validate.
 * @returns {string} Trimmed project name.
 * @throws {AppError} If project is missing or invalid (status 400).
 */
export function validate_project(project) {
    if (!project || typeof project !== 'string' || project.trim() === '') {
        throw new AppError('Missing or invalid project name', 400);
    }
    return project.trim();
}

/**
 * Validates that a filename is present and non‑empty.
 *
 * @param {string} filename - Filename to validate.
 * @returns {string} Trimmed filename.
 * @throws {AppError} If filename is missing or invalid (status 400).
 */
export function validate_filename(filename) {
    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
        throw new AppError('Filename is required', 400);
    }
    return filename.trim();
}