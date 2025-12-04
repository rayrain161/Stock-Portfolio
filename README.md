# Stock Portfolio Tracker (Hybrid)

A personal stock portfolio tracking application that runs on **GitHub Pages** (Frontend) and uses **Google Apps Script (GAS)** as a backend/database (Google Sheets).

## Features

*   **Dashboard:** Overview of total assets, day change, and allocation.
*   **Holdings:** Detailed list of current positions with real-time price updates.
*   **Transaction History:** Log of all buys and sells.
*   **Historical Analysis:** Charts for Total Assets, Market Value vs Cost, and P/L Rates over time.
*   **Hybrid Architecture:**
    *   **Frontend:** React + Vite (hosted on GitHub Pages).
    *   **Backend:** Google Apps Script (serves data from Google Sheets).
    *   **Database:** Google Sheets (`Transactions` and `History` sheets).

## Setup Guide

### 1. Google Apps Script (Backend)

1.  Create a new **Google Sheet**.
2.  Go to **Extensions > Apps Script**.
3.  Copy the content of `gas/Code.js` from this repository and paste it into the script editor.
4.  **Deploy as Web App:**
    *   Click **Deploy > New deployment**.
    *   Select type: **Web app**.
    *   Description: `v1` (or anything).
    *   Execute as: **Me** (your email).
    *   Who has access: **Anyone** (allows the frontend to fetch data).
    *   Click **Deploy**.
5.  **Copy the Web App URL** (ends with `/exec`). You will need this for the frontend.
6.  **Run Initial Setup:**
    *   In the Apps Script editor, select the `setup` function from the dropdown and click **Run**.
    *   Grant necessary permissions.
    *   This creates the `Transactions` and `History` sheets.
7.  **Set Daily Trigger (Optional):**
    *   Run the `createDailyTrigger` function to automatically record daily snapshots at 8 AM (Taipei Time).

### 2. Frontend (GitHub Pages)

1.  **Fork/Clone** this repository.
2.  **Push** the code to your GitHub repository.
3.  Go to **Settings > Pages**.
4.  Source: **Deploy from a branch**.
5.  Branch: `main` (or `master`) / Folder: `root` (or `/docs` if configured).
    *   *Note: This project uses a custom build script `build_hybrid.js` that outputs to `/dist`. You might need to configure GitHub Actions or push the `dist` folder to a `gh-pages` branch.*
    *   **Easier method:** The current setup pushes the built assets in `dist` to the `main` branch. Ensure your GitHub Pages is serving from the root of the `dist` folder if possible, or just serve the root if `index.html` is there.
    *   *Actually, the current build script prepares everything in `dist`. You can manually upload `dist` contents or configure a workflow.*

### 3. Connecting Frontend to Backend

1.  Open your deployed frontend URL (e.g., `https://yourname.github.io/Stock-Portfolio/`).
2.  You will see a **Setup Connection** screen.
3.  Paste the **Google Apps Script Web App URL** you copied earlier.
4.  Click **Connect**.

## Usage

### Importing Historical Data
1.  Go to the **Analysis** tab.
2.  Click **Import CSV**.
3.  Paste your historical data CSV.
    *   Format: `Date, TW_MV, TW_Cost, TW_PL, TW_PL%, ...` (17 columns).
4.  Check **Overwrite existing data** if you want to replace old records.
5.  Click **Import**.

### Adding Transactions
1.  Go to the **Dashboard** or **Holdings** tab.
2.  Click **New Trade**.
3.  Enter details (Date, Symbol, Type, Shares, Price, etc.).
4.  Click **Save**.

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start dev server:
    ```bash
    npm run dev
    ```
3.  Build for production:
    ```bash
    node build_hybrid.js
    ```

## Files
*   `src/`: React source code.
*   `gas/Code.js`: Google Apps Script backend code.
*   `build_hybrid.js`: Build script for GitHub Pages deployment.
