
-- Add the new CRM note type 'consultation' and update the status options
-- First, let's check if we need to add the consultation type to any enum or just use it as text
-- Also update the default status options

-- Update crm_notes table to ensure it supports the new consultation type and status options
-- The type and status are already text fields, so no schema changes needed for those

-- Add course_id to crm_notes if it doesn't exist (it should already exist based on the schema)
-- This is already present in the schema, so no changes needed

-- Let's add an index for better performance when filtering by course and status
CREATE INDEX IF NOT EXISTS idx_crm_notes_course_status ON crm_notes(course_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_notes_type_created_at ON crm_notes(type, created_at DESC);
