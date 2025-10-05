-- G.A.Q.T. Database Schema for Neon PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    ton_wallet TEXT,
    energy INTEGER DEFAULT 1000 NOT NULL,
    points BIGINT DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on telegram_id for fast lookups
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_points ON users(points DESC);

-- Quests table
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('affiliate', 'iap', 'social', 'ton')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_points INTEGER NOT NULL,
    reward_energy INTEGER DEFAULT 0,
    affiliate_url TEXT,
    stars_price INTEGER,
    icon_emoji TEXT DEFAULT '🎯',
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on active quests
CREATE INDEX idx_quests_active ON quests(is_active, order_index);

-- User quests (tracking completion)
CREATE TABLE user_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, quest_id)
);

-- Create indexes for user quest lookups
CREATE INDEX idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX idx_user_quests_status ON user_quests(user_id, status);

-- Energy transactions (optional, for tracking energy changes)
CREATE TABLE energy_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('regeneration', 'quest_cost', 'purchase', 'reward')),
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_energy_transactions_user_id ON energy_transactions(user_id, created_at DESC);

-- Insert initial quests
INSERT INTO quests (type, title, description, reward_points, reward_energy, affiliate_url, icon_emoji, order_index) VALUES
('affiliate', 'Join XRocket DEX', 'Sign up on XRocket using our referral link and start trading', 5000, 500, 'https://t.me/xrocket?start=ref_gaqt', '🚀', 1),
('affiliate', 'Connect TON Wallet', 'Connect your TON wallet to unlock Web3 features', 3000, 300, NULL, '💎', 2),
('social', 'Follow on Twitter', 'Follow our official Twitter account for updates', 1000, 100, 'https://twitter.com/gaqt_official', '🐦', 3),
('affiliate', 'Try TON Launchpad', 'Explore new projects on TON Launchpad', 7000, 700, 'https://t.me/tonlaunchpad?start=ref_gaqt', '🎪', 4),
('social', 'Join Telegram Channel', 'Join our Telegram community channel', 1500, 150, 'https://t.me/gaqt_community', '📢', 5);

-- Function to regenerate energy over time (can be called periodically)
CREATE OR REPLACE FUNCTION regenerate_energy()
RETURNS void AS $$
BEGIN
    UPDATE users
    SET 
        energy = LEAST(energy + 10, 1000),
        last_sync = NOW()
    WHERE energy < 1000 
    AND last_sync < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Referral system tables
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    reward_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- Add referral_code to users table
ALTER TABLE users ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN referral_count INTEGER DEFAULT 0;

-- Daily quests table
CREATE TABLE daily_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    multiplier DECIMAL(3,2) DEFAULT 2.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quest_id, date)
);

CREATE INDEX idx_daily_quests_date ON daily_quests(date, is_active);

-- User achievements/badges table
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL CHECK (achievement_type IN ('first_quest', 'wallet_connected', 'referral_master', 'daily_streak', 'top_10')),
    achievement_name TEXT NOT NULL,
    icon_emoji TEXT DEFAULT '🏆',
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_type)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;
        
        EXIT WHEN NOT exists;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code on user creation
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_referral_code
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION set_referral_code();
