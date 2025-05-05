-- Migration to add request_withdrawal function
-- This script adds a function to process wallet withdrawal requests

-- First, check if the withdrawal_requests table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'withdrawal_requests'
    ) THEN
        -- Create the withdrawal_requests table if it doesn't exist
        CREATE TABLE withdrawal_requests (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            amount DECIMAL(12, 2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            payment_details JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT positive_amount CHECK (amount > 0)
        );

        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
        CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

        -- Enable RLS on the withdrawal_requests table
        ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies for withdrawal_requests
        CREATE POLICY withdrawal_requests_select_policy ON withdrawal_requests
            FOR SELECT
            USING (user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles)
            ));

        CREATE POLICY withdrawal_requests_insert_policy ON withdrawal_requests
            FOR INSERT
            WITH CHECK (user_id = auth.uid());

        CREATE POLICY withdrawal_requests_update_policy ON withdrawal_requests
            FOR UPDATE
            USING (EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid() AND 'admin' = ANY(profiles.roles)
            ));
    END IF;
END $$;

-- Create or replace the function to request a withdrawal
CREATE OR REPLACE FUNCTION request_withdrawal(
    p_user_id UUID,
    p_amount DECIMAL,
    p_payment_details JSONB
)
RETURNS UUID AS $$
DECLARE
    v_wallet_balance DECIMAL;
    v_request_id UUID;
BEGIN
    -- Validate input
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Withdrawal amount must be greater than zero';
    END IF;
    
    -- Check if user has sufficient balance
    SELECT balance INTO v_wallet_balance
    FROM wallets
    WHERE user_id = p_user_id;
    
    IF v_wallet_balance IS NULL THEN
        RAISE EXCEPTION 'Wallet not found for user';
    END IF;
    
    IF v_wallet_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance for withdrawal';
    END IF;
    
    -- Create withdrawal request
    INSERT INTO withdrawal_requests (
        user_id,
        amount,
        payment_details
    ) VALUES (
        p_user_id,
        p_amount,
        p_payment_details
    ) RETURNING id INTO v_request_id;
    
    -- Return the request ID
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the function to approve a withdrawal
CREATE OR REPLACE FUNCTION approve_withdrawal(
    p_request_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_amount DECIMAL;
    v_payment_details JSONB;
    v_transaction_id UUID;
BEGIN
    -- Get withdrawal request details
    SELECT user_id, amount, payment_details
    INTO v_user_id, v_amount, v_payment_details
    FROM withdrawal_requests
    WHERE id = p_request_id AND status = 'pending';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Withdrawal request not found or not pending';
    END IF;
    
    -- Update withdrawal request status
    UPDATE withdrawal_requests
    SET status = 'approved',
        updated_at = NOW()
    WHERE id = p_request_id;
    
    -- Use the existing update_wallet_balance function to process the withdrawal
    v_transaction_id := update_wallet_balance(
        v_user_id,
        -v_amount, -- Negative amount for withdrawal
        'withdrawal',
        NULL,
        NULL,
        jsonb_build_object(
            'method', v_payment_details->>'method',
            'status', 'completed',
            'withdrawal_request_id', p_request_id
        )
    );
    
    -- Return success if transaction was created
    RETURN v_transaction_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION request_withdrawal TO authenticated;
GRANT EXECUTE ON FUNCTION approve_withdrawal TO authenticated;
GRANT ALL PRIVILEGES ON TABLE withdrawal_requests TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
