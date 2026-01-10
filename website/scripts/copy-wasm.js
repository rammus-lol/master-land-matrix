import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
const dest = path.join(__dirname, '..', 'public', 'sql-wasm.wasm');

fs.mkdirSync(path.dirname(dest), { recursive: true });

fs.copyFileSync(source, dest);
console.log('✓ sql-wasm.wasm copié dans public/');