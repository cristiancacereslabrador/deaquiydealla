-- Migration 006: Catalog Management (Prices + New Dishes + Image Storage)
-- Allows admins to override prices and add new dishes via the admin panel.

-- ─── 1. Price Overrides ──────────────────────────────────────────────────────
-- Stores price overrides for static dishes defined in src/data/dishes.ts
-- A row here takes precedence over the hardcoded priceCents value.
CREATE TABLE IF NOT EXISTS public.dish_price_overrides (
  dish_id       TEXT        PRIMARY KEY,  -- matches Dish.id from src/data/dishes.ts
  price_cents   INTEGER     NOT NULL CHECK (price_cents >= 0),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dish_price_overrides ENABLE ROW LEVEL SECURITY;

-- Admins (and service role) can do everything; anonymous can only read.
CREATE POLICY "Public read dish_price_overrides"
  ON public.dish_price_overrides FOR SELECT USING (true);

CREATE POLICY "Authenticated upsert dish_price_overrides"
  ON public.dish_price_overrides FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- ─── 2. Custom Dishes ────────────────────────────────────────────────────────
-- Platos añadidos desde el panel de administración.
-- Complementan (no reemplazan) el catálogo estático de src/data/dishes.ts.
CREATE TABLE IF NOT EXISTS public.custom_dishes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT        UNIQUE NOT NULL,          -- URL-friendly identifier
  category      TEXT        NOT NULL,
  name_es       TEXT        NOT NULL,
  name_en       TEXT        NOT NULL DEFAULT '',
  description_es TEXT       NOT NULL DEFAULT '',
  description_en TEXT       NOT NULL DEFAULT '',
  price_cents   INTEGER     NOT NULL CHECK (price_cents >= 0),
  image_path    TEXT        NOT NULL DEFAULT '',      -- Supabase Storage path
  allergens     TEXT[]      NOT NULL DEFAULT '{}',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ                           -- soft delete
);

ALTER TABLE public.custom_dishes ENABLE ROW LEVEL SECURITY;

-- Public read (only active, non-deleted dishes)
CREATE POLICY "Public read custom_dishes"
  ON public.custom_dishes FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

-- Authenticated write
CREATE POLICY "Authenticated all custom_dishes"
  ON public.custom_dishes FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_custom_dishes_updated_at
  BEFORE UPDATE ON public.custom_dishes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 3. Storage Bucket for Dish Images ───────────────────────────────────────
-- Create a public bucket 'dish-images' if it does not exist yet.
-- Execute manually in Supabase Dashboard → Storage if this script runs outside migrations:
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('dish-images', 'dish-images', true)
--   ON CONFLICT (id) DO NOTHING;
--
-- Storage policies (run in SQL Editor):
--   CREATE POLICY "Public read dish-images"
--     ON storage.objects FOR SELECT USING (bucket_id = 'dish-images');
--
--   CREATE POLICY "Authenticated upload dish-images"
--     ON storage.objects FOR INSERT
--     WITH CHECK (bucket_id = 'dish-images' AND auth.role() = 'authenticated');
--
--   CREATE POLICY "Authenticated delete dish-images"
--     ON storage.objects FOR DELETE
--     USING (bucket_id = 'dish-images' AND auth.role() = 'authenticated');
