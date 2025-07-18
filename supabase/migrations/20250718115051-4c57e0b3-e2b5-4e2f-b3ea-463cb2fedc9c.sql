-- Test the webhook function directly with media data
SELECT send_message_webhook() FROM (
  INSERT INTO messenger_messages (room_id, sender_id, message, topic_id, media_url, message_type, media_content)
  VALUES (25, 3, 'Test media message', 11, 'https://example.com/test.jpg', 'image/jpeg', '{"name":"test.jpg","size":12345,"url":"https://example.com/test.jpg","type":"image/jpeg"}')
  RETURNING *
) t;