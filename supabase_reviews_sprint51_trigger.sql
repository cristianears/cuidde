-- Sprint 5.1: Trigger para sincronizar average_rating e review_count em caregiver_profiles
-- Executar no Supabase SQL Editor

CREATE OR REPLACE FUNCTION fn_update_caregiver_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.caregiver_id;
  ELSE
    target_id := NEW.caregiver_id;
  END IF;

  UPDATE caregiver_profiles
  SET
    review_count   = (SELECT COUNT(*)           FROM reviews WHERE caregiver_id = target_id),
    average_rating = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric * 2) / 2 FROM reviews WHERE caregiver_id = target_id),
      0
    )
  WHERE id = target_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_caregiver_rating ON reviews;
CREATE TRIGGER trg_update_caregiver_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_caregiver_rating();

-- Recalcular todos os cuidadores existentes (backfill)
UPDATE caregiver_profiles cp
SET
  review_count   = sub.cnt,
  average_rating = sub.avg_r
FROM (
  SELECT
    caregiver_id,
    COUNT(*)                                   AS cnt,
    ROUND(AVG(rating)::numeric * 2) / 2        AS avg_r
  FROM reviews
  GROUP BY caregiver_id
) sub
WHERE cp.id = sub.caregiver_id;

-- Verificação
SELECT id, review_count, average_rating
FROM caregiver_profiles
WHERE review_count > 0;
