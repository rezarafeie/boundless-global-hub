-- Add HTML questionnaire toggle to tests table
ALTER TABLE public.tests 
ADD COLUMN use_html_questionnaire boolean NOT NULL DEFAULT false;