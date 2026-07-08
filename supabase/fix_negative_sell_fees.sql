-- Migration: fix negative fees on sell transactions
-- Date: 2026-07-07
-- Context: the auto-fee formula `fee = total_money − qty×price` is only
-- correct for BUYS (you pay value + fee). For SELLS the cash received is
-- value − fee, so the formula produced NEGATIVE fees. The app now uses
-- direction-aware formulas; this fixes rows saved with the old logic.
--
-- Chỉ đảo dấu các lệnh Bán/Chốt có phí âm — không đụng lệnh Mua
-- hay các lệnh Bán cũ đã có phí dương đúng.
--
-- Run once in Supabase SQL Editor. Idempotent — safe to re-run.

-- Xem trước các dòng sẽ bị sửa:
SELECT id, date, symbol, type, quantity, price, fee, total_money
FROM transactions
WHERE type IN ('Chốt', 'Bán') AND fee < 0
ORDER BY date DESC;

-- Sửa:
UPDATE transactions
SET fee = -fee
WHERE type IN ('Chốt', 'Bán') AND fee < 0;
