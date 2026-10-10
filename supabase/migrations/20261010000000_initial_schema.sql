-- ==============================================================================
-- Momin Agro (মোমিন এগ্রো) — Smart Dairy & Biogas Management System
-- Migration: 20261010000000_initial_schema.sql
-- Description: Core schema, multitenant isolation, indexes, and Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Farm Profiles (Farm Settings & Ownership)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farm_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL DEFAULT 'মোমিন এগ্রো',
    owner_name TEXT NOT NULL DEFAULT 'মো: মোমিনুল হক (আব্বু)',
    phone TEXT DEFAULT '০১৭XXXXXXXX',
    address TEXT DEFAULT 'খামার প্রাঙ্গণ',
    default_milk_rate NUMERIC(10, 2) NOT NULL DEFAULT 80.00 CHECK (default_milk_rate > 0),
    dairy_capacity INTEGER NOT NULL DEFAULT 10 CHECK (dairy_capacity > 0),
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_farm_profile UNIQUE (user_id)
);

-- ------------------------------------------------------------------------------
-- 2. Cows (গরুর তালিকা ও প্রোফাইল)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farm_profiles(id) ON DELETE CASCADE,
    tag_number TEXT NOT NULL,
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    age_years NUMERIC(4, 1) NOT NULL DEFAULT 3.0 CHECK (age_years >= 0),
    date_of_birth DATE,
    status TEXT NOT NULL CHECK (status IN ('milking', 'pregnant', 'dry', 'calf', 'sick')) DEFAULT 'milking',
    status_label_bn TEXT NOT NULL DEFAULT 'দুধাল গাভী',
    daily_avg_milk_liters NUMERIC(6, 2) NOT NULL DEFAULT 0.00 CHECK (daily_avg_milk_liters >= 0),
    last_milking_liters NUMERIC(6, 2) NOT NULL DEFAULT 0.00 CHECK (last_milking_liters >= 0),
    last_vaccinated_date DATE,
    expected_calving_date DATE,
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_cow_tag UNIQUE (user_id, tag_number)
);

-- ------------------------------------------------------------------------------
-- 3. Milk Records (দুধের হিসাব)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.milk_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farm_profiles(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cow_id UUID REFERENCES public.cows(id) ON DELETE SET NULL,
    cow_name TEXT,
    session TEXT NOT NULL CHECK (session IN ('morning', 'evening', 'full_day')) DEFAULT 'full_day',
    morning_liters NUMERIC(6, 2) NOT NULL DEFAULT 0.00 CHECK (morning_liters >= 0),
    evening_liters NUMERIC(6, 2) NOT NULL DEFAULT 0.00 CHECK (evening_liters >= 0),
    total_liters NUMERIC(6, 2) NOT NULL CHECK (total_liters >= 0),
    price_per_liter NUMERIC(10, 2) NOT NULL DEFAULT 80.00 CHECK (price_per_liter > 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    recorded_by TEXT NOT NULL DEFAULT 'মো: রহিম উদ্দিন',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. Financial Transactions (আয় ও ব্যয়)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farm_profiles(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    category_label_bn TEXT NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bkash', 'bank')) DEFAULT 'cash',
    related_milk_record_id UUID REFERENCES public.milk_records(id) ON DELETE SET NULL,
    recorded_by TEXT NOT NULL DEFAULT 'আব্বু (খামার মালিক)',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. Employees (কর্মচারী ও দায়িত্ব)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farm_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    phone TEXT,
    monthly_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_salary >= 0),
    active_status TEXT NOT NULL CHECK (active_status IN ('active', 'on_leave', 'inactive')) DEFAULT 'active',
    assigned_duties TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    joining_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. Tasks and Reminders (কাজ ও স্বাস্থ্য অনুস্মারক)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farm_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    priority_bn TEXT NOT NULL DEFAULT 'মাঝারি',
    category TEXT NOT NULL DEFAULT 'other',
    assigned_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    assigned_to TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 7. Biogas Daily Logs (বায়োগ্যাস প্ল্যান্ট লগ)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.biogas_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farm_profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    dung_quantity_kg NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (dung_quantity_kg >= 0),
    water_quantity_liters NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (water_quantity_liters >= 0),
    gas_pressure_psi NUMERIC(5, 2) NOT NULL DEFAULT 2.00 CHECK (gas_pressure_psi >= 0),
    burn_duration_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (burn_duration_hours >= 0),
    slurry_quantity_bags INTEGER NOT NULL DEFAULT 0 CHECK (slurry_quantity_bags >= 0),
    status TEXT NOT NULL DEFAULT 'optimal',
    status_bn TEXT NOT NULL DEFAULT 'চমৎকার কার্যক্ষম',
    maintenance_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_farm_profiles_user_id ON public.farm_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_cows_user_id ON public.cows(user_id);
CREATE INDEX IF NOT EXISTS idx_cows_status ON public.cows(user_id, status);
CREATE INDEX IF NOT EXISTS idx_milk_records_user_date ON public.milk_records(user_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_milk_records_cow ON public.milk_records(user_id, cow_id);
CREATE INDEX IF NOT EXISTS idx_financial_user_date ON public.financial_transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_type ON public.financial_transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id, active_status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON public.tasks(user_id, completed, due_date ASC);
CREATE INDEX IF NOT EXISTS idx_biogas_user_date ON public.biogas_logs(user_id, log_date DESC);

-- ------------------------------------------------------------------------------
-- 9. Row Level Security (RLS) Enablement
-- ------------------------------------------------------------------------------
ALTER TABLE public.farm_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biogas_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 10. Row Level Security (RLS) Strict Isolation Policies
-- Rule: Authenticated users can ONLY SELECT, INSERT, UPDATE, DELETE records matching auth.uid()
-- ------------------------------------------------------------------------------

-- Policies for farm_profiles
CREATE POLICY "Users can view their own farm profile"
    ON public.farm_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own farm profile"
    ON public.farm_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farm profile"
    ON public.farm_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farm profile"
    ON public.farm_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for cows
CREATE POLICY "Users can view their own cows"
    ON public.cows FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cows"
    ON public.cows FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cows"
    ON public.cows FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cows"
    ON public.cows FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for milk_records
CREATE POLICY "Users can view their own milk records"
    ON public.milk_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milk records"
    ON public.milk_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milk records"
    ON public.milk_records FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milk records"
    ON public.milk_records FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for financial_transactions
CREATE POLICY "Users can view their own financial transactions"
    ON public.financial_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial transactions"
    ON public.financial_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial transactions"
    ON public.financial_transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial transactions"
    ON public.financial_transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for employees
CREATE POLICY "Users can view their own employees"
    ON public.employees FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own employees"
    ON public.employees FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees"
    ON public.employees FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employees"
    ON public.employees FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for tasks
CREATE POLICY "Users can view their own tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for biogas_logs
CREATE POLICY "Users can view their own biogas logs"
    ON public.biogas_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biogas logs"
    ON public.biogas_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own biogas logs"
    ON public.biogas_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own biogas logs"
    ON public.biogas_logs FOR DELETE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 11. Automatic Updated At Timestamp Trigger Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_farm_profiles_modtime
    BEFORE UPDATE ON public.farm_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_cows_modtime
    BEFORE UPDATE ON public.cows
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_employees_modtime
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tasks_modtime
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
