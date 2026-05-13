-- Migration 012: Loyalty System and Smart Stock
-- 1. Add loyalty_count to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loyalty_count INTEGER DEFAULT 0;

-- 2. Trigger to increment loyalty count when an order is completed
CREATE OR REPLACE FUNCTION public.increment_loyalty_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- We assume customer_email maps to profiles.email
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.customer_email IS NOT NULL THEN
    UPDATE public.profiles
    SET loyalty_count = loyalty_count + 1,
        updated_at = NOW()
    WHERE email = NEW.customer_email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_loyalty_count ON public.pedidos;
CREATE TRIGGER trigger_loyalty_count
AFTER UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.increment_loyalty_on_completion();

-- 3. Trigger to auto-disable dishes based on ingredient stock
-- This function checks if a dish has enough ingredients for at least 1 unit
CREATE OR REPLACE FUNCTION public.check_dish_availability_on_stock_change()
RETURNS TRIGGER AS $$
DECLARE
  v_dish_id TEXT;
  v_is_available BOOLEAN;
BEGIN
  -- For each dish that uses the modified ingredient
  FOR v_dish_id IN 
    SELECT dish_id FROM public.dish_ingredients WHERE ingredient_id = NEW.id
  LOOP
    -- A dish is available if ALL its ingredients have enough stock for 1 unit
    SELECT NOT EXISTS (
      SELECT 1 
      FROM public.dish_ingredients di
      JOIN public.ingredients i ON di.ingredient_id = i.id
      WHERE di.dish_id = v_dish_id
        AND i.stock_quantity < di.quantity_required
    ) INTO v_is_available;

    -- Update dish_status
    INSERT INTO public.dish_status (dish_id, is_available, updated_at)
    VALUES (v_dish_id, v_is_available, NOW())
    ON CONFLICT (dish_id) DO UPDATE 
    SET is_available = v_is_available,
        updated_at = NOW();
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_availability ON public.ingredients;
CREATE TRIGGER trigger_check_availability
AFTER UPDATE OF stock_quantity ON public.ingredients
FOR EACH ROW
EXECUTE FUNCTION public.check_dish_availability_on_stock_change();
