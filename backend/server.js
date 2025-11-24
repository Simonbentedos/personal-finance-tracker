const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Middleware
app.use(cors());
app.use(express.json());

// TESTING API ENDPOINTS
app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper: auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { userId: payload.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, mobile_no } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    const existing = await pool.query(
      'SELECT user_id FROM user_profile WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const insertResult = await pool.query(
      `INSERT INTO user_profile (username, email, mobile_no, password)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, username, email`,
      [username, email, mobile_no || null, hashed]
    );

    const user = insertResult.rows[0];
    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT user_id, username, email, password FROM user_profile WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get dashboard metrics
app.get('/api/dashboard/metrics', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { rows } = await pool.query(
      `SELECT transaction_type, amount
       FROM transaction t
       JOIN account a ON t.account_id = a.account_id
       WHERE a.user_id = $1
         AND t.transaction_date >= $2
         AND t.transaction_date < $3`,
      [userId, monthStart, nextMonthStart]
    );

    let totalIncome = 0;
    let totalExpenses = 0;
    rows.forEach((t) => {
      const amt = Number(t.amount || 0);
      if (t.transaction_type === 'income') totalIncome += amt;
      else if (t.transaction_type === 'expense') totalExpenses += amt;
  });

    res.json({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactions: rows.length,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Get monthly budget summary
app.get('/api/dashboard/budget', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const budgetResult = await pool.query(
      `SELECT COALESCE(SUM(b.amount_limit), 0) AS total_budget
       FROM budget b
       WHERE b.user_id = $1
         AND b.start_date <= $2
         AND b.end_date >= $2`,
      [userId, monthStart]
    );

    const spentResult = await pool.query(
      `SELECT COALESCE(SUM(t.amount), 0) AS total_spent
       FROM transaction t
       JOIN category c ON t.category_id = c.category_id
       WHERE c.user_id = $1
         AND t.transaction_type = 'expense'
         AND t.transaction_date >= $2
         AND t.transaction_date < $3`,
      [userId, monthStart, nextMonthStart]
    );

    const budget = Number(budgetResult.rows[0].total_budget || 0);
    const spent = Number(spentResult.rows[0].total_spent || 0);
    const remaining = budget - spent;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;

    res.json({
      budget,
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
    });
  } catch (error) {
    console.error('Error fetching budget summary:', error);
    res.status(500).json({ error: 'Failed to fetch budget summary' });
  }
});

// Get top spending categories
app.get('/api/dashboard/categories', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { rows } = await pool.query(
      `SELECT c.category_name AS name, COALESCE(SUM(t.amount),0) AS total
       FROM transaction t
       JOIN category c ON t.category_id = c.category_id
       JOIN account a ON t.account_id = a.account_id
       WHERE a.user_id = $1
         AND t.transaction_type = 'expense'
         AND t.transaction_date >= $2
         AND t.transaction_date < $3
       GROUP BY c.category_name
       ORDER BY total DESC
       LIMIT 5`,
      [userId, monthStart, nextMonthStart]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all transactions with filters
app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, category, search, sortBy } = req.query;

    const params = [userId];
    let where = 'a.user_id = $1';

    if (type && type !== 'all') {
      params.push(type);
      where += ` AND t.transaction_type = $${params.length}`;
    }

    if (category && category !== 'all') {
      params.push(category);
      where += ` AND c.category_name = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      where += ` AND (c.category_name ILIKE $${idx} OR t.note ILIKE $${idx})`;
    }

    const orderBy =
      sortBy === 'amount' ? 't.amount DESC' : 't.transaction_date DESC';

    const { rows } = await pool.query(
      `SELECT t.transaction_id AS id,
              t.amount,
              t.transaction_type AS type,
              t.transaction_date AS date,
              t.note AS description,
              c.category_name AS category
       FROM transaction t
       JOIN account a ON t.account_id = a.account_id
       LEFT JOIN category c ON t.category_id = c.category_id
       WHERE ${where}
       ORDER BY ${orderBy}`,
      params
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Export transactions as CSV (local backup)
app.get('/api/transactions/export', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { rows } = await pool.query(
      `SELECT t.transaction_id,
              t.transaction_date,
              t.transaction_type,
              t.amount,
              t.note,
              c.category_name,
              a.account_name
       FROM transaction t
       JOIN account a ON t.account_id = a.account_id
       LEFT JOIN category c ON t.category_id = c.category_id
       WHERE a.user_id = $1
       ORDER BY t.transaction_date DESC`,
      [userId]
    );

    const header = [
      'transaction_id',
      'transaction_date',
      'transaction_type',
      'amount',
      'note',
      'category',
      'account',
    ];

    const lines = rows.map((r) =>
      [
        r.transaction_id,
        r.transaction_date.toISOString().slice(0, 10),
        r.transaction_type,
        Number(r.amount || 0).toFixed(2),
        (r.note || '').replace(/"/g, '""'),
        (r.category_name || '').replace(/"/g, '""'),
        (r.account_name || '').replace(/"/g, '""'),
      ]
        .map((v) => `"${v}"`)
        .join(',')
    );

    const csv = [header.join(','), ...lines].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({ error: 'Failed to export transactions' });
  }
});

// Create transaction
app.post('/api/transactions', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, amount, category, description, date } = req.body;
    console.log('Create transaction request:', { userId, type, amount, category, date });

    // For simplicity, use a default account per user (create if missing)
    let account = await pool.query(
      'SELECT account_id FROM account WHERE user_id = $1 ORDER BY account_id LIMIT 1',
      [userId]
    );
    if (account.rows.length === 0) {
      account = await pool.query(
        `INSERT INTO account (user_id, account_name, account_type, balance)
         VALUES ($1, $2, $3, 0)
         RETURNING account_id`,
        [userId, 'Default Account', 'cash']
      );
    }
    const accountId = account.rows[0].account_id;

    // Ensure category exists. If none provided, use or create an 'Uncategorized' category.
    let categoryId = null;
    const categoryName = category && category.trim() ? category : 'Uncategorized';
    let cat = await pool.query(
      'SELECT category_id FROM category WHERE user_id = $1 AND category_name = $2',
      [userId, categoryName]
    );
    if (cat.rows.length === 0) {
      cat = await pool.query(
        `INSERT INTO category (user_id, category_name, category_type)
         VALUES ($1, $2, $3)
         RETURNING category_id`,
        [userId, categoryName, type === 'income' ? 'income' : 'expense']
      );
    }
    categoryId = cat.rows[0].category_id;

    const insert = await pool.query(
      `INSERT INTO transaction (account_id, category_id, amount, transaction_type, transaction_date, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING transaction_id AS id, amount, transaction_type AS type, transaction_date AS date, note AS description`,
      [accountId, categoryId, amount, type, date, description || null]
    );

    res.status(201).json(insert.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Budget planning routes (used by Budget Planning page)
app.get('/api/budgets', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { rows } = await pool.query(
      `SELECT b.budget_id,
              b.amount_limit,
              b.start_date,
              b.end_date,
              c.category_name,
              c.category_type,
              COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type = 'expense'), 0) AS spent
       FROM budget b
       JOIN category c ON b.category_id = c.category_id
       LEFT JOIN transaction t ON t.category_id = c.category_id
         AND t.transaction_date BETWEEN b.start_date AND b.end_date
       WHERE b.user_id = $1
       GROUP BY b.budget_id, b.amount_limit, b.start_date, b.end_date, c.category_name, c.category_type
       ORDER BY b.start_date DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

app.post('/api/budgets', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { category_name, amount_limit, category_type, start_date, end_date } =
      req.body;

    let cat = await pool.query(
      'SELECT category_id FROM category WHERE user_id = $1 AND category_name = $2',
      [userId, category_name]
    );
    if (cat.rows.length === 0) {
      cat = await pool.query(
        `INSERT INTO category (user_id, category_name, category_type)
         VALUES ($1, $2, $3)
         RETURNING category_id`,
        [userId, category_name, category_type || 'expense']
      );
    }
    const categoryId = cat.rows[0].category_id;

    const insert = await pool.query(
      `INSERT INTO budget (user_id, category_id, amount_limit, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING budget_id`,
      [userId, categoryId, amount_limit, start_date, end_date]
    );

    res.status(201).json({ budget_id: insert.rows[0].budget_id });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// Reports endpoints
app.get('/api/reports/monthly', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { month, year } = req.query;
    const targetYear = Number(year) || new Date().getFullYear();
    const targetMonth = Number(month) || new Date().getMonth() + 1;

    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 1);

    const { rows } = await pool.query(
      `SELECT t.amount,
              t.transaction_type,
              t.transaction_date,
              c.category_name
       FROM transaction t
       JOIN account a ON t.account_id = a.account_id
       LEFT JOIN category c ON t.category_id = c.category_id
       WHERE a.user_id = $1
         AND t.transaction_date >= $2
         AND t.transaction_date < $3`,
      [userId, start, end]
    );

    let income = 0;
    let expenses = 0;
    const categoryTotals = {};
    const dailyTrend = {};

    rows.forEach((t) => {
      const amt = Number(t.amount || 0);
      if (t.transaction_type === 'income') income += amt;
      if (t.transaction_type === 'expense') {
        expenses += amt;
        const cat = t.category_name || 'Uncategorized';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
        const day = new Date(t.transaction_date).getDate();
        dailyTrend[day] = (dailyTrend[day] || 0) + amt;
      }
    });

    res.json({
      income,
      expenses,
      netBalance: income - expenses,
      transactions: rows.length,
      categories: Object.entries(categoryTotals).map(([name, total]) => ({
        name,
        total,
      })),
      dailyTrend: Object.entries(dailyTrend).map(([day, amount]) => ({
        day: Number(day),
        amount,
      })),
    });
  } catch (error) {
    console.error('Error fetching monthly reports:', error);
    res.status(500).json({ error: 'Failed to fetch monthly reports' });
  }
});

app.get('/api/reports/yearly', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { year } = req.query;
    const targetYear = Number(year) || new Date().getFullYear();

    const start = new Date(targetYear, 0, 1);
    const end = new Date(targetYear + 1, 0, 1);

    const { rows } = await pool.query(
      `SELECT t.amount,
              t.transaction_type,
              t.transaction_date
       FROM transaction t
       JOIN account a ON t.account_id = a.account_id
       WHERE a.user_id = $1
         AND t.transaction_date >= $2
         AND t.transaction_date < $3`,
      [userId, start, end]
    );

    const income = Array(12).fill(0);
    const expenses = Array(12).fill(0);

    rows.forEach((t) => {
      const month = new Date(t.transaction_date).getMonth();
      const amt = Number(t.amount || 0);
      if (t.transaction_type === 'income') income[month] += amt;
      else if (t.transaction_type === 'expense') expenses[month] += amt;
    });

    res.json({ income, expenses });
  } catch (error) {
    console.error('Error fetching yearly reports:', error);
    res.status(500).json({ error: 'Failed to fetch yearly reports' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
