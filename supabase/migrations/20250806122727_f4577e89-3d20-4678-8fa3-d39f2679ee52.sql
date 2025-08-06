-- Add title column to short_links table for redirect display
ALTER TABLE public.short_links ADD COLUMN title TEXT;