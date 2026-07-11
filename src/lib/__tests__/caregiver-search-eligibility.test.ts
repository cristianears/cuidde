import { describe, expect, it } from "vitest"

import { getCaregiverSearchEligibility } from "../caregiver-search-eligibility"

const completeProfile = {
  fullName: "Maria da Silva",
  phone: "(12) 99999-9999",
  whatsapp: null,
  city: "Jacareí",
  neighborhood: "Centro",
  bio: "A".repeat(150),
  specialties: ["Alzheimer"],
  modalities: ["Plantão"],
}

describe("caregiver search eligibility", () => {
  it("accepts the minimum profile without profession or identity documents", () => {
    expect(getCaregiverSearchEligibility(completeProfile).eligible).toBe(true)
  })

  it("identifies each missing search requirement", () => {
    const result = getCaregiverSearchEligibility({
      ...completeProfile,
      bio: "Curta",
      modalities: [],
    })

    expect(result.eligible).toBe(false)
    expect(result.missing.map((item) => item.id)).toEqual(["bio", "modalities"])
  })
})
