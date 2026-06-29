export type CaregiverProfileGuideStatus = "complete" | "pending" | "optional"

export interface CaregiverProfileGuideInput {
  name: string
  phone: string
  cep: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  bio: string
  profissaoFormacao: string
  specialties: string[]
  referencesCount: number
}

export interface CaregiverProfileGuideStep {
  id: number
  title: string
  status: CaregiverProfileGuideStatus
  statusLabel: string
  helperText: string
  actionLabel: string
}

export interface CaregiverProfileGuide {
  steps: CaregiverProfileGuideStep[]
  completedCount: number
  totalSteps: number
  nextStep: CaregiverProfileGuideStep | null
}

const filled = (value: string) => value.trim().length > 0

export function buildCaregiverProfileGuide(input: CaregiverProfileGuideInput): CaregiverProfileGuide {
  const hasBasicData = [
    input.name,
    input.phone,
    input.cep,
    input.street,
    input.number,
    input.neighborhood,
    input.city,
    input.state,
  ].every(filled)
  const hasBio = input.bio.trim().length >= 150 && filled(input.profissaoFormacao)
  const hasSpecialties = input.specialties.length > 0
  const hasReferences = input.referencesCount > 0

  const steps: CaregiverProfileGuideStep[] = [
    {
      id: 1,
      title: "Dados básicos",
      status: hasBasicData ? "complete" : "pending",
      statusLabel: hasBasicData ? "Completo" : "Falta contato/endereço",
      helperText: "Confirme nome, telefone e endereço para as famílias encontrarem você.",
      actionLabel: "Ir para dados",
    },
    {
      id: 2,
      title: "Biografia",
      status: hasBio ? "complete" : "pending",
      statusLabel: hasBio ? "Completa" : "Falta bio/formação",
      helperText: "Conte sua experiência em pelo menos 150 caracteres e informe sua formação.",
      actionLabel: "Ir para biografia",
    },
    {
      id: 3,
      title: "Especialidades",
      status: hasSpecialties ? "complete" : "pending",
      statusLabel: hasSpecialties ? "Selecionadas" : "Falta selecionar",
      helperText: "Marque as áreas em que atua para aparecer nas buscas certas.",
      actionLabel: "Ir para especialidades",
    },
    {
      id: 4,
      title: "Referências",
      status: hasReferences ? "complete" : "optional",
      statusLabel: hasReferences ? "Adicionadas" : "Diferencial",
      helperText: "Referências profissionais reforçam confiança, mas não bloqueiam seu perfil.",
      actionLabel: "Ir para referências",
    },
  ]

  return {
    steps,
    completedCount: steps.filter((step) => step.status === "complete").length,
    totalSteps: steps.length,
    nextStep: steps.find((step) => step.status !== "complete") ?? null,
  }
}
