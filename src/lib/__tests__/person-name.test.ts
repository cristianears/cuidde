import { describe, expect, it } from "vitest"

import { getPersonNameError, isValidPersonName, normalizePersonName } from "../person-name"

describe("person name", () => {
  it("normalizes capitalization and Portuguese particles", () => {
    expect(normalizePersonName("  MARIA   DE SOUZA  ")).toBe("Maria de Souza")
    expect(normalizePersonName("joão d'ávila")).toBe("João D'Ávila")
  })

  it("rejects emails, digits, single names and initials", () => {
    expect(getPersonNameError("alanriba15@gmail.com")).toMatch(/e-mail/i)
    expect(isValidPersonName("Maria 2 Silva")).toBe(false)
    expect(isValidPersonName("Maria")).toBe(false)
    expect(getPersonNameError("P G")).toMatch(/iniciais/i)
  })

  it("accepts complete names with accents and connectives", () => {
    expect(isValidPersonName("Ana de Sá")).toBe(true)
    expect(isValidPersonName("Maria e Silva")).toBe(true)
  })
})
