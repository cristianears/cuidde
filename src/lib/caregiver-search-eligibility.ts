import { isValidPersonName } from "@/lib/person-name"

export interface CaregiverSearchEligibilityInput {
  fullName: string | null | undefined
  phone: string | null | undefined
  whatsapp: string | null | undefined
  city: string | null | undefined
  neighborhood: string | null | undefined
  bio: string | null | undefined
  specialties: string[] | null | undefined
  modalities: string[] | null | undefined
}

export interface CaregiverSearchRequirement {
  id: string
  label: string
  href: string
  met: boolean
}

function hasValidPhone(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? ""
  return digits.length >= 10 && digits.length <= 13
}

export function getCaregiverSearchEligibility(
  input: CaregiverSearchEligibilityInput,
) {
  const requirements: CaregiverSearchRequirement[] = [
    { id: "name", label: "Informar nome e sobrenome", href: "/caregiver/profile", met: isValidPersonName(input.fullName ?? "") },
    { id: "phone", label: "Informar WhatsApp / telefone válido", href: "/caregiver/profile", met: hasValidPhone(input.whatsapp || input.phone) },
    { id: "location", label: "Informar cidade e bairro", href: "/caregiver/profile", met: !!input.city?.trim() && !!input.neighborhood?.trim() },
    { id: "bio", label: "Completar biografia (mín. 150 caracteres)", href: "/caregiver/profile", met: (input.bio?.trim().length ?? 0) >= 150 },
    { id: "specialties", label: "Selecionar pelo menos uma especialidade", href: "/caregiver/profile", met: (input.specialties?.length ?? 0) > 0 },
    { id: "modalities", label: "Selecionar pelo menos um formato de atendimento", href: "/caregiver/profile", met: (input.modalities?.length ?? 0) > 0 },
  ]

  return {
    eligible: requirements.every((requirement) => requirement.met),
    requirements,
    missing: requirements.filter((requirement) => !requirement.met),
  }
}
