-- Migration 004: Inventory System and Food Cost

-- 1. Table: ingredients
CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('g', 'ml', 'uds')),
  cost_per_unit_cents INTEGER NOT NULL DEFAULT 0,
  stock_quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: dish_ingredients (Recetas)
CREATE TABLE public.dish_ingredients (
  dish_id TEXT NOT NULL, -- Refers to the hardcoded ID in src/data/dishes.ts
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_required NUMERIC NOT NULL CHECK (quantity_required > 0),
  PRIMARY KEY (dish_id, ingredient_id)
);

-- 3. Automatic stock deduction trigger
CREATE OR REPLACE FUNCTION public.deduct_stock_on_order_accepted()
RETURNS TRIGGER AS $$
DECLARE
  order_line JSONB;
  dish_id_val TEXT;
  qty_ordered NUMERIC;
  di RECORD;
BEGIN
  -- Only trigger when status changes to 'accepted' (meaning it enters the kitchen)
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Loop through order lines
    FOR order_line IN SELECT * FROM jsonb_array_elements(NEW.lines)
    LOOP
      dish_id_val := order_line->>'dishId';
      qty_ordered := (order_line->>'quantity')::NUMERIC;
      
      -- Loop through ingredients required for this dish
      FOR di IN SELECT ingredient_id, quantity_required FROM public.dish_ingredients WHERE dish_id = dish_id_val
      LOOP
        -- Deduct stock directly
        UPDATE public.ingredients
        SET stock_quantity = stock_quantity - (di.quantity_required * qty_ordered),
            updated_at = NOW()
        WHERE id = di.ingredient_id;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deduct_stock
AFTER UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.deduct_stock_on_order_accepted();

-- 4. Enable RLS and setup simple open policies for Admin app
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on ingredients" ON public.ingredients FOR ALL USING (true);
CREATE POLICY "Allow all operations on dish_ingredients" ON public.dish_ingredients FOR ALL USING (true);
