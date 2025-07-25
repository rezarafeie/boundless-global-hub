// Test script to manually trigger enrollment email
const enrollmentId = 'c970d667-95a1-4dfe-a9a3-99f18796c2b4';

fetch('https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/send-enrollment-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk0NTIsImV4cCI6MjA2NTk0NTQ1Mn0.91gRPO_ApEGQF2EtTAQLcqA-mIj7lqF29M1OZcGW4BI'
  },
  body: JSON.stringify({ enrollmentId })
})
.then(response => response.json())
.then(data => console.log('Response:', data))
.catch(error => console.error('Error:', error));