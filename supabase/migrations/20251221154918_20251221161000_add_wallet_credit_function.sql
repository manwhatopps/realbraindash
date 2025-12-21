/*
  # Add Atomic Wallet Credit Function

  Adds a helper function for atomic wallet crediting used by payment webhooks.
  This ensures deposits are credited safely and logged properly.
*/

CREATE OR REPLACE FUNCTION credit_wallet_atomic(
  p_user_id uuid,
  p_amount_cents int,
  p_transaction_type text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  success boolean,
  new_balance_cents bigint
) AS $$
DECLARE
  v_new_balance bigint;
BEGIN
  -- Ensure wallet exists
  INSERT INTO wallet_balance (user_id, available_cents, locked_cents)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update wallet balance atomically
  UPDATE wallet_balance
  SET available_cents = available_cents + p_amount_cents
  WHERE user_id = p_user_id
  RETURNING available_cents INTO v_new_balance;

  -- Create ledger entry
  INSERT INTO wallet_ledger (
    user_id,
    transaction_type,
    amount_cents,
    balance_after_cents,
    description,
    metadata
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_amount_cents,
    v_new_balance,
    p_description,
    p_metadata
  );

  RETURN QUERY SELECT true, v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;