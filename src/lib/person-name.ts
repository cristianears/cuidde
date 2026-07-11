const LOWERCASE_PARTICLES = new Set(["da", "das", "de", "do", "dos", "e"])
const EMAIL_LIKE_PATTERN = /\S+@\S+\.\S+/
const ALLOWED_NAME_PATTERN = /^[\p{L}\p{M}'’ -]+$/u

function capitalizeNamePart(part: string) {
  if (!part) return part
  return part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1).toLocaleLowerCase("pt-BR")
}

export function normalizePersonName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word, index) => {
      const lowerWord = word.toLocaleLowerCase("pt-BR")
      if (index > 0 && LOWERCASE_PARTICLES.has(lowerWord)) return lowerWord

      return word
        .split(/([-’'])/)
        .map((part) => part === "-" || part === "’" || part === "'" ? part : capitalizeNamePart(part))
        .join("")
    })
    .join(" ")
}

export function getPersonNameError(value: string): string | null {
  const name = value.trim().replace(/\s+/g, " ")

  if (!name) return "Informe seu nome completo."
  if (EMAIL_LIKE_PATTERN.test(name) || name.includes("@")) {
    return "Digite seu nome, não um endereço de e-mail."
  }
  if (/\d/.test(name) || !ALLOWED_NAME_PATTERN.test(name)) {
    return "Use apenas letras, espaços, hífen ou apóstrofo."
  }

  const words = name.split(" ")
  if (words.length < 2) return "Informe pelo menos nome e sobrenome."
  if (words.some((word) => word.length < 2 && word.toLocaleLowerCase("pt-BR") !== "e")) {
    return "Não use apenas iniciais; escreva o nome e o sobrenome completos."
  }

  return null
}

export function isValidPersonName(value: string) {
  return getPersonNameError(value) === null
}
