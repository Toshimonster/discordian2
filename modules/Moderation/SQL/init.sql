--Make sure to name the table with {modulename}_{tablename}, to ensure no conflicts.

--Help command
DO $$
BEGIN
    INSERT INTO help_help (
        moduleName,
        description
    ) VALUES (
        'Moderation',
        'Enables various moderation tools'
    ) ON CONFLICT(moduleName) DO NOTHING;

    --Help commands
    INSERT INTO help_commands (
        commandName,
        description,
        syntax,
        moduleName
    ) VALUES (
        'purge',
        'purges up to 500 messages in a channel, that are less than two weeks old',
        'purge {numberOfMessages}',
        'Moderation'
    ) ON CONFLICT(commandName) DO NOTHING;
exception WHEN others THEN
END; $$