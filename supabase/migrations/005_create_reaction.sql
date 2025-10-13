-- Enhanced reactions master table with Gen Z and student-popular emojis
CREATE TABLE reactions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  emoji_unicode VARCHAR(10) NOT NULL,
  category VARCHAR(20) NOT NULL,
  description TEXT,
  popularity_score INT DEFAULT 50, -- 1-100 scale for trending
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- Enhanced emoji reactions with Gen Z favorites
INSERT INTO reactions (name, emoji_unicode, category, description, popularity_score) VALUES
-- Original popular ones (keeping the best)
('like', '👍', 'positive', 'Default like reaction', 70),
('love', '❤️', 'positive', 'Love / strong positive', 85),
('funny', '😂', 'positive', 'Laugh / funny (still popular despite Gen Z claims)', 90),
('fire', '🔥', 'positive', 'Lit / amazing / trending', 95),
('hundred', '💯', 'positive', 'Strong agreement / perfect', 85),
('star', '⭐', 'positive', 'Favorite / highlight', 75),

-- Gen Z trending emojis
('skull', '💀', 'positive', 'Extremely funny / dead from laughter', 98),
('crying_laugh', '😭', 'positive', 'Crying from laughter / so funny', 95),
('pleading', '🥺', 'neutral', 'Puppy dog eyes / please / vulnerable', 92),
('sparkles', '✨', 'positive', 'Emphasis / aesthetic / magical', 90),
('nail_polish', '💅', 'positive', 'Sassy / confident / unbothered', 88),
('clown', '🤡', 'negative', 'Foolish / calling out stupidity', 85),
('eyes', '👀', 'neutral', 'Watching / suspicious / interested', 93),
('sweat_smile', '😅', 'neutral', 'Awkward / nervous laughter', 82),
('upside_down', '🙃', 'negative', 'Sarcastic / this sucks', 87),
('crazy_face', '🤪', 'positive', 'Silly / goofy / fun', 80),
('mind_blown', '🤯', 'neutral', 'Shocked / overwhelmed', 85),
('flushed', '😳', 'neutral', 'Embarrassed / shocked', 78),
('cap', '🧢', 'negative', 'Lie / false statement', 90),
('no_cap', '🚫🧢', 'positive', 'No lie / truth / serious', 88),

-- Student/Academic specific
('brain', '🧠', 'neutral', 'Smart / overthinking / mental load', 85),
('books', '📚', 'neutral', 'Study / learning', 75),
('graduation', '🎓', 'positive', 'Achievement / academic success', 80),
('coffee', '☕', 'neutral', 'Energy / study fuel', 85),
('tired', '😴', 'negative', 'Exhausted / sleepy', 82),
('stress', '😵‍💫', 'negative', 'Overwhelmed / dizzy from stress', 88),

-- Social media trending
('chart_up', '📈', 'positive', 'Trending / gaining popularity', 85),
('chart_down', '📉', 'negative', 'Flopped / declining', 75),
('red_flag', '🚩', 'negative', 'Warning / problematic', 92),
('green_flag', '🟢', 'positive', 'Good sign / approved', 85),
('tea', '🍵', 'neutral', 'Gossip / spill the tea', 90),
('popcorn', '🍿', 'neutral', 'Watching drama unfold', 88),
('ghost', '👻', 'negative', 'Ghosted / disappeared', 80),
('mask', '🥸', 'neutral', 'Disguise / hiding / fake', 75),

-- Emotion & mental health (popular with students)
('mending_heart', '❤️‍🩹', 'positive', 'Healing / support / sympathy', 82),
('broken_heart', '💔', 'negative', 'Heartbreak / emotional pain', 85),
('melting', '🫠', 'negative', 'Embarrassed / anxious / melting', 90),
('face_clouds', '😶‍🌫️', 'negative', 'Mentally foggy / checked out', 85),
('pensive', '😔', 'negative', 'Sad / down / heavy', 80),
('weary', '😩', 'negative', 'Burnt out / overwhelmed', 85),
('grimace', '😬', 'negative', 'Awkward / nervous tension', 82),
('relieved', '😮‍💨', 'positive', 'Phew / relieved / exhale', 80),

-- Communication style
('pointing_fingers', '👉👈', 'neutral', 'Shy / nervous / hesitant', 88),
('shrug', '🤷', 'neutral', 'I don''t know / whatever', 85),
('peace', '✌️', 'positive', 'Peace out / goodbye / chill', 80),
('folded_hands', '🙏', 'positive', 'Please / thank you / gratitude', 90),
('raised_hands', '🙌', 'positive', 'Celebration / praise / yes', 85),
('facepalm', '🤦', 'negative', 'Obvious mistake / frustrated', 85),
('chef_kiss', '👨‍🍳💋', 'positive', 'Perfect / *chef''s kiss*', 82),

-- Trendy additions
('fire_heart', '❤️‍🔥', 'positive', 'Passionate love / intense feeling', 85),
('heart_hands', '🫶', 'positive', 'Love / support (Gen Z preferred over ❤️)', 92),
('salute', '🫡', 'positive', 'Respect / acknowledgment', 80),
('disco_ball', '🪩', 'positive', 'Party / celebration / aesthetic', 78),
('crystal_ball', '🔮', 'neutral', 'Mystical / predicting / manifesting', 75),
('alien', '👽', 'neutral', 'Weird / out of this world', 78),
('robot', '🤖', 'neutral', 'AI / robotic / automated', 82),
('butterfly', '🦋', 'positive', 'Transformation / aesthetic / growth', 85),
('mushroom', '🍄', 'neutral', 'Cottagecore / aesthetic / nature', 80);

-- Index for performance
CREATE INDEX idx_reactions_category ON reactions(category);
CREATE INDEX idx_reactions_popularity ON reactions(popularity_score DESC);
