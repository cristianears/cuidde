// ─── Constantes compartilhadas ───────────────────────────────────────────────

// Upload de documentos
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const
export const ALLOWED_FILE_EXTS = ['pdf', 'jpg', 'jpeg', 'png'] as const

// Busca por proximidade
export const DEFAULT_RADIUS_KM = 20
export const MAX_PRICE_PER_HOUR = 200
