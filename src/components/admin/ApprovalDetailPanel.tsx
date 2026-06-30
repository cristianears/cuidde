import {
  Mail,
  Phone,
  GraduationCap,
  Award,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DocumentChecklist from "./DocumentChecklist";
import type { Caregiver } from "@/data/mockData";
import type { AdminDocumentRow } from "@/hooks/useAdmin";

function getMockRegistration(caregiver: Caregiver) {
  if (!caregiver.hasProfessionalRegistration) return null;
  const registrations: Record<string, { council: string; number: string; uf: string }> = {
    "Técnica em Enfermagem": { council: "COREN", number: "SP-123456", uf: "SP" },
    "Técnico em Enfermagem": { council: "COREN", number: "SP-789012", uf: "SP" },
    Enfermeiro: { council: "COREN", number: "SP-345678", uf: "SP" },
    Fisioterapeuta: { council: "CREFITO", number: "3/98765-F", uf: "SP" },
    "Terapeuta Ocupacional": { council: "CREFITO", number: "3/54321-TO", uf: "SP" },
  };
  return registrations[caregiver.profissaoFormacao] || { council: "Outro", number: "N/A", uf: caregiver.address.state };
}

function getProfileStatusLabel(
  caregiverStatus: string,
  documents: AdminDocumentRow[],
): { label: string; className: string } {
  const rgDoc = documents.find((d) => d.type === "rg_cnh" || d.type === "rg");

  // If RG_CNH exists and is not rejected as illegible → "Perfil Ok"
  if (
    rgDoc &&
    rgDoc.file_url &&
    rgDoc.status !== "rejected" &&
    (caregiverStatus === "verified" || caregiverStatus === "analyzing")
  ) {
    return {
      label: "Perfil Ok",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  // If rejected with illegibility reason
  if (caregiverStatus === "rejected" || rgDoc?.status === "rejected") {
    return {
      label: "Documento não legível",
      className: "bg-red-50 text-red-700 border-red-200",
    };
  }

  // Pending
  return {
    label: "Pendente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  };
}

interface ApprovalDetailPanelProps {
  caregiver: Caregiver;
  documents: AdminDocumentRow[];
  readOnly?: boolean;
}

const ApprovalDetailPanel = ({
  caregiver,
  documents,
}: ApprovalDetailPanelProps) => {
  const registration = getMockRegistration(caregiver);
  const profileStatus = getProfileStatusLabel(caregiver.status, documents);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <img
            src={caregiver.photo}
            alt={caregiver.name}
            className="w-16 h-16 rounded-2xl object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {caregiver.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {caregiver.address.city}/{caregiver.address.state}
            </p>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border mt-1.5 ${profileStatus.className}`}
            >
              {profileStatus.label}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contact Info */}
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Identificação
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{caregiver.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{caregiver.phone}</span>
            </div>
          </div>
        </section>

        {/* Profession & Training */}
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Profissão / Formação
          </h4>
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <span>{caregiver.profissaoFormacao || "Não informado"}</span>
          </div>
        </section>

        {/* Professional Registration */}
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Registro Profissional
          </h4>
          {registration ? (
            <div className="flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-muted-foreground" />
              <span>
                {registration.council} — {registration.number} ({registration.uf})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              <span>Sem registro profissional informado</span>
            </div>
          )}
        </section>

        {/* Document Checklist */}
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Documentos a serem revisados
          </h4>
          <DocumentChecklist caregiverId={caregiver.id} documents={documents} />
        </section>
      </CardContent>
    </Card>
  );
};

export const DetailPanelSkeleton = () => (
  <Card className="lg:col-span-2">
    <CardHeader>
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={`doc-${i}`} className="h-14 w-full rounded-xl" />
      ))}
    </CardContent>
  </Card>
);

export default ApprovalDetailPanel;
