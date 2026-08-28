-- 025_cleanup_dummy_notifications.sql
-- Clean up all previously seeded dummy notifications to ensure pure production data

DELETE FROM notifications
WHERE title IN ('Calendar Reminder', 'Google Calendar', 'AI Provider', 'Meeting Scheduled')
  AND message IN (
    'Team meeting starts in 10 minutes',
    'Google Calendar connected successfully',
    'OpenAI provider updated',
    'Client call was added to your calendar'
  );
