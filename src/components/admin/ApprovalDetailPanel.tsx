import { useState } from "react";
import {
  Check,
  X,
  Mail,
  Phone,
  GraduationCap,
  Award,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/shared/StatusBadge";
import DocumentChecklist from "./DocumentChecklist";
import RejectionDialog from "./RejectionDialog";
import type { Caregiver, Document } from "@/data/mockData";

// Mock professional registration info based on profession
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

interface ApprovalDetailPanelProps {
  caregiver: Caregiver;
  documents: Document[];
  readOnly?: boolean;
  onApprove: (caregiverId: string) => void;
  onReject: (caregiverId: string, reason: string) => void;
}

const ApprovalDetailPanel = ({
  caregiver,
  documents,
  readOnly = false,
  onApprove,
  onReject,
}: ApprovalDetailPanelProps) => {
  const [rejectionOpen, setRejectionOpen] = useState(false);
  const registration = getMockRegistration(caregiver);

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Identity */}
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
                <StatusBadge status={caregiver.status} className="mt-1.5" />
              </div>
            </div>

            {/* Actions */}
            {!readOnly && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/5"
                  onClick={() => setRejectionOpen(true)}
                >
                  <X className="w-4 h-4" />
                  Reprovar
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => onApprove(caregiver.id)}
                >
                  <Check className="w-4 h-4" />
                  Aprovar
                </Button>
              </div>
            )}
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
              Documentos para Verificação
            </h4>
            <DocumentChecklist documents={documents} />
          </section>
        </CardContent>
      </Card>

      <RejectionDialog
        open={rejectionOpen}
        caregiverName={caregiver.name}
        onClose={() => setRejectionOpen(false)}
        onConfirm={(reason) => {
          setRejectionOpen(false);
          onReject(caregiver.id, reason);
        }}
      />
    </>
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
