import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const DB_PATH = path.join(__dirname, 'server', 'db.json');
const CSV_PATH = path.join(__dirname, 'server', 'record.csv');

async function buildApp() {
  console.log('Building React app for GitHub Pages...');
  try {
    await execAsync('npx vite build', { cwd: __dirname });
    console.log('Build complete.');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function readData() {
  console.log('Reading data...');
  let transactions = [];
  let history = [];

  // Read Transactions
  try {
    const dbContent = await fs.readFile(DB_PATH, 'utf8');
    transactions = JSON.parse(dbContent).transactions || [];
  } catch (e) {
    console.warn('Could not read db.json, using empty transactions.');
  }

  // Read History (CSV)
  try {
    const csvContent = await fs.readFile(CSV_PATH, 'utf8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    history = lines.slice(1).map(line => {
      const values = line.split(',');
      const entry = {};
      headers.forEach((header, index) => {
        let value = values[index]?.trim();
        // Convert numbers
        if (header !== 'date' && !isNaN(Number(value))) {
          value = Number(value);
        }
        entry[header] = value;
      });
      return entry;
    });
  } catch (e) {
    console.warn('Could not read record.csv, using empty history.');
  }

  return { transactions, history };
}

async function injectData(data) {
  console.log('Injecting data into index.html...');
  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  let html = await fs.readFile(indexHtmlPath, 'utf8');

  const scriptContent = `
    <script>
        window.INITIAL_DATA = ${JSON.stringify(data)};
    </script>
    `;

  // Inject before </head>
  html = html.replace('</head>', `${scriptContent}</head>`);

  await fs.writeFile(indexHtmlPath, html);
}

async function main() {
  await buildApp();
  const data = await readData();
  await injectData(data);
  console.log(`GitHub Pages build ready in: ${DIST_DIR}`);
}

main();
