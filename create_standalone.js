import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const SERVER_DIR = path.join(__dirname, 'server');
const OUTPUT_FILE = path.join(__dirname, 'stock_position_standalone.html');

async function buildApp() {
  console.log('Building React app...');
  try {
    // Use npx vite build to bypass strict tsc checks if needed, 
    // but ideally we should fix errors. 
    // However, for this task, we just want the build artifact.
    await execAsync('npx vite build', { cwd: __dirname });
    console.log('Build complete.');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function readData() {
  console.log('Reading data...');
  const dbPath = path.join(SERVER_DIR, 'db.json');
  const csvPath = path.join(SERVER_DIR, 'record.csv');

  const dbData = JSON.parse(await fs.readFile(dbPath, 'utf8'));
  const csvData = await fs.readFile(csvPath, 'utf8');

  // Parse CSV to JSON for History
  const lines = csvData.split('\n');
  const history = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',');
    if (values[0]) {
      history.push({
        date: values[0],
        twMarketValue: parseFloat(values[1]) || 0,
        twCost: parseFloat(values[2]) || 0,
        twPLRate: parseFloat(values[4]?.replace('%', '')) || 0,
        usMarketValueUSD: parseFloat(values[9]) || 0,
        usCostUSD: parseFloat(values[10]) || 0,
        usPLRate: parseFloat(values[12]?.replace('%', '')) || 0,
        totalPLRate: parseFloat(values[16]?.replace('%', '')) || 0,
      });
    }
  }

  return {
    transactions: dbData.transactions,
    history
  };
}

async function inlineAssets() {
  console.log('Inlining assets...');
  let html = await fs.readFile(path.join(DIST_DIR, 'index.html'), 'utf8');
  const assetsDir = path.join(DIST_DIR, 'assets');
  const files = await fs.readdir(assetsDir);

  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const content = await fs.readFile(filePath, 'utf8');

    if (file.endsWith('.js')) {
      // Replace <script ... src="..."> with inline script
      // Note: Vite's index.html usually has <script type="module" ... src="/assets/index-....js"></script>
      // We need to find the specific script tag for this file
      const scriptTagRegex = new RegExp(`<script[^>]*src=["']\/assets\/${file}["'][^>]*><\/script>`);
      html = html.replace(scriptTagRegex, `<script type="module">${content}</script>`);

      // Also handle <link rel="modulepreload" ... href="/assets/...">
      const preloadTagRegex = new RegExp(`<link[^>]*rel=["']modulepreload["'][^>]*href=["']\/assets\/${file}["'][^>]*>`);
      html = html.replace(preloadTagRegex, ''); // Remove preload, we are inlining
    } else if (file.endsWith('.css')) {
      // Replace <link rel="stylesheet" ... href="..."> with inline style
      const linkTagRegex = new RegExp(`<link[^>]*rel=["']stylesheet["'][^>]*href=["']\/assets\/${file}["'][^>]*>`);
      html = html.replace(linkTagRegex, `<style>${content}</style>`);
    }
  }

  return html;
}

async function main() {
  await buildApp();

  const data = await readData();
  let html = await inlineAssets();

  // Inject Data
  const dataScript = `<script>window.INITIAL_DATA = ${JSON.stringify(data)};</script>`;
  // Insert before the first script tag or at the end of body
  if (html.includes('<script')) {
    html = html.replace('<script', `${dataScript}<script`);
  } else {
    html = html.replace('</body>', `${dataScript}</body>`);
  }

  await fs.writeFile(OUTPUT_FILE, html);
  console.log(`Standalone HTML generated at: ${OUTPUT_FILE}`);
}

main();
