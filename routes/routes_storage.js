import express from 'express';
import {
    list_files,
    get_file,
    create_or_replace_file,
    update_file,
    patch_file,
    delete_project,
    create_project
} from '../controllers/storage_controller.js';

const router = express.Router();

/**
 * POST /storage/project/:project_name
 * Creates a new project folder.
 */
router.post('/project/:project_name', create_project);

/**
 * DELETE /storage/:project
 * Deletes the entire project folder and all its contents.
 */
router.delete('/:project', delete_project);

/**
 * GET /storage/:project
 * Lists all .json files in the specified project.
 */
router.get('/:project', list_files);

/**
 * GET /storage/:project/:filename
 * Retrieves the content of a specific JSON file.
 */
router.get('/:project/:filename', get_file);

/**
 * POST /storage/:project/:filename
 * Creates a new file or replaces an existing one.
 */
router.post('/:project/:filename', create_or_replace_file);

/**
 * PUT /storage/:project/:filename
 * Merges the provided data with the existing file (upsert).
 */
router.put('/:project/:filename', update_file);

/**
 * PATCH /storage/:project/:filename
 * Merges the provided data with the existing file (same as PUT).
 */
router.patch('/:project/:filename', patch_file);

/**
 * Test route to verify that the router is mounted correctly.
 */
router.get('/test', (req, res) => {
    res.json({ message: 'Router working' });
});

export default router;