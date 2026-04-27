-- Migration 007: Improved Inventory Precision and Units
-- Allows storing fractional cents for ingredient costs and updates the unit check.

-- 1. Change cost_per_unit_cents to NUMERIC to allow sub-cent precision (important for grams/ml)
ALTER TABLE public.ingredients 
ALTER COLUMN cost_per_unit_cents TYPE NUMERIC;

-- 2. Update the unit check to allow more common commercial units if needed 
-- (Though keeping g/ml/uds as base is better for recipe calculations)
-- We will keep the base as g/ml/uds but the UI will handle the Kg/L conversions.
