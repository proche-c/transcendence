-- Ajout d'utilisateurs
INSERT OR IGNORE INTO users (username, email, password_hash, total_matches, total_wins, total_losses, goals_for, goals_against) VALUES 
('player1', 'player1@example.com', '$2b$10$hashpassword1', 2,2,0,20,10),
('player2', 'player2@example.com', '$2b$10$hashpassword2', 2,2,0,20,15),
('player3', 'player3@example.com', '$2b$10$hashpassword3', 2,1,1,20,5);

-- Ajout de relations d'amis
INSERT OR IGNORE INTO friends (user_id, friend_id, status) VALUES 
(1, 2, 'accepted'),
(1, 3, 'pending');

-- Ajout de matchs
INSERT OR IGNORE INTO matches (player1_id, player2_id, winner_id, score) VALUES 
(1, 2, 1, '10-5'),
(2, 3, 3, '8-6');

-- Ajout de tournois
INSERT OR IGNORE INTO tournaments (name, start_date) VALUES 
('Spring Championship', '2024-06-01'),
('Summer Tournament', '2024-07-15');

-- Inscription des joueurs aux tournois
INSERT OR IGNORE INTO tournament_participants (tournament_id, user_id) VALUES 
(1, 1),
(1, 2),
(2, 3);
