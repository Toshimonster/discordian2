INSERT INTO events_signups (userId, eventId, alternative)
VALUES
  (
    $userid,
    $eventid,
    (
      SELECT
        COALESCE(
          COUNT(userId),
          0
        ) >= (
          SELECT
            maxPlayers
          FROM events_events
          WHERE
            messageId = $eventid
        )
      FROM events_signups
      WHERE
        eventId = $eventid
    )
  )
  ON CONFLICT(userId, eventId) DO NOTHING;