import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

// project file_structure files
import storageRoutes from './routes/routesStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const port = process.env.PORT || 4000;

const app = express();

app.set('port', port);
app.use(express.json());

// Ruta de health check (opcional)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/storage', storageRoutes);


app.listen(port, () => {
    console.log(`running server in http://localhost:${port}`);
});


