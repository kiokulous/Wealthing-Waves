-- ================================================
-- DEBUG: Check if total_money still has negative values
-- ================================================

-- Check for negative values
SELECT 
    id,
    date,
    type,
    symbol,
    quantity,
    price,
    total_money,
    CASE 
        WHEN total_money < 0 THEN 'NEGATIVE ❌'
        ELSE 'POSITIVE ✓'
    END as status
FROM transactions
WHERE total_money < 0
ORDER BY date DESC
LIMIT 20;

-- Summary by type
SELECT 
    type,
    COUNT(*) as count,
    COUNT(CASE WHEN total_money < 0 THEN 1 END) as negative_count,
    MIN(total_money) as min_value,
    MAX(total_money) as max_value,
    SUM(total_money) as total_sum
FROM transactions
GROUP BY type
ORDER BY type;

-- Total invested vs sold (should match dashboard)
SELECT 
    SUM(CASE WHEN type = 'Mua' THEN ABS(total_money) ELSE 0 END) as total_invested,
    SUM(CASE WHEN type IN ('Bán', 'Chốt') THEN ABS(total_money) ELSE 0 END) as total_sold
FROM transactions;
