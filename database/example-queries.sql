-- Admin seed
INSERT INTO admins (discord_id, role)
VALUES ('123456789012345678', 'superadmin')
ON CONFLICT (discord_id) DO NOTHING;

-- Team seed
INSERT INTO teams (name, owner_discord_id, budget)
VALUES ('Milan', '123456789012345678', 100000000);

-- Player seed
INSERT INTO players (player_name, overall, potential_overall, role, price)
VALUES ('Rafael Leao', 86, 89, 'LW', 85000000);

-- Trasferimento manuale: assegna player id 1 al team id 1
UPDATE players
SET team_id = 1, updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

INSERT INTO transfers (player_id, from_team_id, to_team_id, price, created_by_admin_id)
VALUES (1, NULL, 1, 85000000, 1);

-- Evoluzione overall
UPDATE players
SET overall = 87, updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

INSERT INTO overall_history (player_id, old_overall, new_overall, reason, updated_by_admin_id)
VALUES (1, 86, 87, 'Performance stagionale', 1);

-- Report budget e rosa
SELECT t.id, t.name, t.budget, COUNT(p.id) AS players_count
FROM teams t
LEFT JOIN players p ON p.team_id = t.id
GROUP BY t.id, t.name, t.budget
ORDER BY t.name;

