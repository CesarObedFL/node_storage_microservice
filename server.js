import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { port, get_cors_origins } from './config/config.js';
import storage_routes from './routes/routes_storage.js';
import AppError from './utils/error_handler.js';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { write_log } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        write_log(
            `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - IP: ${req.ip}`,
            res.statusCode >= 400 ? 'error' : 'info'
        );
    });
    next();
});

app.set('port', port);

// ==================== CORS CONFIGURATION ====================
const allowed_origins = get_cors_origins();

if (allowed_origins.length > 0) {
    app.use(cors({
        origin: function (origin, callback) {
            if (!origin) {
                return callback(null, true);
            }
            if (allowed_origins.includes(origin)) {
                return callback(null, true);
            }
            const err = new Error('Not allowed by CORS');
            err.statusCode = 403;
            err.isOperational = true; // ← crucial
            callback(err);
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }));
} else if (process.env.NODE_ENV === 'production') {
    // prod, if there isn't setting origins, block all
    console.error('❌ CORS origins not set in production. Blocking all requests.');
    app.use((req, res, next) => {
        res.status(403).json({ error: 'CORS not configured' });
    });
}

// ==================== RATE LIMITING ====================
// Global limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict limiter for critical endpoints (token creation, write operations)
const strictLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20,
    message: 'Too many requests to this endpoint, please slow down.',
});

// Apply global limiter to all routes
app.use(globalLimiter);

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

// Mount routes
app.use('/', storage_routes);

// Global error handler
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';

    console.error({
        message: err.message || 'Unknown error',
        stack: err.stack || 'No stack trace',
        status,
    });

    res.status(status).json({ error: message });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`✅ Server running on http://localhost:${port}`);
    });
}

export default app;