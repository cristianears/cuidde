-- RPC: substituição atômica de referências profissionais
--
-- Substitui o padrão "delete-all + insert" que não é atômico:
-- se o insert falhar após o delete, as referências somem.
-- Esta função executa tudo em uma única transação do banco.
--
-- Executar no Supabase SQL Editor.

CREATE OR REPLACE FUNCTION replace_professional_references(
  p_caregiver_id uuid,
  p_refs jsonb,                          -- array de objetos de referência
  p_show_refs_to_subscribers boolean,
  p_mask_reference_phones boolean,
  p_show_reference_full_names boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Garante que apenas o próprio cuidador pode alterar suas referências
  IF auth.uid() != p_caregiver_id THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  -- Delete + insert na mesma transação
  DELETE FROM professional_references WHERE caregiver_id = p_caregiver_id;

  IF jsonb_array_length(p_refs) > 0 THEN
    INSERT INTO professional_references (
      caregiver_id, name, phone, workplace, position, work_duration, notes
    )
    SELECT
      p_caregiver_id,
      r->>'name',
      r->>'phone',
      r->>'workplace',
      r->>'position',
      r->>'work_duration',
      r->>'notes'
    FROM jsonb_array_elements(p_refs) AS r;
  END IF;

  -- Atualizar preferências de exibição
  UPDATE caregiver_profiles SET
    show_refs_to_subscribers = p_show_refs_to_subscribers,
    mask_reference_phones    = p_mask_reference_phones,
    show_reference_full_names = p_show_reference_full_names
  WHERE id = p_caregiver_id;
END;
$$;

-- Revogar execução pública e permitir apenas usuários autenticados
REVOKE ALL ON FUNCTION replace_professional_references FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_professional_references TO authenticated;
