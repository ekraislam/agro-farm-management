-- ==============================================================================
-- Mumin Agro (মুমিন এগ্রো) — Smart Dairy & Biogas Management System
-- Migration: 20261010000002_phase4_cow_health_records.sql
-- Description: Phase 4 Cow Profiles, Health Records, Restrictive Archival, and Milk Entry Type Distinction
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Cows: Expanded Status, Age Estimation Flag, Gender, Purchase, and Archival
-- ------------------------------------------------------------------------------
-- Relax and expand status check constraint
ALTER TABLE public.cows DROP CONSTRAINT IF EXISTS cows_status_check;
ALTER TABLE public.cows ADD CONSTRAINT cows_status_check 
    CHECK (status IN ('milking', 'pregnant', 'dry', 'calf', 'sick', 'sold', 'other'));

-- Add new cow profile columns
ALTER TABLE public.cows
    ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'female' CHECK (gender IN ('female', 'male')),
    ADD COLUMN IF NOT EXISTS is_age_estimated BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS purchase_date DATE,
    ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12, 2) DEFAULT 0.00 CHECK (purchase_price >= 0),
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index for active vs archived cows per user
CREATE INDEX IF NOT EXISTS idx_cows_user_archived 
    ON public.cows (user_id, is_archived, status);

-- ------------------------------------------------------------------------------
-- 2. Milk Records: Distinguish Individual Cow vs Farm Aggregate Records
-- ------------------------------------------------------------------------------
ALTER TABLE public.milk_records
    ADD COLUMN IF NOT EXISTS entry_type TEXT NOT NULL DEFAULT 'aggregate' 
    CHECK (entry_type IN ('aggregate', 'individual'));

-- Index for querying milk records by cow and date
CREATE INDEX IF NOT EXISTS idx_milk_records_cow_date 
    ON public.milk_records (user_id, cow_id, record_date DESC);

CREATE INDEX IF NOT EXISTS idx_milk_records_entry_type 
    ON public.milk_records (user_id, entry_type, record_date DESC);

-- ------------------------------------------------------------------------------
-- 3. Health & Vaccination Records (স্বাস্থ্য ও টিকাদান খতিয়ান)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farm_profiles(id) ON DELETE CASCADE,
    cow_id UUID REFERENCES public.cows(id) ON DELETE SET NULL,
    cow_tag TEXT NOT NULL,
    cow_name TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('vaccination', 'deworming', 'vet_consultation', 'treatment', 'other')),
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_due_date DATE,
    treatment_name TEXT NOT NULL,
    doctor_name TEXT,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cost >= 0),
    notes TEXT,
    related_expense_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security (RLS) on health_records
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'health_records' AND policyname = 'Users can manage own farm health records'
    ) THEN
        CREATE POLICY "Users can manage own farm health records"
            ON public.health_records
            FOR ALL
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Updated_at trigger for health_records
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_health_records_modtime'
    ) THEN
        CREATE TRIGGER update_health_records_modtime
            BEFORE UPDATE ON public.health_records
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Indexes for health queries
CREATE INDEX IF NOT EXISTS idx_health_records_user_cow 
    ON public.health_records (user_id, cow_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_health_records_next_due 
    ON public.health_records (user_id, next_due_date);

-- ------------------------------------------------------------------------------
-- 4. Financial Transactions: Link to Health Record
-- ------------------------------------------------------------------------------
ALTER TABLE public.financial_transactions
    ADD COLUMN IF NOT EXISTS related_health_record_id UUID REFERENCES public.health_records(id) ON DELETE SET NULL;

-- Unique partial index to prevent duplicate expense from the same health record
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_health_expense 
    ON public.financial_transactions (user_id, related_health_record_id) 
    WHERE related_health_record_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 5. Tasks/Reminders: Link to Cow and Health Record
-- ------------------------------------------------------------------------------
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS related_health_record_id UUID REFERENCES public.health_records(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS cow_id UUID REFERENCES public.cows(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS completed_at DATE;
