import type { CaregiverDocument, DocumentType } from "@/types/database";

export const DOC_DEFINITIONS: { type: DocumentType; label: string; required: boolean; hint: string }[] = [
  {
    type: "rg_cnh",
    label: "RG ou CNH",
    required: true,
    hint: "Envie frente e verso em uma única imagem ou PDF.",
  },
  {
    type: "curriculo",
    label: "Currículo",
    required: false,
    hint: "Formatos aceitos: PDF, JPG ou PNG.",
  },
  {
    type: "certificacao",
    label: "Certificações",
    required: false,
    hint: "Se tiver mais de uma, junte todas em um único PDF antes de enviar.",
  },
  {
    type: "antecedentes",
    label: "Antecedentes Criminais",
    required: false,
    hint: "Certidão negativa emitida nos últimos 90 dias. Junte federal e estadual em um único PDF.",
  },
];

function makeEmptyDoc(type: DocumentType, required: boolean): CaregiverDocument {
  return {
    id: `empty-${type}`,
    caregiver_id: "",
    type,
    file_url: null,
    file_name: null,
    status: "pending",
    is_visible: true,
    required,
    rejection_reason: null,
    reviewed_at: null,
    uploaded_at: null,
    created_at: "",
  };
}

export function buildDocumentSlots(realDocs: CaregiverDocument[]): CaregiverDocument[] {
  return DOC_DEFINITIONS.map(({ type, required }) => {
    const doc = realDocs.find((item) => item.type === type);
    return doc ? { ...doc, required } : makeEmptyDoc(type, required);
  });
}
