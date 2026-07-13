import { describe, expect, it } from "vitest"

import { privateVisibilityFilter } from "../private-caregiver-visibility"

describe("private caregiver visibility", () => {
  it("keeps the normal public visibility condition when adding private profiles", () => {
    expect(privateVisibilityFilter(["caregiver-1", "caregiver-2"])).toBe(
      "is_visible.eq.true,id.in.(caregiver-1,caregiver-2)",
    )
  })

  it("does not create an OR filter without private profiles", () => {
    expect(privateVisibilityFilter([])).toBeNull()
  })
})
