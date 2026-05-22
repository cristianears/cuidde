import { describe, it, expect } from 'vitest'
import {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  MAX_AVATAR_SIZE,
  ALLOWED_AVATAR_MIMES,
  ALLOWED_AVATAR_EXTS,
  validateAvatarFile,
  DEFAULT_RADIUS_KM,
  MAX_PRICE_PER_HOUR,
} from '@/lib/constants'

describe('constants', () => {
  it('MAX_FILE_SIZE é 10MB', () => {
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
  })

  it('MAX_AVATAR_SIZE é 5MB', () => {
    expect(MAX_AVATAR_SIZE).toBe(5 * 1024 * 1024)
  })

  it('DEFAULT_RADIUS_KM é 20', () => {
    expect(DEFAULT_RADIUS_KM).toBe(20)
  })

  it('MAX_PRICE_PER_HOUR é 200', () => {
    expect(MAX_PRICE_PER_HOUR).toBe(200)
  })

  it('ALLOWED_MIME_TYPES inclui PDF e imagens', () => {
    expect(ALLOWED_MIME_TYPES).toContain('application/pdf')
    expect(ALLOWED_MIME_TYPES).toContain('image/jpeg')
    expect(ALLOWED_MIME_TYPES).toContain('image/png')
  })

  it('ALLOWED_AVATAR_MIMES inclui formatos de imagem', () => {
    expect(ALLOWED_AVATAR_MIMES).toContain('image/jpeg')
    expect(ALLOWED_AVATAR_MIMES).toContain('image/png')
    expect(ALLOWED_AVATAR_MIMES).toContain('image/webp')
  })

  it('ALLOWED_AVATAR_EXTS inclui extensões corretas', () => {
    expect(ALLOWED_AVATAR_EXTS).toContain('jpg')
    expect(ALLOWED_AVATAR_EXTS).toContain('jpeg')
    expect(ALLOWED_AVATAR_EXTS).toContain('png')
    expect(ALLOWED_AVATAR_EXTS).toContain('webp')
  })
})

describe('validateAvatarFile', () => {
  function makeFile(name: string, size: number, type: string): File {
    const buffer = new ArrayBuffer(size)
    return new File([buffer], name, { type })
  }

  it('aceita arquivo JPEG válido e retorna extensão', () => {
    const file = makeFile('photo.jpg', 1024, 'image/jpeg')
    expect(validateAvatarFile(file)).toBe('jpg')
  })

  it('aceita arquivo PNG válido', () => {
    const file = makeFile('photo.png', 1024, 'image/png')
    expect(validateAvatarFile(file)).toBe('png')
  })

  it('aceita arquivo WebP válido', () => {
    const file = makeFile('photo.webp', 1024, 'image/webp')
    expect(validateAvatarFile(file)).toBe('webp')
  })

  it('rejeita arquivo maior que 5MB', () => {
    const file = makeFile('huge.jpg', 6 * 1024 * 1024, 'image/jpeg')
    expect(() => validateAvatarFile(file)).toThrow('Arquivo muito grande')
  })

  it('rejeita MIME type inválido', () => {
    const file = makeFile('doc.pdf', 1024, 'application/pdf')
    expect(() => validateAvatarFile(file)).toThrow('Formato inválido')
  })

  it('rejeita extensão inválida', () => {
    const file = makeFile('photo.gif', 1024, 'image/jpeg')
    expect(() => validateAvatarFile(file)).toThrow('Extensão de arquivo não permitida')
  })
})
