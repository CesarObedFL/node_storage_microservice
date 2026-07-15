import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { port } from './config/config.js';
import storage_routes from './routes/routes_storage.js';
import AppError from './utils/error_handler.js';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('port', port);

// ==================== CORS CONFIGURATION ====================
const allowed_origins = get_cors_origins();

if (allowed_origins.length > 0) {
    app.use(cors({
        origin: allowed_origins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }));
} else {
    // Si no hay orígenes configurados, permitir todos (solo en desarrollo)
    console.warn('⚠️  No CORS origins configured. Allowing all origins (development mode).');
    app.use(cors());
}


app.use(express.json({
    verify: (req, res, buf, encoding) => {
        try {
            if (buf.length === 0) return;
            JSON.parse(buf);
        } catch (err) {
            throw new AppError('Request body must be a valid JSON object', 400);
        }
    }
}));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/', storage_routes);

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