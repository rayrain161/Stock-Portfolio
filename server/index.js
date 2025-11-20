import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Helper to read DB
async function readDb() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default
    return { transactions: [] };
  }
}

// Helper to write DB
async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// GET transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const db = await readDb();
    res.json(db.transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read transactions' });
  }
});

// POST transaction
app.post('/api/transactions', async (req, res) => {
  console.log('Received POST /api/transactions', req.body);
  try {
    const transaction = req.body;
    const db = await readDb();
    db.transactions.push(transaction);
    await writeDb(db);
    console.log('Transaction saved successfully');
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});

// DELETE all transactions
app.delete('/api/transactions', async (req, res) => {
  try {
    await writeDb({ transactions: [] });
    console.log('All transactions cleared');
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error clearing transactions:', error);
    res.status(500).json({ error: 'Failed to clear transactions' });
  }
});

// DELETE transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDb();
    db.transactions = db.transactions.filter(t => t.id !== id);
    await writeDb(db);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// GET history from CSV
app.get('/api/history', async (req, res) => {
  try {
    const csvPath = path.join(__dirname, 'record.csv');
    const data = await fs.readFile(csvPath, 'utf8');

    // Parse CSV
    const lines = data.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');
      const entry = {};

      // Map relevant columns
      // 0: Date
      // 1: TW Market Value
      // 2: TW Cost
      // 4: TW P/L Rate
      // 9: US Market Value (USD)
      // 10: US Cost (USD)
      // 12: US P/L Rate
      // 16: Total P/L Rate

      if (values[0]) {
        entry.date = values[0];
        entry.twMarketValue = parseFloat(values[1]) || 0;
        entry.twCost = parseFloat(values[2]) || 0;
        entry.twPLRate = parseFloat(values[4]?.replace('%', '')) || 0;

        entry.usMarketValueUSD = parseFloat(values[9]) || 0;
        entry.usCostUSD = parseFloat(values[10]) || 0;
        entry.usPLRate = parseFloat(values[12]?.replace('%', '')) || 0;

        entry.totalPLRate = parseFloat(values[16]?.replace('%', '')) || 0;

        result.push(entry);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error reading history CSV:', error);
    res.status(500).json({ error: 'Failed to read history data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
