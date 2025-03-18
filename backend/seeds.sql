-- Ajout d'utilisateurs
INSERT INTO users (username, email, password_hash) VALUES 
('player1', 'player1@example.com', '$2b$10$hashpassword1'),
('player2', 'player2@example.com', '$2b$10$hashpassword2'),
('player3', 'player3@example.com', '$2b$10$hashpassword3');

-- Ajout de relations d'amis
INSERT INTO friends (user_id, friend_id, status) VALUES 
(1, 2, 'accepted'),
(1, 3, 'pending');

-- Ajout de matchs
INSERT INTO matches (player1_id, player2_id, winner_id, score) VALUES 
(1, 2, 1, '10-5'),
(2, 3, 3, '8-6');

-- Ajout de tournois
INSERT INTO tournaments (name, start_date) VALUES 
('Spring Championship', '2024-06-01'),
('Summer Tournament', '2024-07-15');

-- Inscription des joueurs aux tournois
INSERT INTO tournament_participants (tournament_id, user_id) VALUES 
(1, 1),
(1, 2),
(2, 3);
