INSERT INTO events_events (
    messageId,
    eventBoardId,
    -- events_eventBoards.channelId
    name,
    description,
    time,
    maxPlayers
  )
VALUES
  (
    $messageid,
    $channelid,
    $name,
    $description,
    $time,
    $maxplayers
  )