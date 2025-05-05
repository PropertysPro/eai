-- Migration to fix wallet issues
-- This script ensures that each user has a wallet record

-- First, check if the wallets table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'wallets'
    ) THEN
        -- Create the wallets table if it doesn't exist
        CREATE TABLE wallets (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT positive_balance CHECK (balance >= 0)
        );

        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

        -- Enable RLS on the wallets table
        ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies for wallets
        CREATE POLICY wallet_select_policy ON wallets
            FOR SELECT
            USING (user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles)
            ));

        CREATE POLICY wallet_insert_policy ON wallets
            FOR INSERT
            WITH CHECK (user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles)
            ));

        CREATE POLICY wallet_update_policy ON wallets
            FOR UPDATE
            USING (EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles)
            ));
    END IF;
END $$;

-- Create wallet records for users who don't have one
INSERT INTO wallets (user_id, balance)
SELECT id, 0.00
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM wallets WHERE wallets.user_id = auth.users.id
);

-- Create or replace the function to create a wallet for new users
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'create_wallet_after_user_insert'
    ) THEN
        CREATE TRIGGER create_wallet_after_user_insert
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION create_wallet_for_new_user();
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON TABLE wallets TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create or replace the function to get a user's wallet
CREATE OR REPLACE FUNCTION get_user_wallet(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    balance DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- First try to find the wallet
    RETURN QUERY
    SELECT w.id, w.user_id, w.balance, w.created_at, w.updated_at
    FROM wallets w
    WHERE w.user_id = p_user_id;
    
    -- If no rows returned, create a wallet and return it
    IF NOT FOUND THEN
        INSERT INTO wallets (user_id)
        VALUES (p_user_id)
        RETURNING wallets.id, wallets.user_id, wallets.balance, wallets.created_at, wallets.updated_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance(
    p_user_id UUID,
    p_amount DECIMAL,
    p_type TEXT,
    p_related_listing_id UUID DEFAULT NULL,
    p_related_transaction_id UUID DEFAULT NULL,
    p_payment_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_wallet_exists BOOLEAN;
BEGIN
    -- Check if wallet exists
    SELECT EXISTS(SELECT 1 FROM wallets WHERE user_id = p_user_id) INTO v_wallet_exists;
    
    -- Create wallet if it doesn't exist
    IF NOT v_wallet_exists THEN
        INSERT INTO wallets (user_id) VALUES (p_user_id);
    END IF;
    
    -- Create transaction record
    INSERT INTO wallet_transactions (
        user_id,
        type,
        amount,
        related_listing_id,
        related_transaction_id,
        payment_details
    ) VALUES (
        p_user_id,
        p_type,
        p_amount,
        p_related_listing_id,
        p_related_transaction_id,
        p_payment_details
    ) RETURNING id INTO v_transaction_id;
    
    -- Update wallet balance
    UPDATE wallets
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
