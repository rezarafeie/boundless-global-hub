ALTER TABLE public.support_activations ADD CONSTRAINT support_activations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.chat_users(id) ON DELETE CASCADE;
NOTIFY pgrst, 'reload schema';