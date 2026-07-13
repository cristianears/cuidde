import type { CaregiverPublic, FamilyJobCareType, FamilyJobPost } from "@/types/database";

export const FAMILY_JOB_CARE_TYPES: Array<{ value: FamilyJobCareType; label: string; description: string }> = [
  { value: "plantao", label: "Plantão", description: "Atendimento contínuo por 12h, 24h ou período definido." },
  { value: "mensalista", label: "Mensalista", description: "Rotina fixa por mês, com dias e horários combinados." },
  { value: "diaria", label: "Diária", description: "Atendimento por dia completo ou avulso." },
  { value: "turno", label: "Turno", description: "Manhã, tarde, noite ou pernoite." },
  { value: "a_combinar", label: "A combinar", description: "Quando a família ainda está aberta a formatos." },
];

export const FAMILY_JOB_DAYS = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sáb" },
  { value: "dom", label: "Dom" },
] as const;

export const FAMILY_JOB_PERIODS = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
  { value: "pernoite", label: "Pernoite" },
] as const;

export const FAMILY_JOB_ACTIVITIES = [
  "Companhia",
  "Banho e higiene",
  "Alimentação",
  "Medicação",
  "Mobilidade/transferência",
  "Acompanhamento em consultas",
  "Organização da rotina",
  "Estímulo cognitivo",
  "Cuidados noturnos",
  "Pós-operatório",
  "Alzheimer/demência",
  "Pessoa acamada",
] as const;

export const FAMILY_JOB_REQUIREMENTS = [
  "Experiência com idosos",
  "Experiência com Alzheimer/demência",
  "Referências profissionais",
  "Certificado/curso",
  "Técnico(a) de enfermagem",
  "Enfermeiro(a)",
  "CNH",
  "Disponibilidade para dormir",
  "Disponibilidade aos fins de semana",
  "Não fumante",
  "Aceita animais na casa",
] as const;

const CARE_TYPE_TO_APPOINTMENT_TYPE: Record<FamilyJobCareType, "plantão" | "contínuo" | "turno" | null> = {
  plantao: "plantão",
  mensalista: "contínuo",
  diaria: "plantão",
  turno: "turno",
  a_combinar: null,
};

function labelsFor(values: string[], options: readonly { value: string; label: string }[]) {
  const map = new Map(options.map((option) => [option.value, option.label]));
  return values.map((value) => map.get(value) ?? value);
}

function joinList(items: string[], fallback = "") {
  const filtered = items.map((item) => item.trim()).filter(Boolean);
  if (filtered.length === 0) return fallback;
  if (filtered.length === 1) return filtered[0];
  return `${filtered.slice(0, -1).join(", ")} e ${filtered[filtered.length - 1]}`;
}

export function familyJobCareTypeLabel(value: FamilyJobCareType | null | undefined) {
  return FAMILY_JOB_CARE_TYPES.find((item) => item.value === value)?.label ?? null;
}

export function appointmentTypeFromFamilyJob(value: FamilyJobCareType | null | undefined) {
  return value ? CARE_TYPE_TO_APPOINTMENT_TYPE[value] : null;
}

export function buildFamilyJobSummary(job: Partial<FamilyJobPost> | null | undefined) {
  if (!job) return "";

  const parts: string[] = [];
  const careType = familyJobCareTypeLabel(job.care_type);
  const location = [job.neighborhood, job.city].filter(Boolean).join(", ");
  const periods = joinList(labelsFor(job.schedule_periods ?? [], FAMILY_JOB_PERIODS));
  const days = joinList(labelsFor(job.schedule_days ?? [], FAMILY_JOB_DAYS));
  const activities = joinList(job.activities ?? []);
  const requirements = joinList(job.requirements ?? []);

  if (location) parts.push(`Atendimento em ${location}.`);
  if (careType) parts.push(`Tipo de atendimento: ${careType}.`);
  if (days || periods || job.specific_schedule) {
    const schedule = [days && `dias: ${days}`, periods && `períodos: ${periods}`, job.specific_schedule]
      .filter(Boolean)
      .join("; ");
    parts.push(`Horário desejado: ${schedule}.`);
  }
  if (activities) parts.push(`Atividades esperadas: ${activities}.`);
  if (requirements) parts.push(`Requisitos desejados: ${requirements}.`);
  if (job.notes?.trim()) parts.push(job.notes.trim());

  return parts.join(" ");
}

export function buildFamilyJobOutreachText(job: Partial<FamilyJobPost> & { family_name?: string | null }) {
  const careType = familyJobCareTypeLabel(job.care_type)?.toLowerCase();
  const location = [job.neighborhood, job.city].filter(Boolean).join(", ");
  const activities = joinList(job.activities ?? []);
  const requirements = joinList(job.requirements ?? []);
  const schedule = joinList([
    ...labelsFor(job.schedule_days ?? [], FAMILY_JOB_DAYS),
    ...labelsFor(job.schedule_periods ?? [], FAMILY_JOB_PERIODS),
  ]);

  return [
    `Família${location ? ` em ${location}` : ""} busca cuidador(a)${careType ? ` para ${careType}` : ""}.`,
    schedule ? `Disponibilidade desejada: ${schedule}.` : "",
    activities ? `Atividades: ${activities}.` : "",
    requirements ? `Diferenciais: ${requirements}.` : "",
    "Cadastro gratuito para cuidadores na icuide.",
  ].filter(Boolean).join(" ");
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function hasAnyNormalized(source: string[], needles: string[]) {
  const normalizedSource = source.map(normalize);
  return needles.some((needle) => normalizedSource.some((item) => item.includes(normalize(needle))));
}

export function computeFamilyJobCompatibilityScore(caregiver: CaregiverPublic, job: Partial<FamilyJobPost> | null | undefined) {
  if (!job?.is_active) return 0;

  let score = 0;

  if (job.care_type) {
    if (job.care_type === "plantao" && hasAnyNormalized(caregiver.modalities, ["plant", "plantão", "plantoes"])) score += 10;
    if (job.care_type === "diaria" && hasAnyNormalized(caregiver.modalities, ["diaria", "diárias"])) score += 10;
    if (job.care_type === "turno" && hasAnyNormalized(caregiver.modalities, ["turno", "meio período", "6h"])) score += 8;
    if (job.care_type === "mensalista" && hasAnyNormalized(caregiver.modalities, ["contínuo", "continuo", "integral", "mensal"])) score += 8;
    if (job.care_type === "a_combinar" && caregiver.modalities.length > 0) score += 3;
  }

  const combinedCaregiverTags = [...caregiver.specialties, ...caregiver.modalities];
  const activities = job.activities ?? [];
  const requirements = job.requirements ?? [];

  score += Math.min(18, activities.filter((activity) => hasAnyNormalized(combinedCaregiverTags, [activity])).length * 4);
  score += Math.min(12, requirements.filter((requirement) => hasAnyNormalized(combinedCaregiverTags, [requirement])).length * 3);

  if (requirements.includes("Referências profissionais") && caregiver.has_references) score += 5;
  if (requirements.includes("Certificado/curso") && caregiver.has_certificado) score += 4;
  if (requirements.includes("CNH") && caregiver.possui_cnh) score += 4;
  if (requirements.includes("Disponibilidade aos fins de semana") && hasAnyNormalized(caregiver.modalities, ["final de semana", "fim de semana"])) score += 3;

  return score;
}
