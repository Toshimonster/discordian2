INSERT INTO profile_profiles (
    userid
) VALUES (
    $userid
) ON CONFLICT(userId) DO NOTHING;