-- Atomic reward redemption helpers.
-- These functions keep XP updates and redemption status changes in one database transaction.

CREATE OR REPLACE FUNCTION public.redeem_reward_item(
  p_reward_item_id UUID,
  p_child_id UUID
)
RETURNS TABLE (xp INT, redemption_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item reward_items%ROWTYPE;
  v_child profiles%ROWTYPE;
  v_new_xp INT;
  v_redemption_id UUID;
BEGIN
  SELECT * INTO v_item
  FROM reward_items
  WHERE id = p_reward_item_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'reward_not_found';
  END IF;

  IF NOT v_item.is_active OR v_item.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'reward_not_available';
  END IF;

  SELECT * INTO v_child
  FROM profiles
  WHERE id = p_child_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'child_not_found';
  END IF;

  IF v_child.role <> 'child' THEN
    RAISE EXCEPTION 'profile_is_not_child';
  END IF;

  IF v_child.parent_id IS DISTINCT FROM v_item.parent_id THEN
    RAISE EXCEPTION 'reward_not_owned_by_child_parent';
  END IF;

  IF COALESCE(v_child.xp, 0) < v_item.cost_points THEN
    RAISE EXCEPTION 'not_enough_xp';
  END IF;

  v_new_xp := COALESCE(v_child.xp, 0) - v_item.cost_points;

  UPDATE profiles
  SET xp = v_new_xp
  WHERE id = p_child_id;

  INSERT INTO reward_redemptions (
    reward_item_id,
    child_id,
    parent_id,
    title,
    cost_points,
    status
  ) VALUES (
    v_item.id,
    p_child_id,
    v_item.parent_id,
    v_item.title,
    v_item.cost_points,
    'requested'
  )
  RETURNING id INTO v_redemption_id;

  RETURN QUERY SELECT v_new_xp, v_redemption_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_reward_redemption_status(
  p_redemption_id UUID,
  p_parent_id UUID,
  p_status TEXT
)
RETURNS reward_redemptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing reward_redemptions%ROWTYPE;
  v_updated reward_redemptions%ROWTYPE;
BEGIN
  IF p_status NOT IN ('approved', 'fulfilled', 'rejected') THEN
    RAISE EXCEPTION 'invalid_redemption_status';
  END IF;

  SELECT * INTO v_existing
  FROM reward_redemptions
  WHERE id = p_redemption_id
    AND parent_id = p_parent_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'redemption_not_found';
  END IF;

  IF NOT (
    (v_existing.status = 'requested' AND p_status IN ('approved', 'rejected')) OR
    (v_existing.status = 'approved' AND p_status IN ('fulfilled', 'rejected'))
  ) THEN
    RAISE EXCEPTION 'invalid_redemption_transition';
  END IF;

  IF p_status = 'rejected' THEN
    UPDATE profiles
    SET xp = xp + v_existing.cost_points
    WHERE id = v_existing.child_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'child_not_found';
    END IF;
  END IF;

  UPDATE reward_redemptions
  SET
    status = p_status,
    resolved_at = CASE
      WHEN p_status IN ('fulfilled', 'rejected') THEN TIMEZONE('utc', NOW())
      ELSE NULL
    END
  WHERE id = p_redemption_id
  RETURNING * INTO v_updated;

  RETURN v_updated;
END;
$$;
