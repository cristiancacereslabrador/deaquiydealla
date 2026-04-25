-- Migration 003: extend pedidos status to include accepted & completed states
ALTER TABLE public.pedidos 
  DROP CONSTRAINT IF EXISTS pedidos_status_check;

ALTER TABLE public.pedidos 
  ADD CONSTRAINT pedidos_status_check 
  CHECK (status IN ('pending', 'accepted', 'ready', 'completed'));
