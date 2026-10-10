-- ==============================================================================
-- Mumin Agro (মুমিন এগ্রো) — Smart Dairy & Biogas Management System
-- Migration: 20261010000003_phase5_employee_biogas.sql
-- Description: Phase 5 Employee Management, Attendance, Payroll Safety, Biogas Logging & Maintenance
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Employees: Archival, Notes, and Timestamps Hardening
-- ------------------------------------------------------------------------------
ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index for active vs archived employees per owner
CREATE INDEX IF NOT EXISTS idx_employees_user_archived 
    ON public.employees (user_id, is_archived, active_status);

-- ------------------------------------------------------------------------------
-- 2. Daily Attendance: Table, Constraints, and RLS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farm_profiles(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
    arrival_time TEXT,
    departure_time TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_employee_date UNIQUE (user_id, employee_id, attendance_date)
);

-- Enable RLS on employee_attendance
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'employee_attendance' AND policyname = 'Users can manage own farm attendance'
    ) THEN
        CREATE POLICY "Users can manage own farm attendance"
            ON public.employee_attendance
            FOR ALL
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Updated_at trigger for employee_attendance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_employee_attendance_modtime'
    ) THEN
        CREATE TRIGGER update_employee_attendance_modtime
            BEFORE UPDATE ON public.employee_attendance
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Indexes for fast attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_user_date 
    ON public.employee_attendance (user_id, attendance_date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_user_emp 
    ON public.employee_attendance (user_id, employee_id, attendance_date DESC);

-- ------------------------------------------------------------------------------
-- 3. Financial Transactions: Link to Employee and Salary Period
-- ------------------------------------------------------------------------------
ALTER TABLE public.financial_transactions
    ADD COLUMN IF NOT EXISTS related_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS salary_period TEXT;

-- Index for payroll history queries
CREATE INDEX IF NOT EXISTS idx_financial_transactions_salary 
    ON public.financial_transactions (user_id, related_employee_id, salary_period);

-- ------------------------------------------------------------------------------
-- 4. Biogas Logs: Recorded by Employee & Updated At Trigger
-- ------------------------------------------------------------------------------
ALTER TABLE public.biogas_logs
    ADD COLUMN IF NOT EXISTS recorded_by_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Updated_at trigger for biogas_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_biogas_logs_modtime'
    ) THEN
        CREATE TRIGGER update_biogas_logs_modtime
            BEFORE UPDATE ON public.biogas_logs
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Index for biogas date sorting
CREATE INDEX IF NOT EXISTS idx_biogas_logs_user_date 
    ON public.biogas_logs (user_id, log_date DESC);

-- ------------------------------------------------------------------------------
-- 5. Biogas Safety & Maintenance Inspections Checklist Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.biogas_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farm_profiles(id) ON DELETE CASCADE,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    item_key TEXT NOT NULL CHECK (item_key IN ('inlet', 'pipes', 'safety_valve', 'slurry_outlet', 'cleanliness')),
    item_name_bn TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('good', 'needs_attention', 'urgent')),
    inspector_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    inspector_name TEXT,
    notes TEXT,
    next_inspection_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on biogas_inspections
ALTER TABLE public.biogas_inspections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'biogas_inspections' AND policyname = 'Users can manage own farm biogas inspections'
    ) THEN
        CREATE POLICY "Users can manage own farm biogas inspections"
            ON public.biogas_inspections
            FOR ALL
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Updated_at trigger for biogas_inspections
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_biogas_inspections_modtime'
    ) THEN
        CREATE TRIGGER update_biogas_inspections_modtime
            BEFORE UPDATE ON public.biogas_inspections
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_biogas_inspections_user_date 
    ON public.biogas_inspections (user_id, inspection_date DESC);
