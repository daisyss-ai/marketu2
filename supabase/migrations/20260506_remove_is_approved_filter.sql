-- Update is_approved default to true and update existing products
-- Since moderation system is not yet implemented, products should be available immediately

ALTER TABLE public.products ALTER COLUMN is_approved SET DEFAULT true;

UPDATE public.products SET is_approved = true WHERE is_approved = false;
