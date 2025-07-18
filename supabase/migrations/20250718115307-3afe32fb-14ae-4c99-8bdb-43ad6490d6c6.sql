-- Test webhook call directly with sample data
DO $$
DECLARE
  http_response RECORD;
BEGIN
  SELECT * INTO http_response FROM http_post(
    'https://hook.us1.make.com/0hc8v2f528r9ieyefwhu8g9ta8l4r1bk',
    'message_content=Test%20Media%20Message&sender_name=Test%20User&sender_phone=%2B1234567890&sender_email=test%40example.com&chat_type=group&chat_name=Test%20Room&topic_name=Test%20Topic&timestamp=2025-07-18%2011%3A50%3A00&triggered_from=manual_test&media_url=https%3A//example.com/test.jpg&media_type=image/jpeg&message_type=media',
    'application/x-www-form-urlencoded'
  );
  
  RAISE NOTICE 'Webhook test response status: %, content: %', http_response.status, LEFT(http_response.content, 100);
END $$;