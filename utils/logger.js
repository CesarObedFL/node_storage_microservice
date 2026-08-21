import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, '../logs.txt');

/**
 * Escribe un mensaje en el archivo de logs con timestamp.
 * @param {string} message - Mensaje a registrar.
 * @param {string} [level='info'] - Nivel de log (info, warn, error, debug).
 */
export function write_log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const log_entry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    fs.appendFile(LOG_FILE, log_entry, (err) => {
        if (err) console.error('Error writing log:', err);
    });
    
    console.log(log_entry.trim());
}