import { useState, useEffect } from "react";
import { FileText, AlertCircle, CheckCircle2, Briefcase, Eye, EyeOff, Lock, Users, ShieldCheck, Loader2 } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import DocumentUpload from "@/components/shared/DocumentUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCaregiverProfile } from "@/hooks/useCaregiverProfile";
import { useHasAcceptedUserConsent } from "@/hooks/useUserConsents";
import {
  useDocuments,
  useUploadDocument,
  useRemoveDocument,
  useToggleDocumentVisibility,
  useUpdateProfessionalReg,
} from "@/hooks/useCaregiverDocuments";
import type { CaregiverDocument, DocumentType, ProfessionalRegType } from "@/types/database";
import { LEGAL_DOCUMENTS } from "@/lib/legal-documents";
import { recordUserConsents } from "@/lib/user-consents";

// ─── Definições fixas de documentos ──────────────────────────────────────────

const DOC_DEFINITIONS: { type: DocumentType; label: string; required: boolean; hint: string }[] = [
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

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

type ProfessionalRegistrationType = "" | ProfessionalRegType;

// ─── Documento vazio (slot sem upload ainda) ──────────────────────────────────

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

// ─── Componente ───────────────────────────────────────────────────────────────

const CaregiverDocuments = () => {
  const { data: profileData, isLoading: profileLoading } = useCaregiverProfile();
  const { data: hasAcceptedThirdPartyConsent = false } = useHasAcceptedUserConsent(profileData?.id, "thirdPartyConsent");
  const { data: realDocs = [], isLoading: docsLoading } = useDocuments();
  const uploadDocument   = useUploadDocument();
  const removeDocument   = useRemoveDocument();
  const toggleVisibility = useToggleDocumentVisibility();
  const updateProfReg    = useUpdateProfessionalReg();

  // ── Estado: registro profissional ──────────────────────────────────────────
  const [professionalRegType, setProfessionalRegType] = useState<ProfessionalRegistrationType>("");
  const [registrationNumber, setRegistrationNumber]   = useState("");
  const [registrationUF, setRegistrationUF]           = useState("");
  const [otherRegistrationDesc, setOtherRegistrationDesc] = useState("");
  const [hasAcceptedDocumentConsent, setHasAcceptedDocumentConsent] = useState(false);
  const [isSavingDocumentConsent, setIsSavingDocumentConsent] = useState(false);

  const documentConsentAccepted = hasAcceptedThirdPartyConsent || hasAcceptedDocumentConsent;

  // Sincronizar registro profissional do perfil real
  useEffect(() => {
    if (!profileData) return;
    setProfessionalRegType((profileData.professional_reg_type ?? "") as ProfessionalRegistrationType);
    setRegistrationNumber(profileData.professional_reg_number ?? "");
    setRegistrationUF(profileData.professional_reg_uf ?? "");
    setOtherRegistrationDesc(profileData.professional_reg_other_desc ?? "");
  }, [profileData]);

  // ── Mapear slots de documentos ─────────────────────────────────────────────
  const documents: CaregiverDocument[] = DOC_DEFINITIONS.map(({ type, required }) => {
    return realDocs.find((d) => d.type === type) ?? makeEmptyDoc(type, required);
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAcceptDocumentConsent = async (checked: boolean) => {
    if (!checked || documentConsentAccepted) return;
    if (!profileData?.id) return;

    setIsSavingDocumentConsent(true);
    try {
      await recordUserConsents({
        userId: profileData.id,
        documentKeys: ["thirdPartyConsent"],
        context: "third_party_data",
        metadata: { role: "caregiver", source: "caregiver_documents" },
      });
      setHasAcceptedDocumentConsent(true);
    } catch {
      toast.error("Nao foi possivel registrar o aceite do termo. Tente novamente.");
    } finally {
      setIsSavingDocumentConsent(false);
    }
  };

  const handleUpload = async (docType: DocumentType, file: File) => {
    if (!profileData?.id) return;
    if (!documentConsentAccepted) {
      toast.error("Aceite o termo de consentimento antes de enviar documentos.");
      return;
    }

    uploadDocument.mutate({ docType, file });
  };

  const handleRemove = (doc: CaregiverDocument) => {
    if (doc.id.startsWith("empty-")) return;
    removeDocument.mutate(doc);
  };

  const handleToggleVisibility = (doc: CaregiverDocument, checked: boolean) => {
    if (doc.id.startsWith("empty-")) return;
    toggleVisibility.mutate({ id: doc.id, is_visible: checked });
  };

  const handleSaveProfReg = () => {
    updateProfReg.mutate({
      professional_reg_type: professionalRegType as ProfessionalRegistrationType,
      professional_reg_number: registrationNumber,
      professional_reg_uf: registrationUF,
      professional_reg_other_desc: otherRegistrationDesc,
    });
  };

  // ── RG/CNH ─────────────────────────────────────────────────────────────────
  const rgCnhDoc = documents.find((d) => d.type === "rg_cnh");
  const rgCnhMissing  = !rgCnhDoc || rgCnhDoc.status === "pending";
  const rgCnhRejected = rgCnhDoc?.status === "rejected";

  // ── Progresso ──────────────────────────────────────────────────────────────
  const totalDocs      = documents.length;
  const sentOrApproved = documents.filter((d) => d.status === "sent" || d.status === "approved").length;
  const progressPercentage = totalDocs > 0 ? Math.round((sentOrApproved / totalDocs) * 100) : 0;

  const getProgressStatus = () => {
    if (sentOrApproved === 0)       return { text: "Nenhum documento enviado",       color: "text-muted-foreground" };
    if (sentOrApproved === totalDocs) return { text: "Todos os documentos enviados!", color: "text-emerald-600"     };
    return { text: `${sentOrApproved} de ${totalDocs} documentos enviados`,           color: "text-primary"         };
  };

  const progressStatus = getProgressStatus();

  // Docs com toggle de visibilidade (excluindo rg_cnh — sempre interno)
  const visibilityDocs = documents.filter((d) => d.type !== "rg_cnh");

  const getVisibilityConfig = (doc: CaregiverDocument) => {
    if (doc.type === "antecedentes") {
      return {
        onLabel:  "Exibido apenas para famílias assinantes, após aceitar o contato",
        offLabel: "Oculto — nenhuma família verá o resultado",
        icon: (checked: boolean) =>
          checked
            ? <ShieldCheck className="w-4 h-4 text-emerald-600" />
            : <EyeOff className="w-4 h-4 text-muted-foreground" />,
        iconBg: (checked: boolean) => checked ? "bg-emerald-50" : "bg-muted",
        badge: (checked: boolean) => checked ? (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Users className="w-3 h-3 text-primary shrink-0" />
            <span className="text-xs text-primary font-medium">Restrito a assinantes</span>
          </div>
        ) : null,
      };
    }
    return {
      onLabel:  "Visível no perfil público para todas as famílias",
      offLabel: `Oculto — famílias não verão ${doc.type === "curriculo" ? "seu currículo" : "suas certificações"}`,
      icon: (checked: boolean) =>
        checked
          ? <Eye className="w-4 h-4 text-primary" />
          : <EyeOff className="w-4 h-4 text-muted-foreground" />,
      iconBg: (checked: boolean) => checked ? "bg-primary/10" : "bg-muted",
      badge: () => null,
    };
  };

  const isLoading = profileLoading || docsLoading;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="caregiver"
        userName={profileData?.profiles?.full_name ?? ""}
        userPhoto={profileData?.photo_url ?? undefined}
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PageHeader
          title="Meus Documentos"
          description="Envie seus documentos para completar seu perfil na plataforma."
        />

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-w-3xl space-y-4 md:space-y-6">

            {/* ── Documentos ─────────────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Documentos
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Envie os documentos abaixo para completar seu cadastro.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {/* Banner RG/CNH ilegível */}
                {rgCnhRejected && rgCnhDoc?.rejection_reason && (
                  <div className="flex items-start gap-3 p-3 md:p-4 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-red-800">Ação necessária — RG ou CNH</p>
                      <p className="text-xs md:text-sm text-red-700 mt-0.5">{rgCnhDoc.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {/* Banner RG/CNH ausente */}
                {rgCnhMissing && !rgCnhRejected && (
                  <div className="flex items-start gap-3 p-3 md:p-4 rounded-xl bg-orange-50 border border-orange-200">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-orange-800">RG ou CNH obrigatório</p>
                      <p className="text-xs md:text-sm text-orange-700 mt-0.5">
                        Envie seu documento de identificação para habilitar seu perfil na plataforma.
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs md:text-sm text-muted-foreground pb-1">
                  Apenas o documento de identificação é necessário para cadastro. Os demais são opcionais e podem aumentar a confiança das famílias no seu perfil.
                </p>

                <div className="rounded-xl border border-border bg-muted/30 p-3 md:p-4">
                  <label className="flex items-start gap-3 text-xs md:text-sm leading-relaxed">
                    <Checkbox
                      checked={documentConsentAccepted}
                      disabled={documentConsentAccepted || isSavingDocumentConsent}
                      onCheckedChange={(checked) => handleAcceptDocumentConsent(checked === true)}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-muted-foreground">
                      {documentConsentAccepted ? 'Termo aceito. ' : 'Declaro que li e aceito o '}
                      <a
                        href={LEGAL_DOCUMENTS.thirdPartyConsent.path}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Termo de Consentimento para Tratamento de Dados, Documentos e Informacoes de Terceiros
                      </a>
                      .
                    </span>
                  </label>
                </div>

                {documents.map((doc) => {
                  const def = DOC_DEFINITIONS.find((d) => d.type === doc.type)!;
                  return (
                    <DocumentUpload
                      key={doc.type}
                      document={doc}
                      label={def.label}
                      hint={def.hint}
                      onUpload={handleUpload}
                      onRemove={handleRemove}
                    />
                  );
                })}

                <div className="p-3 md:p-4 rounded-xl bg-muted/50 border border-dashed border-muted-foreground/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm font-medium text-foreground">Sobre os documentos</p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        <strong>RG ou CNH:</strong> Documento de identificação com foto.<br />
                        <strong>Currículo:</strong> Detalhe sua experiência profissional na área de cuidados.<br />
                        <strong>Certificações:</strong> Cursos de cuidador, enfermagem, primeiros socorros, etc.<br />
                        <strong>Antecedentes Criminais:</strong> Certidão negativa emitida nos últimos 90 dias.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 md:p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm text-amber-700">
                        Envie documentos claros, legíveis e com todas as informações visíveis. Fotos escuras ou borradas podem atrasar a verificação.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Controle de Visibilidade ────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Eye className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Controle de Visibilidade
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Defina o que as famílias podem ver no seu perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">

                {visibilityDocs.map((doc) => {
                  const def    = DOC_DEFINITIONS.find((d) => d.type === doc.type)!;
                  const cfg    = getVisibilityConfig(doc);
                  const isReal = !doc.id.startsWith("empty-");
                  const checked = doc.is_visible;

                  return (
                    <div
                      key={doc.type}
                      className="flex items-start justify-between gap-3 p-3 md:p-4 rounded-xl border border-border bg-background"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn("p-1.5 rounded-lg mt-0.5 shrink-0", cfg.iconBg(checked))}>
                          {cfg.icon(checked)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{def.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {checked ? cfg.onLabel : cfg.offLabel}
                          </p>
                          {cfg.badge(checked)}
                        </div>
                      </div>
                      <Switch
                        checked={checked}
                        onCheckedChange={(val) => handleToggleVisibility(doc, val)}
                        disabled={!isReal || toggleVisibility.isPending}
                        aria-label={`Visibilidade de ${def.label}`}
                        className="shrink-0 mt-0.5"
                      />
                    </div>
                  );
                })}

                {/* RG / CNH — sempre interno */}
                <div className="flex items-start justify-between gap-3 p-3 md:p-4 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-muted mt-0.5 shrink-0">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">RG ou CNH</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Documento de identificação — uso interno apenas</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium whitespace-nowrap mt-0.5">
                    Não exibido
                  </span>
                </div>

                <div className="p-3 md:p-4 rounded-xl bg-muted/50 border border-dashed border-muted-foreground/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      A plataforma pode revisar se o documento está legível e corresponde ao tipo solicitado. Não realizamos
                      validação de autenticidade, verificação em bases oficiais ou garantia perante terceiros.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Registro Profissional ───────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Registro Profissional
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Opcional — Informe seu registro profissional, se possuir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Tipo de registro profissional</Label>
                  <Select
                    value={professionalRegType}
                    onValueChange={(value) => {
                      setProfessionalRegType(value as ProfessionalRegistrationType);
                      setRegistrationNumber("");
                      setRegistrationUF("");
                      setOtherRegistrationDesc("");
                    }}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Selecione o tipo de registro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coren">COREN</SelectItem>
                      <SelectItem value="crefito">CREFITO</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(professionalRegType === "coren" || professionalRegType === "crefito") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Número do registro</Label>
                      <Input
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder={`Ex: ${professionalRegType.toUpperCase()}-123456`}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">UF do registro</Label>
                      <Select value={registrationUF} onValueChange={setRegistrationUF}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecione a UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {UF_OPTIONS.map((uf) => (
                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {professionalRegType === "outros" && (
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm">Descrever registro profissional</Label>
                    <Input
                      value={otherRegistrationDesc}
                      onChange={(e) => setOtherRegistrationDesc(e.target.value)}
                      placeholder="Ex: Conselho X, Certificação Y, Registro municipal…"
                      className="text-sm"
                    />
                  </div>
                )}

                {professionalRegType && (
                  <Button
                    onClick={handleSaveProfReg}
                    disabled={updateProfReg.isPending}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {updateProfReg.isPending
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando…</>
                      : "Salvar registro"}
                  </Button>
                )}

                <div className="p-3 md:p-4 rounded-xl bg-muted/50 border border-dashed border-muted-foreground/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Caso possua registro profissional, você pode anexar o comprovante na seção <strong>"Certificações"</strong>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Progresso ───────────────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Progresso do envio de documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs md:text-sm font-medium", progressStatus.color)}>
                    {progressStatus.text}
                  </span>
                  <span className="text-xs md:text-sm text-muted-foreground">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </CardContent>
            </Card>

          </div>
        )}
      </main>
    </div>
  );
};

export default CaregiverDocuments;
