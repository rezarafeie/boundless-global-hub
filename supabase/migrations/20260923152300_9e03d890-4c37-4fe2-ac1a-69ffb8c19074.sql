CREATE UNIQUE INDEX IF NOT EXISTS webinar_support_activations_webinar_bale_key
  ON public.webinar_support_activations (webinar_id, bale_chat_id)
  WHERE bale_chat_id IS NOT NULL;