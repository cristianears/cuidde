export function getFirstName(name: string | null | undefined, fallback = '') {
  const trimmed = name?.trim()
  if (!trimmed) return fallback
  return trimmed.split(/\s+/)[0]
}

export function getInitials(name: string | null | undefined) {
  const firstName = getFirstName(name)
  return firstName ? firstName[0].toUpperCase() : ''
}
