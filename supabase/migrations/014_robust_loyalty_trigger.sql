-- Migration 014: Robust Loyalty Trigger
-- This migration updates the loyalty trigger to be formatting-insensitive and support email matching against auth.users.

-- 1. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_loyalty_count ON public.pedidos;

-- 2. Create or replace the function with robust logic
CREATE OR REPLACE FUNCTION public.increment_loyalty_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_clean_new TEXT;
BEGIN
  -- We only act when the order is updated to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    v_user_id := NULL;

    -- Step 2.1: Try to match the user by email (most unique and robust)
    IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
      SELECT id INTO v_user_id
      FROM auth.users
      WHERE LOWER(email) = LOWER(NEW.customer_email)
      LIMIT 1;
    END IF;

    -- Step 2.2: If user found by email, update their loyalty count directly by ID
    IF v_user_id IS NOT NULL THEN
      UPDATE public.profiles
      SET loyalty_count = COALESCE(loyalty_count, 0) + 1,
          updated_at = NOW()
      WHERE id = v_user_id;
      
    -- Step 2.3: If not matched by email, fallback to format-insensitive phone matching
    ELSIF NEW.customer_phone IS NOT NULL AND NEW.customer_phone != '' THEN
      -- Clean all non-digit characters from the order's phone number
      v_clean_new := regexp_replace(NEW.customer_phone, '\D', '', 'g');
      
      -- Match the last 9 digits of the cleaned phone numbers (handles country codes like +34)
      IF length(v_clean_new) >= 9 THEN
        UPDATE public.profiles
        SET loyalty_count = COALESCE(loyalty_count, 0) + 1,
            updated_at = NOW()
        WHERE length(regexp_replace(phone, '\D', '', 'g')) >= 9
          AND right(regexp_replace(phone, '\D', '', 'g'), 9) = right(v_clean_new, 9);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the trigger on pedidos table
CREATE TRIGGER trigger_loyalty_count
AFTER UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.increment_loyalty_on_completion();
