import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { port } from './config/config.js';
import storage_routes from './routes/routes_storage.js';
import admin_routes from './routes/routes_admin.js';
import AppError from './utils/error_handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('port', port);
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/', storage_routes);
app.use('/', admin_routes);

// Global error handler
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';
    console.error(err);
    res.status(status).json({ error: message });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`✅ Server running on http://localhost:${port}`);
    });
}

export default app;