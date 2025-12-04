import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');

async function buildApp() {
  console.log('Building React app for GitHub Pages (Hybrid Mode)...');
  try {
    await execAsync('npx vite build', { cwd: __dirname });
    console.log('Build complete. Output in /dist');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function main() {
  await buildApp();
  console.log('Ready to upload to GitHub!');
}

main();
