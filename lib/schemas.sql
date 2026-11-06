-- ============================================================================
-- PlyAqua — Complete Supabase PostgreSQL Database Schema
-- File: lib/schemas.sql
-- 
-- Description:
-- Production-ready PostgreSQL database schema definition for PlyAqua on Supabase.
-- Includes extensions, custom ENUM types, 23 application tables, foreign keys,
-- constraints, indexes, Row Level Security (RLS) policies, security helper
-- functions, trigger functions, permissions, and verification queries.
--
-- Designed to be copied and pasted directly into the Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CUSTOM ENUM TYPES
-- ============================================================================
-- Guarded creation of custom ENUM types to ensure repeatable execution.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE public.user_role_enum AS ENUM ('admin', 'partner');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'active_status_enum') THEN
        CREATE TYPE public.active_status_enum AS ENUM ('active', 'deactive');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bill_status_enum') THEN
        CREATE TYPE public.bill_status_enum AS ENUM ('pending', 'delivered', 'accepted');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type_enum') THEN
        CREATE TYPE public.transaction_type_enum AS ENUM ('add', 'sub');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
        CREATE TYPE public.payment_method_enum AS ENUM ('cash', 'upi', 'card', 'other', 'bill');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'points_trans_type') THEN
        CREATE TYPE public.points_trans_type AS ENUM ('add', 'delete');
    END IF;
END $$;

-- ============================================================================
-- 3. SECURE AUTHORIZATION HELPER FUNCTIONS
-- ============================================================================
-- Securely checks whether the currently authenticated user (auth.uid()) has
-- the 'admin' role in public.users.
--
-- Security Decisions:
-- - Uses SECURITY DEFINER so that it runs with the privileges of the creator
--   (postgres/admin), which bypasses RLS on public.users and avoids infinite
--   recursive loops during RLS policy evaluation.
-- - Sets search_path = public, auth to guard against search_path hijacking.
-- - Does NOT take a user-supplied user ID; evaluates only auth.uid().
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND role = 'admin'::public.user_role_enum
    );
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if auth.uid() belongs to an active administrator in public.users.';

-- ============================================================================
-- 4. BASE TABLES (No inter-application foreign key dependencies)
-- ============================================================================

-- 4.1 users
-- Stores application user profiles for admins and partners.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NULL,
    mobile TEXT NULL,
    role public.user_role_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.users IS 'Application user profiles linked to Supabase auth.users.';

-- 4.2 partner_categories
-- Categorization for partners.
CREATE TABLE IF NOT EXISTS public.partner_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    p_cat_id TEXT UNIQUE,
    name TEXT NOT NULL,
    status public.active_status_enum NOT NULL DEFAULT 'active'::public.active_status_enum,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.partner_categories IS 'Partner business categories.';

-- 4.3 sizes
-- Product packaging/container sizes.
CREATE TABLE IF NOT EXISTS public.sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.sizes IS 'Packaging sizes for products.';

-- 4.4 ad_content
-- Promotional ad media records.
CREATE TABLE IF NOT EXISTS public.ad_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    media_url TEXT NULL,
    status public.active_status_enum NOT NULL DEFAULT 'active'::public.active_status_enum,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ad_content IS 'Promotional advertising media and assets.';

-- 4.5 game_play_settings
-- System settings and game mode configurations stored in JSONB.
CREATE TABLE IF NOT EXISTS public.game_play_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.game_play_settings IS 'Game mode flags and game configuration key-value settings.';

-- 4.6 game_points
-- Point values and reward labels for game play.
CREATE TABLE IF NOT EXISTS public.game_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    values INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.game_points IS 'Available game point values and labels.';

-- 4.7 game_cashback
-- Cashback reward ranges.
CREATE TABLE IF NOT EXISTS public.game_cashback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    range_from NUMERIC(12,2) NOT NULL,
    range_to NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT game_cashback_range_check CHECK (range_from <= range_to)
);
COMMENT ON TABLE public.game_cashback IS 'Cashback ranges configurable for reward games.';

-- 4.8 game_words
-- Word puzzles / keywords for game play.
CREATE TABLE IF NOT EXISTS public.game_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    hints JSONB NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.game_words IS 'Word dictionary for word-based gameplay.';

-- 4.9 playcodes
-- Single-use or multi-use redemption codes for games.
CREATE TABLE IF NOT EXISTS public.playcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'unused',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.playcodes IS 'Game play redemption codes.';

-- 4.10 customers
-- End-consumer profiles and reward counters.
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mobile TEXT UNIQUE NOT NULL,
    available_points INTEGER NOT NULL DEFAULT 0,
    key TEXT UNIQUE NULL,
    total_points INTEGER NOT NULL DEFAULT 0,
    total_cashback NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.customers IS 'Customer accounts tracking accumulated points and cashback.';

-- ============================================================================
-- 5. DEPENDENT TABLES (Level 1 Dependencies)
-- ============================================================================

-- 5.1 partner_profile
-- Stores partner business information, point/credit balances.
CREATE TABLE IF NOT EXISTS public.partner_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id TEXT UNIQUE,
    address TEXT NULL,
    available_points INTEGER NOT NULL DEFAULT 0,
    credit_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    partner_category UUID NULL REFERENCES public.partner_categories(id) ON DELETE SET NULL,
    total_points INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.partner_profile IS 'Business profiles and point ledger summary for commercial partners.';

-- 5.2 products
-- Product catalog with pricing and stock.
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prod_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    size UUID NULL REFERENCES public.sizes(id) ON DELETE RESTRICT,
    mrp NUMERIC(12,2) NOT NULL,
    sp NUMERIC(12,2) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 0,
    status public.active_status_enum NOT NULL DEFAULT 'active'::public.active_status_enum,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.products IS 'Inventory catalog products with MRP and Selling Price.';

-- 5.3 campaigns
-- Marketing campaigns tied to promotional ad media.
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NULL,
    content_id UUID NULL REFERENCES public.ad_content(id) ON DELETE SET NULL,
    views BIGINT NOT NULL DEFAULT 0,
    status public.active_status_enum NOT NULL DEFAULT 'active'::public.active_status_enum,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.campaigns IS 'Promotional marketing campaigns.';

-- 5.4 sessions
-- Customer active/historical play sessions.
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.sessions IS 'Customer game and interaction sessions.';

-- ============================================================================
-- 6. DEPENDENT TABLES (Level 2 & 3 Dependencies)
-- ============================================================================

-- 6.1 bills
-- Invoices issued to partners.
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id TEXT UNIQUE NOT NULL,
    partner_id UUID NOT NULL REFERENCES public.partner_profile(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL,
    status public.bill_status_enum NOT NULL DEFAULT 'pending'::public.bill_status_enum,
    notes TEXT NULL,
    balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.bills IS 'Billing records generated for partners.';

-- 6.2 bill_items
-- Line items associated with partner bills.
CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    sp NUMERIC(12,2) NOT NULL,
    qty INTEGER NOT NULL,
    row_total NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.bill_items IS 'Line items belonging to bills.';

-- 6.3 partner_transactions
-- Financial transaction entries (add/sub) affecting partner balance.
CREATE TABLE IF NOT EXISTS public.partner_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.partner_profile(id) ON DELETE RESTRICT,
    type public.transaction_type_enum NOT NULL,
    bill_id UUID NULL REFERENCES public.bills(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    method public.payment_method_enum NOT NULL,
    notes TEXT NULL,
    balance NUMERIC(12,2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.partner_transactions IS 'Financial ledger transactions for partner payments and bills.';

-- 6.4 partner_points
-- Partner point transaction ledger.
CREATE TABLE IF NOT EXISTS public.partner_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.partner_profile(id) ON DELETE RESTRICT,
    type public.points_trans_type NOT NULL,
    points INTEGER NOT NULL,
    avl_points INTEGER NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.partner_points IS 'Partner loyalty points credit/debit transaction log.';

-- 6.5 partner_inventory
-- Warehouse/partner product stock inventory.
CREATE TABLE IF NOT EXISTS public.partner_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.partner_profile(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT partner_inventory_partner_product_unique UNIQUE (partner_id, product_id)
);
COMMENT ON TABLE public.partner_inventory IS 'Current product quantities allocated to each partner.';

-- 6.6 customer_points
-- Customer point transaction history (deferred foreign key session_id).
CREATE TABLE IF NOT EXISTS public.customer_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    points INTEGER NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    notes TEXT NULL,
    session_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.customer_points IS 'Ledger entries for customer points earned and spent.';

-- 6.7 customer_points_reqs
-- Point redemption requests submitted by customers.
CREATE TABLE IF NOT EXISTS public.customer_points_reqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    points INTEGER NOT NULL,
    notes TEXT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.customer_points_reqs IS 'Point redemption claims submitted by customers.';

-- 6.8 customer_cashback
-- Customer cashback claims and payouts (deferred foreign keys playcode & session_id).
CREATE TABLE IF NOT EXISTS public.customer_cashback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    mbl TEXT NULL,
    cashback_amnt NUMERIC(12,2) NOT NULL,
    upi_id TEXT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    playcode UUID NULL,
    session_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.customer_cashback IS 'Cashback requests and payout records for customers.';

-- 6.9 customer_plays (Table 23)
-- Grounded definition resolving customer play records connecting customers,
-- playcodes, and sessions as required by Section 4.23 & Section 7.5.
CREATE TABLE IF NOT EXISTS public.customer_plays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    playcode UUID NULL REFERENCES public.playcodes(id) ON DELETE SET NULL,
    session_id UUID NULL REFERENCES public.sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.customer_plays IS 'Gameplay activity records tracking sessions, customers, and playcodes.';

-- ============================================================================
-- 7. DEFERRED FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- Explicitly applied to satisfy creation-order requirements cleanly.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_customer_points_session'
    ) THEN
        ALTER TABLE public.customer_points
            ADD CONSTRAINT fk_customer_points_session
            FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_customer_cashback_playcode'
    ) THEN
        ALTER TABLE public.customer_cashback
            ADD CONSTRAINT fk_customer_cashback_playcode
            FOREIGN KEY (playcode) REFERENCES public.playcodes(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_customer_cashback_session'
    ) THEN
        ALTER TABLE public.customer_cashback
            ADD CONSTRAINT fk_customer_cashback_session
            FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 8. INDEXES
-- ============================================================================
-- Indexes to accelerate foreign key joins, RLS filtering, and frequent queries.

-- users
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- partner_categories
CREATE INDEX IF NOT EXISTS idx_partner_categories_p_cat_id ON public.partner_categories(p_cat_id);

-- partner_profile
CREATE INDEX IF NOT EXISTS idx_partner_profile_partner_id ON public.partner_profile(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_profile_category ON public.partner_profile(partner_category);

-- products
CREATE INDEX IF NOT EXISTS idx_products_size ON public.products(size);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- bills
CREATE INDEX IF NOT EXISTS idx_bills_partner_id ON public.bills(partner_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON public.bills(bill_date);

-- bill_items
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_product_id ON public.bill_items(product_id);

-- partner_transactions
CREATE INDEX IF NOT EXISTS idx_partner_transactions_partner_id ON public.partner_transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_transactions_bill_id ON public.partner_transactions(bill_id);

-- partner_points
CREATE INDEX IF NOT EXISTS idx_partner_points_partner_id ON public.partner_points(partner_id);

-- partner_inventory
CREATE INDEX IF NOT EXISTS idx_partner_inventory_partner_id ON public.partner_inventory(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_inventory_product_id ON public.partner_inventory(product_id);

-- customers
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);

-- sessions
CREATE INDEX IF NOT EXISTS idx_sessions_customer_id ON public.sessions(customer_id);

-- customer_points
CREATE INDEX IF NOT EXISTS idx_customer_points_customer_id ON public.customer_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_points_session_id ON public.customer_points(session_id);

-- customer_points_reqs
CREATE INDEX IF NOT EXISTS idx_customer_points_reqs_customer_id ON public.customer_points_reqs(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_points_reqs_status ON public.customer_points_reqs(status);

-- customer_cashback
CREATE INDEX IF NOT EXISTS idx_customer_cashback_customer_id ON public.customer_cashback(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_cashback_playcode ON public.customer_cashback(playcode);
CREATE INDEX IF NOT EXISTS idx_customer_cashback_session_id ON public.customer_cashback(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_cashback_status ON public.customer_cashback(status);

-- customer_plays
CREATE INDEX IF NOT EXISTS idx_customer_plays_customer_id ON public.customer_plays(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_plays_playcode ON public.customer_plays(playcode);
CREATE INDEX IF NOT EXISTS idx_customer_plays_session_id ON public.customer_plays(session_id);

-- campaigns & ad_content
CREATE INDEX IF NOT EXISTS idx_campaigns_content_id ON public.campaigns(content_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_content_status ON public.ad_content(status);

-- game_words
CREATE INDEX IF NOT EXISTS idx_game_words_status ON public.game_words(status);

-- ============================================================================
-- 9. ENABLE ROW LEVEL SECURITY (RLS) ON ALL 23 TABLES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_points_reqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_cashback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_play_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_cashback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_plays ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- All policies use the exact names specified in Section 7.
-- Idempotent setup: DROP POLICY IF EXISTS before creating each policy.

-- ----------------------------------------------------------------------------
-- 10.1 Users and Partner Management
-- ----------------------------------------------------------------------------

-- Table: users
DROP POLICY IF EXISTS "users_admin_select_all" ON public.users;
CREATE POLICY "users_admin_select_all"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "users_admin_insert" ON public.users;
CREATE POLICY "users_admin_insert"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "users_admin_update" ON public.users;
CREATE POLICY "users_admin_update"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "users_admin_delete" ON public.users;
CREATE POLICY "users_admin_delete"
    ON public.users
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Table: partner_profile
DROP POLICY IF EXISTS "partner_profile_admin_all" ON public.partner_profile;
CREATE POLICY "partner_profile_admin_all"
    ON public.partner_profile
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "partner_profile_partner_select_own" ON public.partner_profile;
CREATE POLICY "partner_profile_partner_select_own"
    ON public.partner_profile
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS "partner_profile_partner_update_own" ON public.partner_profile;
CREATE POLICY "partner_profile_partner_update_own"
    ON public.partner_profile
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Table: partner_categories
DROP POLICY IF EXISTS "partner_categories_admin_all" ON public.partner_categories;
CREATE POLICY "partner_categories_admin_all"
    ON public.partner_categories
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "partner_categories_authenticated_select" ON public.partner_categories;
CREATE POLICY "partner_categories_authenticated_select"
    ON public.partner_categories
    FOR SELECT
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 10.2 Products and Sizes
-- ----------------------------------------------------------------------------

-- Table: products
-- Public clients cannot access products directly; accessed via admin or server endpoints.
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all"
    ON public.products
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_authenticated_select" ON public.products;
CREATE POLICY "products_authenticated_select"
    ON public.products
    FOR SELECT
    TO authenticated
    USING (true);

-- Table: sizes
DROP POLICY IF EXISTS "sizes_admin_all" ON public.sizes;
CREATE POLICY "sizes_admin_all"
    ON public.sizes
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "sizes_authenticated_select" ON public.sizes;
CREATE POLICY "sizes_authenticated_select"
    ON public.sizes
    FOR SELECT
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 10.3 Bills and Bill Items
-- ----------------------------------------------------------------------------

-- Table: bills
DROP POLICY IF EXISTS "bills_admin_select_all" ON public.bills;
CREATE POLICY "bills_admin_select_all"
    ON public.bills
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "bills_admin_insert" ON public.bills;
CREATE POLICY "bills_admin_insert"
    ON public.bills
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bills_admin_update" ON public.bills;
CREATE POLICY "bills_admin_update"
    ON public.bills
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bills_admin_delete" ON public.bills;
CREATE POLICY "bills_admin_delete"
    ON public.bills
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "bills_partner_select_own" ON public.bills;
CREATE POLICY "bills_partner_select_own"
    ON public.bills
    FOR SELECT
    TO authenticated
    USING (partner_id = auth.uid());

DROP POLICY IF EXISTS "bills_partner_update_own" ON public.bills;
CREATE POLICY "bills_partner_update_own"
    ON public.bills
    FOR UPDATE
    TO authenticated
    USING (partner_id = auth.uid())
    WITH CHECK (partner_id = auth.uid());

-- Table: bill_items
DROP POLICY IF EXISTS "bill_items_admin_select_all" ON public.bill_items;
CREATE POLICY "bill_items_admin_select_all"
    ON public.bill_items
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "bill_items_admin_insert" ON public.bill_items;
CREATE POLICY "bill_items_admin_insert"
    ON public.bill_items
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bill_items_admin_update" ON public.bill_items;
CREATE POLICY "bill_items_admin_update"
    ON public.bill_items
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bill_items_admin_delete" ON public.bill_items;
CREATE POLICY "bill_items_admin_delete"
    ON public.bill_items
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "bill_items_partner_select_own" ON public.bill_items;
CREATE POLICY "bill_items_partner_select_own"
    ON public.bill_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bills
            WHERE bills.id = bill_items.bill_id
              AND bills.partner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "bill_items_partner_update_own" ON public.bill_items;
CREATE POLICY "bill_items_partner_update_own"
    ON public.bill_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bills
            WHERE bills.id = bill_items.bill_id
              AND bills.partner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bills
            WHERE bills.id = bill_items.bill_id
              AND bills.partner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- 10.4 Partner Transactions, Points, and Inventory
-- ----------------------------------------------------------------------------

-- Table: partner_transactions
DROP POLICY IF EXISTS "partner_transactions_admin_all" ON public.partner_transactions;
CREATE POLICY "partner_transactions_admin_all"
    ON public.partner_transactions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "partner_transactions_partner_select_own" ON public.partner_transactions;
CREATE POLICY "partner_transactions_partner_select_own"
    ON public.partner_transactions
    FOR SELECT
    TO authenticated
    USING (partner_id = auth.uid());

DROP POLICY IF EXISTS "partner_transactions_partner_insert_own" ON public.partner_transactions;
CREATE POLICY "partner_transactions_partner_insert_own"
    ON public.partner_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (partner_id = auth.uid());

-- Table: partner_points
DROP POLICY IF EXISTS "partner_points_admin_all" ON public.partner_points;
CREATE POLICY "partner_points_admin_all"
    ON public.partner_points
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "partner_points_partner_select_own" ON public.partner_points;
CREATE POLICY "partner_points_partner_select_own"
    ON public.partner_points
    FOR SELECT
    TO authenticated
    USING (partner_id = auth.uid());

DROP POLICY IF EXISTS "partner_points_partner_insert_own" ON public.partner_points;
CREATE POLICY "partner_points_partner_insert_own"
    ON public.partner_points
    FOR INSERT
    TO authenticated
    WITH CHECK (partner_id = auth.uid());

-- Table: partner_inventory
DROP POLICY IF EXISTS "partner_inventory_admin_all" ON public.partner_inventory;
CREATE POLICY "partner_inventory_admin_all"
    ON public.partner_inventory
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "partner_inventory_partner_select_own" ON public.partner_inventory;
CREATE POLICY "partner_inventory_partner_select_own"
    ON public.partner_inventory
    FOR SELECT
    TO authenticated
    USING (partner_id = auth.uid());

DROP POLICY IF EXISTS "partner_inventory_partner_insert_own" ON public.partner_inventory;
CREATE POLICY "partner_inventory_partner_insert_own"
    ON public.partner_inventory
    FOR INSERT
    TO authenticated
    WITH CHECK (partner_id = auth.uid());

DROP POLICY IF EXISTS "partner_inventory_partner_update_own" ON public.partner_inventory;
CREATE POLICY "partner_inventory_partner_update_own"
    ON public.partner_inventory
    FOR UPDATE
    TO authenticated
    USING (partner_id = auth.uid())
    WITH CHECK (partner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 10.5 Customers and Rewards
-- ----------------------------------------------------------------------------

-- Table: customers
DROP POLICY IF EXISTS "customers_admin_all" ON public.customers;
CREATE POLICY "customers_admin_all"
    ON public.customers
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "customers_public_select" ON public.customers;
CREATE POLICY "customers_public_select"
    ON public.customers
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "customers_public_insert" ON public.customers;
CREATE POLICY "customers_public_insert"
    ON public.customers
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "customers_public_update" ON public.customers;
CREATE POLICY "customers_public_update"
    ON public.customers
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Table: customer_points
DROP POLICY IF EXISTS "customer_points_admin_all" ON public.customer_points;
CREATE POLICY "customer_points_admin_all"
    ON public.customer_points
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "customer_points_public_insert" ON public.customer_points;
CREATE POLICY "customer_points_public_insert"
    ON public.customer_points
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "customer_points_public_select" ON public.customer_points;
CREATE POLICY "customer_points_public_select"
    ON public.customer_points
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Table: customer_points_reqs
DROP POLICY IF EXISTS "customer_points_reqs_admin_all" ON public.customer_points_reqs;
CREATE POLICY "customer_points_reqs_admin_all"
    ON public.customer_points_reqs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Table: customer_cashback
DROP POLICY IF EXISTS "customer_cashback_admin_all" ON public.customer_cashback;
CREATE POLICY "customer_cashback_admin_all"
    ON public.customer_cashback
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Table: customer_plays
DROP POLICY IF EXISTS "customer_plays_admin_all" ON public.customer_plays;
CREATE POLICY "customer_plays_admin_all"
    ON public.customer_plays
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "customer_plays_public_insert" ON public.customer_plays;
CREATE POLICY "customer_plays_public_insert"
    ON public.customer_plays
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "customer_plays_public_select" ON public.customer_plays;
CREATE POLICY "customer_plays_public_select"
    ON public.customer_plays
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Table: sessions
DROP POLICY IF EXISTS "sessions_admin_all" ON public.sessions;
CREATE POLICY "sessions_admin_all"
    ON public.sessions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "sessions_public_insert" ON public.sessions;
CREATE POLICY "sessions_public_insert"
    ON public.sessions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "sessions_public_select" ON public.sessions;
CREATE POLICY "sessions_public_select"
    ON public.sessions
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 10.6 Campaigns and Advertisements
-- ----------------------------------------------------------------------------

-- Table: ad_content
DROP POLICY IF EXISTS "ad_content_admin_all" ON public.ad_content;
CREATE POLICY "ad_content_admin_all"
    ON public.ad_content
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ad_content_public_select" ON public.ad_content;
CREATE POLICY "ad_content_public_select"
    ON public.ad_content
    FOR SELECT
    TO anon, authenticated
    USING (status = 'active'::public.active_status_enum);

-- Table: campaigns
DROP POLICY IF EXISTS "campaigns_admin_all" ON public.campaigns;
CREATE POLICY "campaigns_admin_all"
    ON public.campaigns
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "campaigns_public_select" ON public.campaigns;
CREATE POLICY "campaigns_public_select"
    ON public.campaigns
    FOR SELECT
    TO anon, authenticated
    USING (status = 'active'::public.active_status_enum);

-- ----------------------------------------------------------------------------
-- 10.7 Game Configuration
-- ----------------------------------------------------------------------------

-- Table: game_play_settings
DROP POLICY IF EXISTS "game_play_settings_admin_all" ON public.game_play_settings;
CREATE POLICY "game_play_settings_admin_all"
    ON public.game_play_settings
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "game_play_settings_public_select" ON public.game_play_settings;
CREATE POLICY "game_play_settings_public_select"
    ON public.game_play_settings
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Table: game_points
DROP POLICY IF EXISTS "game_points_admin_all" ON public.game_points;
CREATE POLICY "game_points_admin_all"
    ON public.game_points
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "game_points_public_select" ON public.game_points;
CREATE POLICY "game_points_public_select"
    ON public.game_points
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Table: game_cashback
DROP POLICY IF EXISTS "game_cashback_admin_all" ON public.game_cashback;
CREATE POLICY "game_cashback_admin_all"
    ON public.game_cashback
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "game_cashback_public_select" ON public.game_cashback;
CREATE POLICY "game_cashback_public_select"
    ON public.game_cashback
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Table: game_words
DROP POLICY IF EXISTS "game_words_admin_all" ON public.game_words;
CREATE POLICY "game_words_admin_all"
    ON public.game_words
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "game_words_public_select" ON public.game_words;
CREATE POLICY "game_words_public_select"
    ON public.game_words
    FOR SELECT
    TO anon, authenticated
    USING (status = 'active');

-- Table: playcodes
-- Public clients must not read playcodes; admin only.
DROP POLICY IF EXISTS "playcodes_admin_all" ON public.playcodes;
CREATE POLICY "playcodes_admin_all"
    ON public.playcodes
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 11. TRIGGER FUNCTIONS & TRIGGERS
-- ============================================================================

-- 11.1 Generic updated_at timestamp trigger function
-- Maintained for future schema extensions or tables having an updated_at column.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.set_updated_at() IS 'Reusable trigger function to update updated_at timestamp on record modification.';

-- 11.2 Optional Auth User Registration Profile Synchronization
-- Note per specification Section 9.2:
-- Included as a safe SECURITY DEFINER function to provision public.users profile
-- upon auth.users creation. Automatically defaults to 'partner' role to prevent
-- privilege escalation from client metadata.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.users (id, name, email, mobile, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.email,
        NEW.phone,
        'partner'::public.user_role_enum -- Forced default: partner. Admin role can only be assigned via trusted admin workflow.
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Safely creates a default partner profile in public.users when a new user signs up in auth.users.';

-- Trigger on auth.users:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- 12. MINIMAL REQUIRED GRANTS
-- ============================================================================

-- Schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Default sequence & table privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Authenticated application users (access further filtered by Row Level Security)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Anon role: granted SELECT on public promotional & gameplay configuration tables, plus customer gameplay
GRANT SELECT ON public.ad_content TO anon;
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT ON public.game_play_settings TO anon;
GRANT SELECT ON public.game_points TO anon;
GRANT SELECT ON public.game_cashback TO anon;
GRANT SELECT ON public.game_words TO anon;
GRANT SELECT, INSERT, UPDATE ON public.customers TO anon;
GRANT SELECT, INSERT ON public.sessions TO anon;
GRANT SELECT, INSERT ON public.customer_points TO anon;
GRANT SELECT, INSERT ON public.customer_plays TO anon;

-- Explicitly revoke all privileges from anon on all private admin/partner tables
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.partner_profile FROM anon;
REVOKE ALL ON public.partner_categories FROM anon;
REVOKE ALL ON public.sizes FROM anon;
REVOKE ALL ON public.products FROM anon;
REVOKE ALL ON public.bills FROM anon;
REVOKE ALL ON public.bill_items FROM anon;
REVOKE ALL ON public.partner_transactions FROM anon;
REVOKE ALL ON public.partner_points FROM anon;
REVOKE ALL ON public.customer_points_reqs FROM anon;
REVOKE ALL ON public.customer_cashback FROM anon;
REVOKE ALL ON public.partner_inventory FROM anon;
REVOKE ALL ON public.playcodes FROM anon;

-- Execute permissions on authorization helper
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ============================================================================
-- 13. OPTIONAL SEED DATA (COMMENTED OUT)
-- ============================================================================
-- Uncomment if initializing initial baseline game settings or default category:
/*
INSERT INTO public.game_play_settings (title, value)
VALUES 
    ('play_mode', '"points"'::jsonb),
    ('game_enabled', 'true'::jsonb),
    ('spin_enabled', 'true'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.sizes (value)
VALUES ('250ml'), ('500ml'), ('1000ml'), ('20L')
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- 14. VERIFICATION AND VALIDATION QUERIES
-- ============================================================================
-- Run these queries in the Supabase SQL editor to inspect the deployed schema.

/*
-- 1. Verify all 23 application tables exist in public schema:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verify all tables have Row Level Security enabled (all should show relrowsecurity = true):
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE pg_namespace.nspname = 'public' 
  AND pg_class.relkind = 'r'
ORDER BY relname;

-- 3. Verify all defined RLS policies:
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Verify custom ENUM types and their registered values:
SELECT t.typname AS enum_name, e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY enum_name, e.enumsortorder;

-- 5. Verify foreign key constraints and referenced tables:
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
   AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 6. Verify indexes on public tables:
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
*/

-- ============================================================================
-- END OF SCHEMA DEFINITION
-- ============================================================================