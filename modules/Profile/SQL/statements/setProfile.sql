UPDATE profile_profiles
SET
    tagline = COALESCE($tagline, tagline),
    description = COALESCE($description, description),
    xp = COALESCE($xp, xp),
    nintendoswitch = COALESCE($nintendoswitch, nintendoswitch),
    battlenet = COALESCE($battlenet, battlenet),
    origin = COALESCE($origin, origin),
    steam = COALESCE($steam, steam),
    uplay = COALESCE($uplay, uplay),
    epic = COALESCE($epic, epic),
    bethesda = COALESCE($bethesda, bethesda),
    riot = COALESCE($riot, riot),

    huntername = COALESCE($huntername, huntername),
    paliconame = COALESCE($paliconame, paliconame),
    mainweapon = COALESCE($mainweapon, mainweapon),
    hr = COALESCE($hr, hr),
    mr = COALESCE($mr, mr),
    maxedguidedlands = COALESCE($maxedguidedlands, maxedguidedlands)
WHERE userid = $userid