-- Seed giocatori per test

INSERT INTO players (player_name, overall, role, price)
SELECT 'Kylian Mbappe', 91, 'ST', 210
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Kylian Mbappe');

INSERT INTO players (player_name, overall, role, price)
SELECT 'Erling Haaland', 91, 'ST', 195
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Erling Haaland');

INSERT INTO players (player_name, overall, role, price)
SELECT 'Jude Bellingham', 90, 'CM', 175
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Jude Bellingham');

INSERT INTO players (player_name, overall, role, price)
SELECT 'Vinicius Junior', 90, 'LW', 185
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Vinicius Junior');

INSERT INTO players (player_name, overall, role, price)
SELECT 'Lautaro Martinez', 89, 'ST', 120
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Lautaro Martinez');

INSERT INTO players (player_name, overall, role, price)
SELECT 'Federico Valverde', 88, 'CM', 115
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Federico Valverde');

INSERT INTO players (player_name, overall, role, price)
SELECT 'Nico Williams', 85, 'LW', 72
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Nico Williams');

INSERT INTO players (player_name, overall, role, price)
SELECT 'Rafael Leao', 86, 'LW', 85
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Rafael Leao');

INSERT INTO players (player_name, overall, role, price)
SELECT 'Giorgi Mamardashvili', 84, 'GK', 48
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Giorgi Mamardashvili');

INSERT INTO players (player_name, overall, role, price)
SELECT 'Riccardo Calafiori', 82, 'CB', 44
WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_name = 'Riccardo Calafiori');

