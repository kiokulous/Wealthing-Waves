-- Migration: add notes column to transactions
-- Date: 2026-07-07
-- Context: setup.sql defines `notes TEXT` but the production DB was created
-- from an older script version and lacks the column (verified via PostgREST
-- error 42703). The transaction form now saves notes, so this MUST run
-- BEFORE deploying that code.
--
-- Run once in Supabase SQL Editor. Idempotent — safe to re-run.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN transactions.notes IS 'User notes about the transaction';
