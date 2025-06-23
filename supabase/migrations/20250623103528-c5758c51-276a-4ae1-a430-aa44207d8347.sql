
-- Create support_rooms table for dynamic room configuration
CREATE TABLE public.support_rooms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'headphones',
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  thread_type_id INTEGER REFERENCES public.support_thread_types(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by INTEGER REFERENCES public.chat_users(id)
);

-- Create support_room_permissions table for role-based access
CREATE TABLE public.support_room_permissions (
  id SERIAL PRIMARY KEY,
  support_room_id INTEGER REFERENCES public.support_rooms(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL, -- 'all', 'approved', 'boundless', 'admin', 'custom_role_name'
  can_access BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create support_room_agents table for agent assignments
CREATE TABLE public.support_room_agents (
  id SERIAL PRIMARY KEY,
  support_room_id INTEGER REFERENCES public.support_rooms(id) ON DELETE CASCADE,
  agent_id INTEGER REFERENCES public.chat_users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by INTEGER REFERENCES public.chat_users(id),
  UNIQUE(support_room_id, agent_id)
);

-- Create user_roles table for custom role management
CREATE TABLE public.user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.chat_users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by INTEGER REFERENCES public.chat_users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_name)
);

-- Add support_room_id to support_conversations
ALTER TABLE public.support_conversations 
ADD COLUMN support_room_id INTEGER REFERENCES public.support_rooms(id);

-- Insert default support rooms
INSERT INTO public.support_rooms (name, description, icon, is_default, thread_type_id) VALUES
('پشتیبانی عمومی', 'پشتیبانی عمومی برای همه کاربران', 'headphones', true, 1),
('پشتیبانی بدون مرز', 'پشتیبانی ویژه اعضای بدون مرز', 'crown', false, 2);

-- Set default permissions for support rooms
INSERT INTO public.support_room_permissions (support_room_id, user_role, can_access) VALUES
(1, 'approved', true),
(1, 'boundless', true),
(2, 'boundless', true);

-- Create function to get user accessible support rooms
CREATE OR REPLACE FUNCTION public.get_user_support_rooms(user_id_param INTEGER)
RETURNS TABLE(
  id INTEGER,
  name TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  thread_type_id INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    sr.id,
    sr.name,
    sr.description,
    sr.icon,
    sr.color,
    sr.thread_type_id
  FROM public.support_rooms sr
  JOIN public.support_room_permissions srp ON sr.id = srp.support_room_id
  LEFT JOIN public.chat_users cu ON cu.id = user_id_param
  LEFT JOIN public.user_roles ur ON ur.user_id = user_id_param AND ur.is_active = true
  WHERE sr.is_active = true
    AND srp.can_access = true
    AND (
      srp.user_role = 'all' OR
      (srp.user_role = 'approved' AND cu.is_approved = true) OR
      (srp.user_role = 'boundless' AND cu.bedoun_marz = true) OR
      (srp.user_role = 'admin' AND cu.is_messenger_admin = true) OR
      (srp.user_role = ur.role_name)
    )
  ORDER BY sr.id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create function to get support room agents
CREATE OR REPLACE FUNCTION public.get_support_room_agents(room_id_param INTEGER)
RETURNS TABLE(
  agent_id INTEGER,
  agent_name TEXT,
  agent_phone TEXT,
  is_active BOOLEAN,
  conversation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cu.id,
    cu.name,
    cu.phone,
    sra.is_active,
    COALESCE(conv_count.count, 0) as conversation_count
  FROM public.support_room_agents sra
  JOIN public.chat_users cu ON cu.id = sra.agent_id
  LEFT JOIN (
    SELECT agent_id, COUNT(*) as count
    FROM public.support_conversations sc
    WHERE sc.support_room_id = room_id_param
      AND sc.status IN ('open', 'assigned')
    GROUP BY agent_id
  ) conv_count ON conv_count.agent_id = sra.agent_id
  WHERE sra.support_room_id = room_id_param
    AND sra.is_active = true
  ORDER BY conversation_count ASC, cu.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
