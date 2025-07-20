-- Create OneSignal API key secret
SELECT vault.create_secret(
  'os_v2_app_4iq4badykndolosasn4wgggrubmqy3dzthiu555a6ypzrgcqdwioet3wfeju6xje7gd3lzjob6jlszjgasqxm3xkixw376m7szttxaa',
  'ONESIGNAL_API_KEY'
);