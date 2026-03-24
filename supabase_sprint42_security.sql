-- ═══════════════════════════════════════════════════════════════════════════
-- Sprint 4.2 — Security fixes para messages
-- Executar no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Separar a policy de messages em SELECT e INSERT para controlar sender_id
--    A policy atual permite que um participante insira mensagem com sender_id
--    de outro usuário (spoofing). Vamos criar policies separadas.

-- Remover a policy antiga (se existir)
DROP POLICY IF EXISTS "messages: participantes do agendamento" ON messages;

-- SELECT: participantes podem ler mensagens do seu agendamento
CREATE POLICY "messages: select para participantes"
  ON messages FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments
      WHERE family_id = auth.uid() OR caregiver_id = auth.uid()
    )
  );

-- INSERT: participantes podem enviar mensagens, mas sender_id DEVE ser o próprio uid
CREATE POLICY "messages: insert com sender_id validado"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND appointment_id IN (
      SELECT id FROM appointments
      WHERE family_id = auth.uid() OR caregiver_id = auth.uid()
    )
  );

-- UPDATE: apenas para marcar como lido (read_at) — somente mensagens recebidas
CREATE POLICY "messages: update read_at para destinatário"
  ON messages FOR UPDATE
  USING (
    sender_id != auth.uid()
    AND appointment_id IN (
      SELECT id FROM appointments
      WHERE family_id = auth.uid() OR caregiver_id = auth.uid()
    )
  )
  WITH CHECK (
    sender_id != auth.uid()
    AND appointment_id IN (
      SELECT id FROM appointments
      WHERE family_id = auth.uid() OR caregiver_id = auth.uid()
    )
  );

-- 2. Limite de tamanho de mensagem no banco (defesa em profundidade)
ALTER TABLE messages ADD CONSTRAINT messages_content_max_length
  CHECK (char_length(content) <= 2000);

-- 3. Garantir que read_at tem default NULL (para não exigir no INSERT)
ALTER TABLE messages ALTER COLUMN read_at SET DEFAULT NULL;
