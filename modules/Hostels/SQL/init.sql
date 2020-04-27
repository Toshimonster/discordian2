--Make sure to name the table with {modulename}_{tablename}, to ensure no conflicts.
CREATE TABLE IF NOT EXISTS hostels_hostels (
    channelId VARCHAR(18) PRIMARY KEY,
    roomName VARCHAR(100),
    guildId VARCHAR(18)
);

CREATE TABLE IF NOT EXISTS hostels_activeRooms (
    channelId VARCHAR(18) PRIMARY KEY,
    hostelId VARCHAR(18) -- hostels_hostels.channelId
);

--Help command
DO $$
BEGIN
    INSERT INTO help_help (
        moduleName,
        description
    ) VALUES (
        'Hostels',
        'Provides a voice channel that creates more voice channels.'
    ) ON CONFLICT(moduleName) DO NOTHING;

    --Help commands
    INSERT INTO help_commands (
        commandName,
        description,
        syntax,
        moduleName
    ) VALUES (
        'makeHostel',
        'Make a voice channel a hostel',
        'makeHostel {voiceChannel_id} {newRoomNameSchema}',
        'Hostels'
    ),
    (
        'removeHostel',
        'remove all hostels in the guild',
        'removeHostel',
        'Hostels'
    ) ON CONFLICT(commandName) DO NOTHING;
exception WHEN others THEN
END; $$