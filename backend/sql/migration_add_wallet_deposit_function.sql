-- Migration to add process_wallet_deposit function
-- This script adds a function to process wallet deposits

-- Create or replace the function to process wallet deposits
CREATE OR REPLACE FUNCTION process_wallet_deposit(
    p_user_id UUID,
    p_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    -- Validate input
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Deposit amount must be greater than zero';
    END IF;
    
    -- Use the existing update_wallet_balance function to process the deposit
    v_transaction_id := update_wallet_balance(
        p_user_id,
        p_amount,
        'deposit',
        NULL,
        NULL,
        jsonb_build_object('method', 'card', 'status', 'completed')
    );
    
    -- Return success if transaction was created
    RETURN v_transaction_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION process_wallet_deposit TO authenticated;
