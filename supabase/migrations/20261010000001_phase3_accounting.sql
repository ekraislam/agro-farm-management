-- ==============================================================================
-- Mumin Agro (মুমিন এগ্রো) — Smart Dairy & Biogas Management System
-- Migration: 20261010000001_phase3_accounting.sql
-- Description: Phase 3 Accurate Farm Accounting, Milk Sales Distinction, and Financial Transaction Hardening
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Milk Records: Distinguish Milk Collected vs Milk Sold
-- ------------------------------------------------------------------------------
-- Add columns to differentiate production from realized commercial sales
ALTER TABLE public.milk_records 
    ADD COLUMN IF NOT EXISTS is_sold BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS sold_liters NUMERIC(6, 2) NOT NULL DEFAULT 0.00 CHECK (sold_liters >= 0);

-- Relax price_per_liter constraint so 0 is permitted when milk is kept for calves or family
ALTER TABLE public.milk_records DROP CONSTRAINT IF EXISTS milk_records_price_per_liter_check;
ALTER TABLE public.milk_records ADD CONSTRAINT milk_records_price_per_liter_check CHECK (price_per_liter >= 0);

-- ------------------------------------------------------------------------------
-- 2. Financial Transactions: Updated At Timestamp & Duplicate Prevention
-- ------------------------------------------------------------------------------
-- Add updated_at timestamp field
ALTER TABLE public.financial_transactions
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Ensure handle_updated_at trigger exists for financial_transactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_financial_transactions_modtime'
    ) THEN
        CREATE TRIGGER update_financial_transactions_modtime
            BEFORE UPDATE ON public.financial_transactions
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Prevent Duplicate Linked Income Transactions for Milk Sales
-- ------------------------------------------------------------------------------
-- Ensure each milk record can be associated with at most one linked income transaction per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_milk_transaction 
    ON public.financial_transactions (user_id, related_milk_record_id) 
    WHERE related_milk_record_id IS NOT NULL;

-- Index for transaction date queries and range filtering
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date 
    ON public.financial_transactions (user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_type_date 
    ON public.financial_transactions (user_id, type, transaction_date DESC);
