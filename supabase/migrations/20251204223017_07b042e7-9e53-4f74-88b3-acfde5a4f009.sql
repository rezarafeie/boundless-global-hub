-- Create function to auto-sync paid enrollments to invoices
CREATE OR REPLACE FUNCTION public.sync_enrollment_to_invoice()
RETURNS TRIGGER AS $$
DECLARE
  new_invoice_id UUID;
  new_invoice_number TEXT;
  customer_id INTEGER;
  course_title TEXT;
BEGIN
  -- Only process when payment becomes completed/success
  IF (NEW.payment_status IN ('completed', 'success') AND 
      (OLD IS NULL OR OLD.payment_status NOT IN ('completed', 'success'))) THEN
    
    -- Get or create customer from chat_users
    SELECT id INTO customer_id FROM public.chat_users WHERE phone = NEW.phone LIMIT 1;
    
    -- If no customer found, skip (shouldn't happen normally)
    IF customer_id IS NULL THEN
      RAISE NOTICE 'No customer found for phone: %', NEW.phone;
      RETURN NEW;
    END IF;
    
    -- Check if invoice already exists for this enrollment
    IF EXISTS (SELECT 1 FROM public.invoices WHERE enrollment_id = NEW.id) THEN
      RAISE NOTICE 'Invoice already exists for enrollment: %', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Get course title
    SELECT title INTO course_title FROM public.courses WHERE id = NEW.course_id;
    
    -- Create invoice
    INSERT INTO public.invoices (
      customer_id,
      enrollment_id,
      total_amount,
      paid_amount,
      status,
      payment_type,
      notes
    ) VALUES (
      customer_id,
      NEW.id,
      NEW.payment_amount,
      NEW.payment_amount,
      'paid',
      COALESCE(NEW.payment_method, 'online'),
      'ایجاد خودکار از ثبت‌نام'
    ) RETURNING id INTO new_invoice_id;
    
    -- Create invoice item
    INSERT INTO public.invoice_items (
      invoice_id,
      course_id,
      description,
      unit_price,
      total_price
    ) VALUES (
      new_invoice_id,
      NEW.course_id,
      COALESCE(course_title, 'دوره آموزشی'),
      NEW.payment_amount,
      NEW.payment_amount
    );
    
    RAISE NOTICE 'Created invoice % for enrollment %', new_invoice_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on enrollments table
DROP TRIGGER IF EXISTS sync_enrollment_to_invoice_trigger ON public.enrollments;
CREATE TRIGGER sync_enrollment_to_invoice_trigger
  AFTER INSERT OR UPDATE OF payment_status ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_enrollment_to_invoice();

-- Create payment_records table if not exists
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'card_to_card',
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reference_number TEXT,
  notes TEXT,
  recorded_by INTEGER REFERENCES public.chat_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_records
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_records
DROP POLICY IF EXISTS "Anyone can view payment records" ON public.payment_records;
CREATE POLICY "Anyone can view payment records" ON public.payment_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can manage payment records" ON public.payment_records;
CREATE POLICY "Anyone can manage payment records" ON public.payment_records FOR ALL USING (true) WITH CHECK (true);

-- Create report_ai_analysis table for AI weekly reports
CREATE TABLE IF NOT EXISTS public.report_ai_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL DEFAULT 'weekly',
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  analysis_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT,
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_ai_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Anyone can view report analysis" ON public.report_ai_analysis;
CREATE POLICY "Anyone can view report analysis" ON public.report_ai_analysis FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can manage report analysis" ON public.report_ai_analysis;
CREATE POLICY "Anyone can manage report analysis" ON public.report_ai_analysis FOR ALL USING (true) WITH CHECK (true);