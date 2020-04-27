--Make sure to name the table with {modulename}_{tablename}, to ensure no conflicts.
CREATE TABLE IF NOT EXISTS profile_profiles (
    --Games
    nintendoswitch VARCHAR(17),
    battlenet VARCHAR(25),
    origin VARCHAR(25),
    steam VARCHAR(25),
    uplay VARCHAR(25),

    --Non-MH
    userId VARCHAR(18) PRIMARY KEY,
    hunterName VARCHAR(100),
    palicoName VARCHAR(100),
    /*
    0   - NONE
    1   - GREAT SWORD
    2   - LONG SWORD
    3   - SWORD AND SHIELD
    4   - DUEL BLADES
    5   - HAMMER
    6   - HUNTING HORN
    7   - LANCE
    8   - GUNLANCE
    9   - SWITCH AXE
    10  - CHARGE BLADE
    11  - INSECT GLAIVE
    12  - LIGHT BOWGUN
    13  - HEAVY BOWGUN
    14  - BOW
    */
    mainWeapon VARCHAR(18),
    HR INT,
    MR INT,
    /*
        1 x Forest +
        2 x Wildspire +
        4 x Coral + 
        8 x Rotted + 
        16 x Volcanic + 
        32 x Tundra
    */
    maxedGuidedLands INT DEFAULT 0 CHECK (maxedGuidedLands < 64)
);


--Help command
DO $$
BEGIN
    INSERT INTO help_help (
        moduleName,
        description
    ) VALUES (
        'Profile',
        'Enables Profiles'
    ) ON CONFLICT(moduleName) DO NOTHING;

    --Help commands
    INSERT INTO help_commands (
        commandName,
        description,
        syntax,
        moduleName
    ) VALUES (
        'Profile',
        'Shows your profile',
        'profile',
        'Profile'
    ) ON CONFLICT(commandName) DO NOTHING;
exception WHEN others THEN
END; $$