DELETE FROM events_signups
WHERE
  userId = $userid
  AND eventId = $eventid