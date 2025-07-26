-- Remove duplicate webhook trigger to prevent double webhook sends
DROP TRIGGER IF EXISTS send_webhook_on_messenger_message ON public.messenger_messages;