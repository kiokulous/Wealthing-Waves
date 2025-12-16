-- ================================================
-- WEALTHING WAVES - SUPABASE DATABASE SETUP
-- ================================================
-- Run this script in Supabase SQL Editor after creating your project

-- ================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ================================================

-- Enable RLS on auth tables (should already be enabled, but let's be sure)
-- The auth.users table is managed by Supabase Auth

-- ================================================
-- 2. CREATE TRANSACTIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('Mua', 'Chốt', 'Bán')),
  category VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  quantity DECIMAL(18, 4) NOT NULL,
  price DECIMAL(18, 2) NOT NULL,
  fee DECIMAL(18, 2) DEFAULT 0,
  total_money DECIMAL(18, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

COMMENT ON TABLE transactions IS 'Portfolio transactions: buys and sells';
COMMENT ON COLUMN transactions.type IS 'Transaction type: Mua (buy), Chốt (sell), Bán (sell)';
COMMENT ON COLUMN transactions.notes IS 'User notes about the transaction';

-- ================================================
-- 3. CREATE MARKET_PRICES TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS market_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  price DECIMAL(18, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, symbol, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_market_prices_user ON market_prices(user_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_symbol ON market_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_market_prices_date ON market_prices(date DESC);
CREATE INDEX IF NOT EXISTS idx_market_prices_user_symbol ON market_prices(user_id, symbol);

COMMENT ON TABLE market_prices IS 'Market price updates for symbols';
COMMENT ON COLUMN market_prices.price IS 'Price per unit at the given date';

-- ================================================
-- 4. CREATE AUTO-UPDATE TIMESTAMP FUNCTION
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on row update';

-- ================================================
-- 5. CREATE TRIGGERS
-- ================================================

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_market_prices_updated_at ON market_prices;
CREATE TRIGGER update_market_prices_updated_at 
  BEFORE UPDATE ON market_prices
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 7. CREATE RLS POLICIES FOR TRANSACTIONS
-- ================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

-- Create new policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================
-- 8. CREATE RLS POLICIES FOR MARKET_PRICES
-- ================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own prices" ON market_prices;
DROP POLICY IF EXISTS "Users can insert their own prices" ON market_prices;
DROP POLICY IF EXISTS "Users can update their own prices" ON market_prices;
DROP POLICY IF EXISTS "Users can delete their own prices" ON market_prices;

-- Create new policies
CREATE POLICY "Users can view their own prices"
  ON market_prices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prices"
  ON market_prices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prices"
  ON market_prices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prices"
  ON market_prices FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================
-- 9. CREATE HELPER VIEWS (OPTIONAL)
-- ================================================

-- View to get latest market prices for each symbol per user
CREATE OR REPLACE VIEW latest_market_prices AS
SELECT DISTINCT ON (user_id, symbol)
  user_id,
  symbol,
  category,
  price,
  date,
  created_at
FROM market_prices
ORDER BY user_id, symbol, date DESC, created_at DESC;

COMMENT ON VIEW latest_market_prices IS 'Latest price for each symbol per user';

-- ================================================
-- 10. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ================================================

-- Uncomment the following to insert sample data
-- Note: Replace 'YOUR_USER_ID' with your actual user ID from auth.users

/*
-- Insert sample transactions
INSERT INTO transactions (user_id, date, type, category, symbol, quantity, price, fee, total_money, notes)
VALUES 
  ('YOUR_USER_ID', '2024-01-15', 'Mua', 'Cổ phiếu', 'VNM', 100, 75000, 100000, 7600000, 'First stock purchase'),
  ('YOUR_USER_ID', '2024-02-20', 'Mua', 'Chứng chỉ quỹ', 'DCDS', 50, 15000, 50000, 800000, 'Diversification');

-- Insert sample market prices
INSERT INTO market_prices (user_id, date, category, symbol, price)
VALUES 
  ('YOUR_USER_ID', '2024-01-15', 'Cổ phiếu', 'VNM', 75000),
  ('YOUR_USER_ID', '2024-12-16', 'Cổ phiếu', 'VNM', 82000),
  ('YOUR_USER_ID', '2024-02-20', 'Chứng chỉ quỹ', 'DCDS', 15000),
  ('YOUR_USER_ID', '2024-12-16', 'Chứng chỉ quỹ', 'DCDS', 16500);
*/

-- ================================================
-- SETUP COMPLETE! 🎉
-- ================================================

-- Next steps:
-- 1. Enable Email & Google Auth in Supabase Dashboard > Authentication > Providers
-- 2. Configure Google OAuth with your credentials
-- 3. Copy your Project URL and anon key to .env.local
-- 4. Start building your app!

SELECT 'Database setup completed successfully! 🌊' as message;
