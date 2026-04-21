-- RPC: preview seguro de documentos e referências para famílias não-assinantes.
-- Retorna metadados (SEM file_url) de documentos visíveis e a contagem de referências,
-- permitindo que a UI mostre as seções com CTA "Assine para visualizar".
--
-- SECURITY DEFINER: contorna RLS que bloqueia leitura para não-assinantes,
-- expondo apenas dados não-sensíveis (tipo, nome do arquivo, status, contagem).

create or replace function public.get_caregiver_gated_preview(p_caregiver_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_public boolean;
  v_documents jsonb;
  v_reference_count int;
begin
  -- Só expõe preview de cuidadores com perfil completo (mesmo gating da busca pública)
  select profile_complete
    into v_is_public
    from caregiver_profiles
   where id = p_caregiver_id;

  if coalesce(v_is_public, false) = false then
    return jsonb_build_object('documents', '[]'::jsonb, 'reference_count', 0);
  end if;

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id',        d.id,
             'type',      d.type,
             'file_name', d.file_name,
             'status',    d.status
           )
           order by d.created_at asc
         ), '[]'::jsonb)
    into v_documents
    from caregiver_documents d
   where d.caregiver_id = p_caregiver_id
     and d.is_visible = true
     and d.type <> 'rg_cnh';

  select case when cp.has_references and cp.show_refs_to_subscribers
                then count(pr.id)::int
                else 0
           end
    into v_reference_count
    from caregiver_profiles cp
    left join professional_references pr on pr.caregiver_id = cp.id
   where cp.id = p_caregiver_id
   group by cp.has_references, cp.show_refs_to_subscribers;

  return jsonb_build_object(
    'documents',       v_documents,
    'reference_count', coalesce(v_reference_count, 0)
  );
end;
$$;

revoke all on function public.get_caregiver_gated_preview(uuid) from public;
grant execute on function public.get_caregiver_gated_preview(uuid) to authenticated;
