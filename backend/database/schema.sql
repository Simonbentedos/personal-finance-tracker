-- Personal Finance Tracker Database Schema (PostgreSQL)
-- All table names start with lowercase letters

CREATE TABLE IF NOT EXISTS user_profile (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_no VARCHAR(30),
  password VARCHAR(255) NOT NULL,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account (
  account_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  balance NUMERIC(12,2) DEFAULT 0,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS category (
  category_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
  category_name VARCHAR(255) NOT NULL,
  category_type VARCHAR(50) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS budget (
  budget_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES category(category_id) ON DELETE CASCADE,
  amount_limit NUMERIC(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS transaction (
  transaction_id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES category(category_id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  transaction_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offline_data (
  offline_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
  transaction_id INTEGER REFERENCES transaction(transaction_id) ON DELETE SET NULL,
  sync_status VARCHAR(20) DEFAULT 'pending',
  last_synced TIMESTAMP WITH TIME ZONE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transaction_user_date
  ON transaction (transaction_date);

CREATE INDEX IF NOT EXISTS idx_budget_user_dates
  ON budget (user_id, start_date, end_date);


