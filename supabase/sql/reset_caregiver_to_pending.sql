-- Executar no Supabase Dashboard → SQL Editor
-- RPC chamada quando o cuidador envia/reenvia o RG/CNH.
-- SECURITY DEFINER bypassa RLS para alterar o campo "status" (controlado pelo admin).

CREATE OR REPLACE FUNCTION public.reset_caregiver_to_pending(p_caregiver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só reseta se o chamador é o próprio cuidador (evita abuso)
  IF auth.uid() IS DISTINCT FROM p_caregiver_id THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  UPDATE caregiver_profiles
  SET status = 'pending',
      has_rg_cnh = false,
      is_visible = false
  WHERE id = p_caregiver_id;
END;
$$;

-- Permite que qualquer usuário autenticado chame a função
GRANT EXECUTE ON FUNCTION public.reset_caregiver_to_pending(uuid) TO authenticated;
