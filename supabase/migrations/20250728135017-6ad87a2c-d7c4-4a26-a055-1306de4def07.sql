-- First, add the sales_manager role to the enum
ALTER TYPE academy_user_role ADD VALUE IF NOT EXISTS 'sales_manager';