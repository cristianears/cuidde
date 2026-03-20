// ─── Constantes compartilhadas ───────────────────────────────────────────────

// Upload de documentos
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const
export const ALLOWED_FILE_EXTS = ['pdf', 'jpg', 'jpeg', 'png'] as const

// Upload de avatar (foto de perfil)
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5 MB
export const ALLOWED_AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const ALLOWED_AVATAR_EXTS = ['jpg', 'jpeg', 'png', 'webp'] as const

/**
 * Valida um arquivo de avatar (tamanho, MIME type, extensão).
 * Lança Error com mensagem amigável se inválido.
 * Retorna a extensão normalizada.
 */
export function validateAvatarFile(file: File): string {
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error('Arquivo muito grande. Máximo permitido: 5MB.')
  }
  if (!ALLOWED_AVATAR_MIMES.includes(file.type as typeof ALLOWED_AVATAR_MIMES[number])) {
    throw new Error('Formato inválido. Use JPG, PNG ou WebP.')
  }
  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  if (!ALLOWED_AVATAR_EXTS.includes(ext as typeof ALLOWED_AVATAR_EXTS[number])) {
    throw new Error('Extensão de arquivo não permitida.')
  }
  return ext
}

// Busca por proximidade
export const DEFAULT_RADIUS_KM = 20
export const MAX_PRICE_PER_HOUR = 200
