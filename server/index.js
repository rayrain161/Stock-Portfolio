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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
