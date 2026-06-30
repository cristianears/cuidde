import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, MessageCircle, Search, User } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import DocumentChecklist from "@/components/admin/DocumentChecklist";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/display-name";
import { useAdminCaregiverDetail, useAdminCaregiverDocuments, useAdminCaregivers } from "@/hooks/useAdmin";
import type { AdminCaregiverDetail, AdminCaregiverRow, AdminDocumentRow } from "@/hooks/useAdmin";
import type { CaregiverStatus } from "@/types/database";

type StatusFilter = "all" | CaregiverStatus;

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "Todos",
  pending: "Pendentes",
  analyzing: "Em analise",
  verified: "Verificados",
  rejected: "Rejeitados",
};

const STATUS_BADGE: Record<CaregiverStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "border-amber-200 bg-amber-50 text-amber-700" },
  analyzing: { label: "Em analise", className: "border-blue-200 bg-blue-50 text-blue-700" },
  verified: { label: "Verificado", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejeitado", className: "border-red-200 bg-red-50 text-red-700" },
};

function formatLocation(caregiver: Pick<AdminCaregiverRow, "neighborhood" | "city" | "state">) {
  const cityState = [caregiver.city, caregiver.state].filter(Boolean).join("/");
  return [caregiver.neighborhood, cityState].filter(Boolean).join(" - ") || "Localizacao nao informada";
}

function formatCurrency(value: number | null) {
  if (!value) return "Nao informado";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPhoneForWhatsapp(phone: string | null) {
  return phone?.replace(/\D/g, "") ?? "";
}

function getReviewItems(detail: AdminCaregiverDetail | undefined, documents: AdminDocumentRow[]) {
  const hasDocument = documents.some((doc) => (doc.type === "rg_cnh" || doc.type === "rg") && !!doc.file_url && doc.status !== "rejected");
  return [
    { label: "Foto real", done: !!detail?.photo_url },
    { label: "Bio com experiencia", done: !!detail?.bio && detail.bio.trim().length >= 80 },
    { label: "Regiao de atendimento", done: !!detail?.city && !!detail?.state },
    { label: "Servicos ou modalidades", done: (detail?.specialties?.length ?? 0) > 0 || (detail?.modalities?.length ?? 0) > 0 },
    { label: "Disponibilidade", done: !!detail?.is_available_for_new || (detail?.journey_types?.length ?? 0) > 0 || !!detail?.availability_notes },
    { label: "Valores", done: !!detail?.price_per_hour || !!detail?.price_per_day },
    { label: "Documento enviado", done: hasDocument },
    { label: "Formacao ou referencias", done: !!detail?.has_references || !!detail?.formacao_complementar || !!detail?.profissao_formacao },
  ];
}

function CaregiverListItem({ caregiver, selected, onSelect }: { caregiver: AdminCaregiverRow; selected: boolean; onSelect: () => void }) {
  const status = STATUS_BADGE[caregiver.status];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn("w-full rounded-lg border p-3 text-left transition-colors", selected ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50")}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 rounded-xl">
          <AvatarImage src={caregiver.photo_url ?? undefined} alt={caregiver.full_name ?? "Cuidador"} />
          <AvatarFallback className="rounded-xl">{getInitials(caregiver.full_name ?? "Cuidador") || <User className="h-4 w-4" />}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-foreground">{caregiver.full_name ?? "Sem nome"}</p>
            {caregiver.profile_complete ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{formatLocation(caregiver)}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", status.className)}>{status.label}</span>
            <span className="text-[11px] text-muted-foreground">{new Date(caregiver.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ProfileDetail({ detail, documents }: { detail: AdminCaregiverDetail; documents: AdminDocumentRow[] }) {
  const items = getReviewItems(detail, documents);
  const completed = items.filter((item) => item.done).length;
  const score = Math.round((completed / items.length) * 100);
  const whatsappPhone = formatPhoneForWhatsapp(detail.whatsapp ?? detail.phone);
  const status = STATUS_BADGE[detail.status];

  return (
    <div className="flex flex-col gap-4 lg:col-span-2">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-2xl">
                <AvatarImage src={detail.photo_url ?? undefined} alt={detail.full_name ?? "Cuidador"} />
                <AvatarFallback className="rounded-2xl text-lg">{getInitials(detail.full_name ?? "Cuidador") || <User className="h-5 w-5" />}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{detail.full_name ?? "Sem nome"}</h2>
                <p className="text-sm text-muted-foreground">{formatLocation(detail)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={status.className}>{status.label}</Badge>
                  <Badge variant={detail.profile_complete ? "default" : "secondary"}>{detail.profile_complete ? "Perfil completo" : "Perfil incompleto"}</Badge>
                  <Badge variant={detail.is_visible ? "default" : "outline"}>{detail.is_visible ? "Visivel" : "Oculto"}</Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {whatsappPhone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados do perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoBox label="Telefone" value={detail.phone ?? detail.whatsapp} />
              <InfoBox label="Endereco" value={[detail.street, detail.number, detail.neighborhood, detail.city, detail.state].filter(Boolean).join(", ")} />
              <InfoBox label="Formacao" value={detail.profissao_formacao ?? detail.formacao_complementar} />
              <InfoBox label="Disponibilidade" value={detail.availability_notes ?? detail.journey_types?.join(", ")} />
              <InfoBox label="Documentos" value={`${documents.length} documento(s) no cadastro`} />
              <InfoBox label="Valores" value={`Hora: ${formatCurrency(detail.price_per_hour)} | Diaria: ${formatCurrency(detail.price_per_day)}`} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Apresentacao</h3>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">{detail.bio || "Sem biografia preenchida."}</div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Servicos</h3>
              <div className="flex flex-wrap gap-2">
                {[...(detail.specialties ?? []), ...(detail.modalities ?? [])].length > 0 ? (
                  [...(detail.specialties ?? []), ...(detail.modalities ?? [])].map((item) => <Badge key={item} variant="secondary">{item}</Badge>)
                ) : (
                  <span className="text-sm text-muted-foreground">Nao informado</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">Qualidade <span className="text-sm font-semibold text-primary">{score}%</span></CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />}
                <span>{item.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Documentos enviados</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentChecklist caregiverId={detail.id} documents={documents} />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm text-foreground">{value || "Nao informado"}</div>
    </div>
  );
}

const CaregiverProfilesReview = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: caregivers = [], isLoading } = useAdminCaregivers("all");
  const { data: detail, isLoading: loadingDetail } = useAdminCaregiverDetail(selectedId);
  const { data: documents = [], isLoading: loadingDocuments } = useAdminCaregiverDocuments(selectedId);

  const filteredCaregivers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return caregivers.filter((caregiver) => {
      const matchesStatus = statusFilter === "all" || caregiver.status === statusFilter;
      const haystack = [caregiver.full_name, caregiver.phone, caregiver.city, caregiver.neighborhood, caregiver.profissao_formacao].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!normalizedSearch || haystack.includes(normalizedSearch));
    });
  }, [caregivers, search, statusFilter]);

  const counts = useMemo(() => caregivers.reduce<Record<StatusFilter, number>>((acc, caregiver) => {
    acc.all += 1;
    acc[caregiver.status] += 1;
    return acc;
  }, { all: 0, pending: 0, analyzing: 0, verified: 0, rejected: 0 }), [caregivers]);

  useEffect(() => {
    if (selectedId && filteredCaregivers.some((caregiver) => caregiver.id === selectedId)) return;
    setSelectedId(filteredCaregivers[0]?.id ?? null);
  }, [filteredCaregivers, selectedId]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="admin" userName="Administrador" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PageHeader title="Cuidadores" description="Revise cada perfil antes de liberar visibilidade para familias" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Perfis cadastrados</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, telefone ou cidade" className="pl-9" />
              </div>
              <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)} className="min-w-0">
                <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto p-1">
                  {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((status) => (
                    <TabsTrigger key={status} value={status} className="shrink-0 whitespace-nowrap px-3 text-xs">{STATUS_LABELS[status]} ({counts[status]})</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex max-h-[calc(100vh-22rem)] min-h-[360px] flex-col gap-2 overflow-y-auto pr-1">
                {isLoading ? [1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-20 w-full rounded-lg" />) : filteredCaregivers.length > 0 ? (
                  filteredCaregivers.map((caregiver) => <CaregiverListItem key={caregiver.id} caregiver={caregiver} selected={caregiver.id === selectedId} onSelect={() => setSelectedId(caregiver.id)} />)
                ) : (
                  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Nenhum cuidador encontrado</p>
                    <p className="mt-1 text-sm text-muted-foreground">Ajuste a busca ou filtro de status.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {selectedId && (loadingDetail || loadingDocuments) ? (
            <Card className="lg:col-span-2"><CardContent className="space-y-4 p-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></CardContent></Card>
          ) : detail ? (
            <ProfileDetail detail={detail} documents={documents} />
          ) : (
            <Card className="flex min-h-[420px] items-center justify-center lg:col-span-2">
              <div className="text-center"><User className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="text-sm text-muted-foreground">Selecione um cuidador para revisar o perfil.</p></div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default CaregiverProfilesReview;
