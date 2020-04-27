--Make sure to name the table with {modulename}_{tablename}, to ensure no conflicts.

--Help command
/*DO $$
BEGIN
    INSERT INTO help_help (
        moduleName,
        description
    ) VALUES (
        'Your Module Name',
        'Your Module Description'
    ) ON CONFLICT(moduleName) DO NOTHING;

    --Help commands
    INSERT INTO help_commands (
        commandName,
        description,
        syntax,
        moduleName
    ) VALUES (
        'Your Command Name',
        'Your Command\'s Description',
        'Your Command\'s Syntax; params in {}, no prefix needed',
        'Your Module Name'
    ) ON CONFLICT(commandName) DO NOTHING;
exception WHEN others THEN
END; $$*/