import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'gas_deploy.html');

async function buildApp() {
  console.log('Building React app for GAS...');
  try {
    await execAsync('npx vite build', { cwd: __dirname });
    console.log('Build complete.');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function inlineAssets() {
  console.log('Inlining assets for GAS...');
  let html = await fs.readFile(path.join(DIST_DIR, 'index.html'), 'utf8');
  const assetsDir = path.join(DIST_DIR, 'assets');
  const files = await fs.readdir(assetsDir);

  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const content = await fs.readFile(filePath, 'utf8');

    if (file.endsWith('.js')) {
      // Replace <script ... src="..."> with inline script
      // REMOVE type="module" because we are now building as IIFE
      const scriptTagRegex = new RegExp(`<script[^>]*src=["']\/assets\/${file}["'][^>]*><\/script>`);
      html = html.replace(scriptTagRegex, `<script>${content}</script>`);

      // Remove preload link
      const preloadTagRegex = new RegExp(`<link[^>]*rel=["']modulepreload["'][^>]*href=["']\/assets\/${file}["'][^>]*>`);
      html = html.replace(preloadTagRegex, '');
    } else if (file.endsWith('.css')) {
      // Replace <link rel="stylesheet" ... href="..."> with inline style
      const linkTagRegex = new RegExp(`<link[^>]*rel=["']stylesheet["'][^>]*href=["']\/assets\/${file}["'][^>]*>`);
      html = html.replace(linkTagRegex, `<style>${content}</style>`);
    }
  }

  // Remove any remaining modulepreload links
  html = html.replace(/<link[^>]*rel=["']modulepreload["'][^>]*>/g, '');

  // GAS-specific cleanup:
  // We KEEP the standard HTML structure (DOCTYPE, html, head, body)
  // because GAS HtmlService.createHtmlOutputFromFile works best with standard HTML.
  // The previous error was likely due to <script type="module"> which GAS rejects.

  // Just remove the favicon as it's not supported and causes noise
  html = html.replace(/<link[^>]*rel=["']icon["'][^>]*>/g, '');

  return html;
}

async function main() {
  await buildApp();
  const html = await inlineAssets();
  await fs.writeFile(OUTPUT_FILE, html);
  console.log(`GAS deployment file generated at: ${OUTPUT_FILE}`);
}

main();
