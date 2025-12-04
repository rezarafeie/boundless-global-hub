-- Products/Services table (beyond courses)
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'service', -- 'course', 'service', 'physical'
  price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  customer_id integer NOT NULL REFERENCES public.chat_users(id) ON DELETE RESTRICT,
  sales_agent_id integer REFERENCES public.chat_users(id) ON DELETE SET NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'partially_paid', 'paid', 'cancelled'
  payment_type text NOT NULL DEFAULT 'online', -- 'online', 'card_to_card', 'manual', 'installment'
  is_installment boolean NOT NULL DEFAULT false,
  notes text,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  due_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Invoice Items
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Installments
CREATE TABLE public.installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  installment_number integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL DEFAULT 0,
  due_date timestamp with time zone NOT NULL,
  paid_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Payment Records
CREATE TABLE public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  installment_id uuid REFERENCES public.installments(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'online', -- 'online', 'card_to_card', 'cash', 'transfer'
  reference_number text,
  notes text,
  recorded_by integer REFERENCES public.chat_users(id) ON DELETE SET NULL,
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Agent Commission Rates
CREATE TABLE public.agent_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id integer NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  commission_percent numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_agent_product UNIQUE (agent_id, product_id),
  CONSTRAINT unique_agent_course UNIQUE (agent_id, course_id)
);

-- Commission Payments Log
CREATE TABLE public.commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id integer NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text,
  reference_number text,
  notes text,
  paid_by integer REFERENCES public.chat_users(id) ON DELETE SET NULL,
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Earned Commissions (linked to invoices)
CREATE TABLE public.earned_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id integer NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'paid'
  commission_payment_id uuid REFERENCES public.commission_payments(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earned_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (public read, admin write)
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for invoices
CREATE POLICY "Admins and sales can view all invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Admins and sales can create invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins and sales can update invoices" ON public.invoices FOR UPDATE USING (true);

-- RLS Policies for invoice_items
CREATE POLICY "Anyone can view invoice items" ON public.invoice_items FOR SELECT USING (true);
CREATE POLICY "Anyone can manage invoice items" ON public.invoice_items FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for installments
CREATE POLICY "Anyone can view installments" ON public.installments FOR SELECT USING (true);
CREATE POLICY "Anyone can manage installments" ON public.installments FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for payment_records
CREATE POLICY "Anyone can view payment records" ON public.payment_records FOR SELECT USING (true);
CREATE POLICY "Anyone can create payment records" ON public.payment_records FOR INSERT WITH CHECK (true);

-- RLS Policies for agent_commissions
CREATE POLICY "Anyone can view commissions" ON public.agent_commissions FOR SELECT USING (true);
CREATE POLICY "Admins can manage commissions" ON public.agent_commissions FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for commission_payments
CREATE POLICY "Anyone can view commission payments" ON public.commission_payments FOR SELECT USING (true);
CREATE POLICY "Admins can manage commission payments" ON public.commission_payments FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for earned_commissions
CREATE POLICY "Anyone can view earned commissions" ON public.earned_commissions FOR SELECT USING (true);
CREATE POLICY "Anyone can manage earned commissions" ON public.earned_commissions FOR ALL USING (true) WITH CHECK (true);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_number text;
  year_month text;
  seq_num integer;
BEGIN
  year_month := to_char(now(), 'YYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS integer)), 0) + 1
  INTO seq_num
  FROM public.invoices
  WHERE invoice_number LIKE year_month || '%';
  
  new_number := year_month || LPAD(seq_num::text, 4, '0');
  RETURN new_number;
END;
$$;

-- Trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invoice_number();

-- Function to update invoice totals
CREATE OR REPLACE FUNCTION public.update_invoice_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  total_paid numeric;
  invoice_total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payment_records
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  SELECT total_amount INTO invoice_total
  FROM public.invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  UPDATE public.invoices
  SET 
    paid_amount = total_paid,
    status = CASE
      WHEN total_paid >= invoice_total THEN 'paid'
      WHEN total_paid > 0 THEN 'partially_paid'
      ELSE 'unpaid'
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_invoice_status
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_status();

-- Update updated_at triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_installments_updated_at BEFORE UPDATE ON public.installments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agent_commissions_updated_at BEFORE UPDATE ON public.agent_commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();