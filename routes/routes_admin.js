import express from 'express';
import { admin_auth_middleware } from '../auth/admin_auth_middleware.js';
import {
    create_project_token,
    list_all_project_tokens,
    revoke_project_token
} from '../controllers/admin_controller.js';

const router = express.Router();

/**
 * Apply admin authentication to all routes below this point.
 */
router.use(admin_auth_middleware);

/**
 * POST /admin/tokens/:project_name
 * Creates a token for a project (or retrieves existing).
 */
router.post('/admin/tokens/:project_name', create_project_token);

/**
 * GET /admin/tokens
 * Lists all tokens.
 */
router.get('/admin/tokens', list_all_project_tokens);

/**
 * DELETE /admin/tokens/:project_name
 * Revokes a project's token.
 */
router.delete('/admin/tokens/:project_name', revoke_project_token);

export default router;