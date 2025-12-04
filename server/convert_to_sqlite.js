import sqlite3 from 'sqlite3';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'stock_data.db');
const JSON_DB_PATH = path.join(__dirname, 'db.json');
const CSV_PATH = path.join(__dirname, 'record.csv');

// Initialize DB
const db = new sqlite3.Database(DB_PATH);

function run(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function createTables() {
    await run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            date TEXT,
            type TEXT,
            symbol TEXT,
            shares REAL,
            price REAL,
            amount REAL,
            fee REAL,
            tax REAL,
            total REAL,
            note TEXT
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS history (
            date TEXT PRIMARY KEY,
            tw_market_value REAL,
            tw_cost REAL,
            tw_pl_rate REAL,
            us_market_value_usd REAL,
            us_cost_usd REAL,
            us_pl_rate REAL,
            total_pl_rate REAL
        )
    `);
    console.log('Tables created.');
}

async function importTransactions() {
    try {
        const data = await fs.readFile(JSON_DB_PATH, 'utf8');
        const json = JSON.parse(data);
        const transactions = json.transactions || [];

        const stmt = db.prepare(`
            INSERT OR REPLACE INTO transactions 
            (id, date, type, symbol, shares, price, amount, fee, tax, total, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const t of transactions) {
            stmt.run(
                t.id, t.date, t.type, t.symbol, t.shares, t.price, t.amount, 
                t.fee, t.tax, t.total, t.note
            );
        }
        stmt.finalize();
        console.log(`Imported ${transactions.length} transactions.`);
    } catch (err) {
        console.error('Error importing transactions:', err.message);
    }
}

async function importHistory() {
    try {
        const data = await fs.readFile(CSV_PATH, 'utf8');
        const lines = data.split('\n');
        
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO history 
            (date, tw_market_value, tw_cost, tw_pl_rate, us_market_value_usd, us_cost_usd, us_pl_rate, total_pl_rate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let count = 0;
        // Skip header (i=1)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',');
            if (!values[0]) continue;

            const date = values[0];
            const twMarketValue = parseFloat(values[1]) || 0;
            const twCost = parseFloat(values[2]) || 0;
            const twPLRate = parseFloat(values[4]?.replace('%', '')) || 0;
            const usMarketValueUSD = parseFloat(values[9]) || 0;
            const usCostUSD = parseFloat(values[10]) || 0;
            const usPLRate = parseFloat(values[12]?.replace('%', '')) || 0;
            const totalPLRate = parseFloat(values[16]?.replace('%', '')) || 0;

            stmt.run(
                date, twMarketValue, twCost, twPLRate, 
                usMarketValueUSD, usCostUSD, usPLRate, totalPLRate
            );
            count++;
        }
        stmt.finalize();
        console.log(`Imported ${count} history records.`);
    } catch (err) {
        console.error('Error importing history:', err.message);
    }
}

async function main() {
    await createTables();
    await importTransactions();
    await importHistory();
    db.close();
    console.log('Database conversion complete: stock_data.db');
}

main();
