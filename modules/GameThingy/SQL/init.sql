--Make sure to name the table with {modulename}_{tablename}, to ensure no conflicts.

--Help command
DO $$
BEGIN
    INSERT INTO help_help (
        moduleName,
        description
    ) VALUES (
        'Suggestions',
        'Modules providing game suggestions'
    ) ON CONFLICT(moduleName) DO NOTHING;

    --Help commands
    INSERT INTO help_commands (
        commandName,
        description,
        syntax,
        moduleName
    ) VALUES (
        'Suggest',
        'Suggest a (steam) game! Makes a embed that people can react to!',
        'suggest {link}',
        'Suggestions'
    ) ON CONFLICT(commandName) DO NOTHING;
exception WHEN others THEN
END; $$