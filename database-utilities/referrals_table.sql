-- SQL for creating the referrals table in Supabase

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    referred_user_id INTEGER NOT NULL,
    level INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Add foreign key constraints
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_referred_user_id FOREIGN KEY (referred_user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
        
    -- Ensure one user can only refer another user once
    CONSTRAINT unique_referral UNIQUE (user_id, referred_user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_referrals_user_id ON referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);

-- Comment on table and columns for better documentation
COMMENT ON TABLE referrals IS 'Stores referral relationships between users';
COMMENT ON COLUMN referrals.id IS 'Primary key for the referrals table';
COMMENT ON COLUMN referrals.user_id IS 'ID of the user who referred someone (referrer)';
COMMENT ON COLUMN referrals.referred_user_id IS 'ID of the user who was referred (referee)';
COMMENT ON COLUMN referrals.level IS 'Referral level (1-6 for multi-level referrals)';
COMMENT ON COLUMN referrals.created_at IS 'Timestamp when the referral was recorded';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON referrals TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE referrals_id_seq TO anon, authenticated, service_role;