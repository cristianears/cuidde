import { supabase } from '@/lib/supabase'
import { validateAvatarFile } from '@/lib/constants'

/**
 * Faz upload de foto de perfil (avatar) e atualiza a URL na tabela indicada.
 * Retorna a URL pública da foto.
 */
export async function uploadAvatar(
  file: File,
  userId: string,
  table: 'caregiver_profiles' | 'family_profiles',
  opts?: { cacheBust?: boolean },
): Promise<string> {
  const ext = validateAvatarFile(file)
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  const publicUrl = opts?.cacheBust
    ? `${urlData.publicUrl}?t=${Date.now()}`
    : urlData.publicUrl

  const { error: updateError } = await supabase
    .from(table)
    .update({ photo_url: publicUrl })
    .eq('id', userId)

  if (updateError) throw updateError

  return publicUrl
}
