-- Seed giocatori per test

INSERT INTO players (player_name, overall, potential_overall, role, price)
SELECT 'Kylian Mbappe', 91, 93, 'ST', 210
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Kylian Mbappe');

INSERT INTO players (player_name, overall, potential_overall, role, price)
SELECT 'Erling Haaland', 91, 93, 'ST', 195
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Erling Haaland');

INSERT INTO players (player_name, overall, potential_overall, role, price)
SELECT 'Jude Bellingham', 90, 93, 'CM', 175
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Jude Bellingham');

INSERT INTO players (player_name, overall, potential_overall, role, price)
SELECT 'Vinicius Junior', 90, 92, 'LW', 185
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Vinicius Junior');

INSERT INTO players (player_name, overall, potential_overall, role, price)
SELECT 'Lautaro Martinez', 89, 90, 'ST', 120
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Lautaro Martinez');

INSERT INTO players (player_name, overall, potential_overall, role, price)
SELECT 'Federico Valverde', 88, 90, 'CM', 115
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Federico Valverde');

INSERT INTO players (player_name, overall, potential_overall, role, price)
SELECT 'Nico Williams', 85, 89, 'LW', 72
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Nico Williams');

INSERT INTO players (player_name, overall, potential_overall, role, price)
SELECT 'Rafael Leao', 86, 89, 'LW', 85
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Rafael Leao');

INSERT INTO players (player_name, overall, potential_overall, role, price)
SELECT 'Giorgi Mamardashvili', 84, 88, 'GK', 48
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Giorgi Mamardashvili');

INSERT INTO players (player_name, overall, potential_overall, role, price)
SELECT 'Riccardo Calafiori', 82, 88, 'CB', 44
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Riccardo Calafiori');

