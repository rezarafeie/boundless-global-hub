-- Create pipelines table
CREATE TABLE public.pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_course_ids UUID[] DEFAULT '{}',
  assigned_sales_agent_ids INTEGER[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER REFERENCES public.chat_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pipeline_stages table
CREATE TABLE public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add pipeline columns to deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id),
ADD COLUMN IF NOT EXISTS current_stage_id UUID REFERENCES public.pipeline_stages(id),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create deal_stage_history for tracking stage transitions
CREATE TABLE public.deal_stage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES public.pipeline_stages(id),
  to_stage_id UUID REFERENCES public.pipeline_stages(id),
  changed_by INTEGER REFERENCES public.chat_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_stage_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pipelines
CREATE POLICY "Anyone can view pipelines" ON public.pipelines FOR SELECT USING (true);
CREATE POLICY "Admins can manage pipelines" ON public.pipelines FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for pipeline_stages
CREATE POLICY "Anyone can view pipeline stages" ON public.pipeline_stages FOR SELECT USING (true);
CREATE POLICY "Admins can manage pipeline stages" ON public.pipeline_stages FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for deal_stage_history
CREATE POLICY "Anyone can view deal stage history" ON public.deal_stage_history FOR SELECT USING (true);
CREATE POLICY "Anyone can insert deal stage history" ON public.deal_stage_history FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_pipeline_stages_pipeline_id ON public.pipeline_stages(pipeline_id);
CREATE INDEX idx_deals_pipeline_id ON public.deals(pipeline_id);
CREATE INDEX idx_deals_current_stage_id ON public.deals(current_stage_id);
CREATE INDEX idx_deal_stage_history_deal_id ON public.deal_stage_history(deal_id);

-- Trigger for updated_at
CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON public.pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at
  BEFORE UPDATE ON public.pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();