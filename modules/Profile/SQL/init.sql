--Make sure to name the table with {modulename}_{tablename}, to ensure no conflicts.
CREATE TABLE IF NOT EXISTS profile_profiles (
    userId VARCHAR(18) PRIMARY KEY,
    tagLine VARCHAR(100),
    description VARCHAR(500),
    xp INT DEFAULT 0,

    --Games
    nintendoswitch VARCHAR(17),
    battlenet VARCHAR(50),
    origin VARCHAR(50),
    steam VARCHAR(50),
    uplay VARCHAR(50),
    epic VARCHAR(50),
    bethesda VARCHAR(50),
    riot VARCHAR(50),

    --MH
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
    ),
    (
        'NewProfile',
        'Creates your profile',
        'newprofile',
        'Profile'
    ),
    (
        'SetProfile',
        'Sets a parameter for your profile. Run command with no parameters for a list of them',
        'setprofile {parameter} {...value}',
        'Profile'
    ),
    (
        'GetAccounts',
        'Finds all users accounts for the specified platform',
        'getaccounts {platform}',
        'Profile'
    ) ON CONFLICT(commandName) DO NOTHING;
exception WHEN others THEN
END; $$