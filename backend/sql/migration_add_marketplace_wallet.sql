-- Migration to add Marketplace and Wallet features
-- This migration adds tables for:
-- 1. Wallet system
-- 2. Marketplace listings
-- 3. Marketplace transactions
-- 4. Marketplace messages

-- Create wallet table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- Create wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'sale', 'commission')),
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    related_listing_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    related_transaction_id UUID,
    payment_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add marketplace fields to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS is_in_marketplace BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS marketplace_price DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS marketplace_listing_date TIMESTAMP WITH TIME ZONE;

-- Create marketplace transactions table
CREATE TABLE IF NOT EXISTS marketplace_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES auth.users(id),
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    listing_id UUID NOT NULL REFERENCES properties(id),
    sale_price DECIMAL(12, 2) NOT NULL,
    platform_fee DECIMAL(12, 2) NOT NULL,
    seller_earning DECIMAL(12, 2) NOT NULL,
    buyer_wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    seller_wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    platform_wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_transaction_amounts CHECK (
        sale_price = platform_fee + seller_earning AND
        platform_fee >= 0 AND
        seller_earning >= 0
    )
);

-- Create marketplace messages table
CREATE TABLE IF NOT EXISTS marketplace_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES marketplace_transactions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key references to wallet_transactions
ALTER TABLE wallet_transactions
ADD CONSTRAINT fk_related_transaction
FOREIGN KEY (related_transaction_id) REFERENCES marketplace_transactions(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_properties_marketplace ON properties(is_in_marketplace) WHERE is_in_marketplace = TRUE;
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_buyer_id ON marketplace_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_seller_id ON marketplace_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_listing_id ON marketplace_transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_transaction_id ON marketplace_messages(transaction_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_sender_id ON marketplace_messages(sender_id);

-- Create RLS policies for wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY wallet_select_policy ON wallets
    FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

CREATE POLICY wallet_insert_policy ON wallets
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

CREATE POLICY wallet_update_policy ON wallets
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Create RLS policies for wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY wallet_transactions_select_policy ON wallet_transactions
    FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

CREATE POLICY wallet_transactions_insert_policy ON wallet_transactions
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Create RLS policies for marketplace_transactions
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketplace_transactions_select_policy ON marketplace_transactions
    FOR SELECT
    USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

CREATE POLICY marketplace_transactions_insert_policy ON marketplace_transactions
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Create RLS policies for marketplace_messages
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketplace_messages_select_policy ON marketplace_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM marketplace_transactions
            WHERE marketplace_transactions.id = transaction_id
            AND (marketplace_transactions.buyer_id = auth.uid() OR marketplace_transactions.seller_id = auth.uid())
        ) OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY marketplace_messages_insert_policy ON marketplace_messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM marketplace_transactions
            WHERE marketplace_transactions.id = transaction_id
            AND (marketplace_transactions.buyer_id = auth.uid() OR marketplace_transactions.seller_id = auth.uid())
        )
    );

-- Create functions for wallet operations
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
BEGIN
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

-- Create function to list property in marketplace
CREATE OR REPLACE FUNCTION list_property_in_marketplace(
    p_user_id UUID,
    p_property_id UUID,
    p_price DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_property_owner_id UUID;
BEGIN
    -- Check if user owns the property
    SELECT user_id INTO v_property_owner_id
    FROM properties
    WHERE id = p_property_id;
    
    IF v_property_owner_id IS NULL THEN
        RAISE EXCEPTION 'Property not found';
    END IF;
    
    IF v_property_owner_id <> p_user_id THEN
        RAISE EXCEPTION 'You can only list properties that you own';
    END IF;
    
    -- Update property with marketplace details
    UPDATE properties
    SET is_in_marketplace = TRUE,
        marketplace_price = p_price,
        marketplace_listing_date = NOW()
    WHERE id = p_property_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to purchase marketplace listing
CREATE OR REPLACE FUNCTION purchase_marketplace_listing(
    p_buyer_id UUID,
    p_property_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_property RECORD;
    v_buyer_wallet RECORD;
    v_transaction_id UUID;
    v_buyer_transaction_id UUID;
    v_seller_transaction_id UUID;
    v_platform_transaction_id UUID;
    v_platform_fee DECIMAL;
    v_seller_earning DECIMAL;
BEGIN
    -- Get property details
    SELECT * INTO v_property
    FROM properties
    WHERE id = p_property_id AND is_in_marketplace = TRUE;
    
    IF v_property.id IS NULL THEN
        RAISE EXCEPTION 'Property not found or not available in marketplace';
    END IF;
    
    -- Check if buyer is trying to buy their own property
    IF v_property.user_id = p_buyer_id THEN
        RAISE EXCEPTION 'You cannot purchase your own property';
    END IF;
    
    -- Get buyer wallet
    SELECT * INTO v_buyer_wallet
    FROM wallets
    WHERE user_id = p_buyer_id;
    
    -- Check if buyer has enough balance
    IF v_buyer_wallet.balance < v_property.marketplace_price THEN
        RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;
    
    -- Calculate fees
    v_platform_fee := v_property.marketplace_price * 0.5;
    v_seller_earning := v_property.marketplace_price - v_platform_fee;
    
    -- Create transaction record
    INSERT INTO marketplace_transactions (
        buyer_id,
        seller_id,
        listing_id,
        sale_price,
        platform_fee,
        seller_earning
    ) VALUES (
        p_buyer_id,
        v_property.user_id,
        p_property_id,
        v_property.marketplace_price,
        v_platform_fee,
        v_seller_earning
    ) RETURNING id INTO v_transaction_id;
    
    -- Deduct from buyer's wallet
    SELECT update_wallet_balance(
        p_buyer_id,
        -v_property.marketplace_price,
        'purchase',
        p_property_id,
        v_transaction_id
    ) INTO v_buyer_transaction_id;
    
    -- Add to seller's wallet
    SELECT update_wallet_balance(
        v_property.user_id,
        v_seller_earning,
        'sale',
        p_property_id,
        v_transaction_id
    ) INTO v_seller_transaction_id;
    
    -- Record platform commission
    SELECT update_wallet_balance(
        v_property.user_id, -- Platform admin user (this should be changed to actual platform admin user)
        v_platform_fee,
        'commission',
        p_property_id,
        v_transaction_id
    ) INTO v_platform_transaction_id;
    
    -- Update transaction with wallet transaction IDs
    UPDATE marketplace_transactions
    SET buyer_wallet_transaction_id = v_buyer_transaction_id,
        seller_wallet_transaction_id = v_seller_transaction_id,
        platform_wallet_transaction_id = v_platform_transaction_id
    WHERE id = v_transaction_id;
    
    -- Transfer property ownership
    UPDATE properties
    SET user_id = p_buyer_id,
        is_in_marketplace = FALSE,
        marketplace_price = NULL,
        marketplace_listing_date = NULL
    WHERE id = p_property_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user wallet creation
CREATE TRIGGER create_wallet_after_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_wallet_for_new_user();

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON TABLE wallets TO authenticated;
GRANT ALL PRIVILEGES ON TABLE wallet_transactions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE marketplace_transactions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE marketplace_messages TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
