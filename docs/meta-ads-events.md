# Preparação dos eventos da Meta — Pixel ainda desativado

O site continua enviando eventos apenas ao dataLayer/GTM sob consentimento. Não foi criado Pixel, carregado SDK da Meta, habilitado envio para a Meta nem configurada Conversions API.

## Mapeamento para a futura implantação

| Ação interna | Evento futuro da Meta | Condição |
| --- | --- | --- |
| `search_by_cep` | `Search` | Uma busca válida; não disparar também por `begin_lead` |
| `view_caregiver_preview` | Evento personalizado `ViewCaregiverPreview` | Prévia exibida, sem enviar IDs de cuidadores ou informações de saúde |
| `sign_up` com `user_role = family` | `CompleteRegistration` | Conta de família criada com sucesso; não início do formulário |
| `sign_up` com `user_role = caregiver` | Evento personalizado `CaregiverRegistration` | Cadastro de cuidador separado; não usar como conversão da campanha de famílias |
| `view_pricing` | Evento personalizado `ViewPricing` | Planos realmente visíveis na landing; a tela autenticada tem contexto próprio |
| `begin_checkout` | `InitiateCheckout` | Checkout solicitado pela família; não mero clique no plano |
| `purchase` | `Purchase` | Valor, moeda e transação verificados no servidor junto ao Stripe |

Não mapear busca por CEP para `Lead` qualificado. Se futuramente houver captação de contato ou solicitação válida, definir um evento próprio para essa ação. Não mapear escolha do plano gratuito para `StartTrial`, pois atualmente não representa teste de uma assinatura paga.

## Compra e deduplicação

- Usar `ecommerce.value`, `ecommerce.currency` e os IDs dos planos em `ecommerce.items`; não estimar receita a partir do preço mensal anunciado.
- Utilizar um `event_id` estável derivado do identificador de transação verificado para a mesma compra no navegador e na Conversions API.
- Não disparar `Purchase` também por `subscribe_paid_plan`: são sinais da mesma contratação.
- Se a Conversions API for implantada, exigir consentimento, vínculo de atribuição e controle de idempotência no servidor. A chave e o token da Meta ficam exclusivamente no servidor.
- Não enviar nomes, e-mails, telefones, CEP exato, endereço, doenças, medicamentos, texto de perfis ou dados da pessoa cuidada como parâmetros dos eventos.

## Ativação futura

1. Criar/selecionar o Pixel e confirmar o domínio/conta de anúncios corretos.
2. Criar tags específicas no GTM usando este mapeamento e a preferência de consentimento existente.
3. Validar em Eventos de teste da Meta com dados controlados, incluindo separação entre famílias e cuidadores.
4. Configurar a campanha de famílias para sua conversão escolhida e excluir a conversão de cuidadores.
5. Acrescentar Conversions API quando a atribuição, o consentimento e a deduplicação estiverem implementados e testados.

Referência: https://developers.facebook.com/docs/meta-pixel/reference/
