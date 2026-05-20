# Backup RLS Policies

Data: 2026-05-07
Ambiente: Supabase producao

## Contexto

Backup das policies RLS antes/depois do ajuste de busca publica de cuidadores.

Este registro serve para rastrear o estado das policies aplicadas no Supabase e evitar regressao na busca por cuidadores, especialmente no fluxo de CEP/proximidade.

## Regra atual da busca de cuidadores

O cuidador aparece no marketplace quando:

- `profile_complete = true`
- `has_rg_cnh = true`
- `is_available_for_new = true`

A busca nao depende de `status = 'verified'`.

O campo `status` pode continuar existindo para fluxos administrativos, mas nao deve controlar a visibilidade do cuidador no marketplace.

## Export CSV

Arquivo exportado do Supabase SQL Editor:

`rls-policies-2026-05-07.csv`

## Query usada

```sql
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

## Observacoes

- Salvar o CSV exportado junto deste arquivo ou em uma pasta de auditoria do projeto.
- Antes de alterar RLS novamente, repetir a query acima e comparar com o backup anterior.
- Evitar aplicar policies que condicionem a busca publica a `status = 'verified'`, pois a regra atual usa perfil minimo completo e RG/CNH valido como arquivo.
