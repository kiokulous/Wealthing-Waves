-- ================================================
-- FIX: Convert total_money to Absolute Values
-- ================================================
-- 
-- Problem: Currently total_money stores negative values for "Mua" 
-- and positive for "Bán/Chốt"
--
-- Solution: Convert ALL values to positive (absolute)
-- and rely on the 'type' column to determine direction
--
-- ================================================

-- Step 1: Update all transactions to use absolute values
UPDATE transactions
SET total_money = ABS(total_money)
WHERE total_money < 0;

-- Step 2: Verify the update
SELECT 
    type,
    COUNT(*) as count,
    MIN(total_money) as min_value,
    MAX(total_money) as max_value,
    AVG(total_money) as avg_value
FROM transactions
GROUP BY type
ORDER BY type;

-- Expected result: All min_value should be >= 0

-- ================================================
-- Optional: Add constraint to prevent negative values
-- ================================================

-- Add check constraint to ensure total_money is always positive
ALTER TABLE transactions
ADD CONSTRAINT check_total_money_positive
CHECK (total_money >= 0);

-- Note: If this fails, it means there are still negative values
-- Run Step 1 again before adding the constraint
