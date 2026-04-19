import { useState } from "react";
import { Clock } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import ApprovalCaregiverList, { ApprovalListSkeleton } from "@/components/admin/ApprovalCaregiverList";
import ApprovalDetailPanel, { DetailPanelSkeleton } from "@/components/admin/ApprovalDetailPanel";
import { Card } from "@/components/ui/card";
import {
  useAdminCaregivers,
  useAdminCaregiverDetail,
  useAdminCaregiverDocuments,
  useAdminCaregiverCounts,
} from "@/hooks/useAdmin";
import type { AdminCaregiverRow, AdminCaregiverDetail } from "@/hooks/useAdmin";
import type { Caregiver } from "@/data/mockData";
import type { CaregiverStatus } from "@/types/database";

type ApprovalTab = "pending";

const PROFISSAO_LABEL: Record<string, string> = {
  cuidador: "Cuidador",
  tecnico_enfermagem: "Técnica em Enfermagem",
  auxiliar_enfermagem: "Auxiliar de Enfermagem",
  enfermeiro: "Enfermeiro",
  fisioterapeuta: "Fisioterapeuta",
  terapeuta_ocupacional: "Terapeuta Ocupacional",
  outro: "Outro",
};

function toMockCaregiver(row: AdminCaregiverRow, detail?: AdminCaregiverDetail): Caregiver {
  return {
    id: row.id,
    name: row.full_name ?? "Sem nome",
    email: detail?.email ?? "",
    phone: row.phone ?? "",
    whatsapp: detail?.whatsapp ?? row.phone ?? "",
    photo: row.photo_url ?? "/placeholder.svg",
    bio: detail?.bio ?? "",
    address: {
      cep: "",
      street: "",
      number: "",
      neighborhood: "",
      city: row.city ?? "",
      state: row.state ?? "",
    },
    specialties: detail?.specialties ?? [],
    modalities: detail?.modalities ?? [],
    pricePerHour: detail?.price_per_hour ?? 0,
    pricePerDay: detail?.price_per_day ?? 0,
    emergencyAvailable: detail?.emergency_available ?? false,
    hasInsurance: detail?.has_insurance ?? false,
    status: row.status,
    rating: 0,
    reviewCount: 0,
    createdAt: row.created_at,
    documentsComplete: false,
    profileComplete: false,
    profissaoFormacao: PROFISSAO_LABEL[row.profissao_formacao ?? ""] ?? row.profissao_formacao ?? "",
    totalAtendimentos: 0,
    hasProfessionalRegistration: !!row.professional_reg_number,
    hasCNH: detail?.possui_cnh ?? false,
    idiomas: detail?.idiomas ?? [],
    experienceYears: detail?.experience_years,
  };
}

const ApprovalQueue = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: caregivers = [], isLoading: loadingList } = useAdminCaregivers("pending" as CaregiverStatus);
  const { data: detail, isLoading: loadingDetail } = useAdminCaregiverDetail(selectedId);
  const { data: documents = [], isLoading: loadingDocs } = useAdminCaregiverDocuments(selectedId);
  const { data: counts } = useAdminCaregiverCounts();

  const selectedRow = caregivers.find((c) => c.id === selectedId) ?? null;
  const selectedCaregiver = selectedRow ? toMockCaregiver(selectedRow, detail) : null;
  const mockCaregivers: Caregiver[] = caregivers.map((c) => toMockCaregiver(c));

  const pendingCount   = counts?.["pending"]   ?? caregivers.length;
  const analyzingCount = counts?.["analyzing"] ?? 0;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="admin" userName="Administrador" />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Revisões"
          description="Revisão de documentos de identificação dos cuidadores"
        />

        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Pendentes</span>
              {pendingCount > 0 && (
                <span className="text-[11px] bg-muted px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>

            {analyzingCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                {analyzingCount === 1
                  ? "1 cuidador aguardando reenvio de documento"
                  : `${analyzingCount} cuidadores aguardando reenvio de documento`}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {loadingList ? (
              <ApprovalListSkeleton />
            ) : (
              <ApprovalCaregiverList
                caregivers={mockCaregivers}
                selectedId={selectedId}
                onSelect={(c) => setSelectedId(c.id)}
                tabLabel="Pendentes"
              />
            )}

            {selectedId && (loadingDetail || loadingDocs) ? (
              <DetailPanelSkeleton />
            ) : selectedCaregiver ? (
              <ApprovalDetailPanel
                caregiver={selectedCaregiver}
                documents={documents}
              />
            ) : (
              <Card className="lg:col-span-2 flex items-center justify-center min-h-[400px]">
                <p className="text-sm text-muted-foreground">
                  Selecione um cuidador para ver detalhes
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApprovalQueue;
