SELECT
  userId,
  alternative
FROM events_signups
WHERE
  eventId = $eventid