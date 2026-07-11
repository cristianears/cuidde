import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const root = resolve(__dirname, "../..")
const sql = readFileSync(resolve(root, "supabase/sql/align_caregiver_search_visibility.sql"), "utf8")
const adminActions = readFileSync(resolve(root, "supabase/functions/admin-actions/index.ts"), "utf8")

describe("caregiver search visibility", () => {
  it("uses profile essentials without requiring profession or identity", () => {
    const completeness = sql.slice(
      sql.indexOf("create or replace function public.compute_profile_complete"),
      sql.indexOf("create or replace function public.refresh_caregiver_computed"),
    )
    expect(completeness).toContain("length(btrim(coalesce(v_bio, ''))) >= 150")
    expect(completeness).toContain("v_specialties")
    expect(completeness).toContain("v_modalities")
    expect(completeness).not.toContain("profissao_formacao")
    expect(completeness).not.toContain("caregiver_documents")
  })

  it("grants the identity seal only for an approved identity document", () => {
    expect(sql).toMatch(/type in \('rg', 'rg_cnh'\) and status = 'approved'/)
  })

  it("does not tie admin document review to marketplace visibility", () => {
    expect(adminActions).not.toContain("status: 'rejected', rejection_reason: reason, is_visible: false")
    expect(adminActions).not.toContain("status: 'verified', has_rg_cnh: true, is_visible: true")
  })
})
