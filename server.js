import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { port, get_cors_origins } from './config/config.js';
import routes from './routes/index.js';
import AppError from './utils/error_handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('port', port);

// ==================== CORS ====================
const allowedOrigins = get_cors_origins();

if (allowedOrigins.length > 0) {
    app.use(cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            const err = new Error('Not allowed by CORS');
            err.statusCode = 403;
            err.isOperational = true;
            callback(err);
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }));
} else {
    app.use(cors()); // fallback for development
}

// ==================== JSON Parser ====================
app.use(express.json({
    verify: (req, res, buf) => {
        if (buf.length === 0) return;
        try { JSON.parse(buf); }
        catch (err) { throw new AppError('Request body must be a valid JSON object', 400); }
    }
}));

// ==================== Routes ====================
app.use('/', routes);

// ==================== Global error handler ====================
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';
    console.error({ message, stack: err.stack || 'No stack', status });
    res.status(status).json({ error: message });
});

// ==================== Start ====================
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`✅ Server running on port ${port}`);
        if (allowedOrigins.length > 0) {
            console.log(`🔒 CORS allowed origins: ${allowedOrigins.join(', ')}`);
        }
    });
}

export default app;