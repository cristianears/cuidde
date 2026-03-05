import { useState } from "react";
import { FileText, AlertCircle, CheckCircle2, Briefcase, Eye, EyeOff, Lock, Users, ShieldCheck } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import DocumentUpload from "@/components/shared/DocumentUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { mockCaregivers, Document } from "@/data/mockData";
import { cn } from "@/lib/utils";

type RegistrationType = "cpf" | "mei";
type CaregiverDocumentType = "cnpj" | "rg_cnh" | "curriculo" | "certificacao" | "antecedentes";
type ProfessionalRegistrationType = "" | "coren" | "crefito" | "outros";

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

interface CaregiverDocument extends Omit<Document, "type"> {
  type: CaregiverDocumentType;
}

const getDocuments = (registrationType: RegistrationType): CaregiverDocument[] => {
  const documents: CaregiverDocument[] = [
    {
      id: "doc-rg-cnh",
      caregiverId: "1",
      type: "rg_cnh",
      name: "RG ou CNH",
      status: "pending",
      uploadedAt: null,
      reviewedAt: null,
    },
  ];

  if (registrationType === "mei") {
    documents.push({
      id: "doc-cnpj",
      caregiverId: "1",
      type: "cnpj",
      name: "CNPJ (MEI)",
      status: "pending",
      uploadedAt: null,
      reviewedAt: null,
    });
  }

  documents.push(
    {
      id: "doc-curriculo",
      caregiverId: "1",
      type: "curriculo",
      name: "Currículo",
      status: "pending",
      uploadedAt: null,
      reviewedAt: null,
    },
    {
      id: "doc-certificacoes",
      caregiverId: "1",
      type: "certificacao",
      name: "Certificações",
      status: "pending",
      uploadedAt: null,
      reviewedAt: null,
    },
    {
      id: "doc-antecedentes",
      caregiverId: "1",
      type: "antecedentes",
      name: "Antecedentes Criminais",
      status: "pending",
      uploadedAt: null,
      reviewedAt: null,
    },
  );

  return documents;
};

const CaregiverDocuments = () => {
  const currentUser = mockCaregivers[0];
  const registrationType: RegistrationType = "cpf";
  const [documents, setDocuments] = useState<CaregiverDocument[]>(getDocuments("cpf"));

  const [professionalRegType, setProfessionalRegType] = useState<ProfessionalRegistrationType>("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [registrationUF, setRegistrationUF] = useState("");
  const [otherRegistrationDesc, setOtherRegistrationDesc] = useState("");

  // Visibilidade por documento
  const [showCurriculo, setShowCurriculo] = useState(true);
  const [showCertificacoes, setShowCertificacoes] = useState(true);
  const [showAntecedentes, setShowAntecedentes] = useState(true);

  const handleUpload = (documentId: string, file: File) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? { ...doc, status: "sent" as const, uploadedAt: new Date().toISOString(), fileName: file.name }
          : doc,
      ),
    );
  };

  const handleRemove = (documentId: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? { ...doc, status: "pending" as const, uploadedAt: null, fileName: undefined }
          : doc,
      ),
    );
  };

  const totalDocs = documents.length;
  const sentOrApproved = documents.filter((d) => d.status === "sent" || d.status === "approved").length;
  const progressPercentage = totalDocs > 0 ? Math.round((sentOrApproved / totalDocs) * 100) : 0;

  const getProgressStatus = () => {
    if (sentOrApproved === 0) return { text: "Nenhum documento enviado", color: "text-muted-foreground" };
    if (sentOrApproved === totalDocs) return { text: "Todos os documentos enviados!", color: "text-emerald-600" };
    return { text: `${sentOrApproved} de ${totalDocs} documentos enviados`, color: "text-primary" };
  };

  const progressStatus = getProgressStatus();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="caregiver" userName={currentUser.name} userPhoto={currentUser.photo} />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PageHeader
          title="Meus Documentos"
          description="Envie seus documentos para completar seu perfil na plataforma."
        />

        <div className="max-w-3xl space-y-4 md:space-y-6">
          {/* Documentos */}
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
              {/* Microtexto de contexto */}
              <p className="text-xs md:text-sm text-muted-foreground pb-1">
                Apenas o documento de identificação é necessário para cadastro. Os demais são opcionais e podem aumentar a confiança das famílias no seu perfil.
              </p>

              {documents.map((doc) => (
                <DocumentUpload
                  key={doc.id}
                  document={doc as Document}
                  onUpload={handleUpload}
                  onRemove={handleRemove}
                  required={doc.type === "rg_cnh"}
                />
              ))}

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
                    <p className="text-xs md:text-sm font-medium text-amber-800">Dica para aprovação rápida</p>
                    <p className="text-xs md:text-sm text-amber-700">
                      Envie documentos claros, legíveis e com todas as informações visíveis. Fotos escuras ou borradas podem atrasar a verificação.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controle de Visibilidade */}
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

              {/* Currículo */}
              <div className="flex items-start justify-between gap-3 p-3 md:p-4 rounded-xl border border-border bg-background">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn("p-1.5 rounded-lg mt-0.5 shrink-0", showCurriculo ? "bg-primary/10" : "bg-muted")}>
                    {showCurriculo
                      ? <Eye className="w-4 h-4 text-primary" />
                      : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Currículo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {showCurriculo
                        ? "Visível no perfil público para todas as famílias"
                        : "Oculto — famílias não verão seu currículo"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={showCurriculo}
                  onCheckedChange={setShowCurriculo}
                  aria-label="Exibir currículo no perfil"
                  className="shrink-0 mt-0.5"
                />
              </div>

              {/* Certificações */}
              <div className="flex items-start justify-between gap-3 p-3 md:p-4 rounded-xl border border-border bg-background">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn("p-1.5 rounded-lg mt-0.5 shrink-0", showCertificacoes ? "bg-primary/10" : "bg-muted")}>
                    {showCertificacoes
                      ? <Eye className="w-4 h-4 text-primary" />
                      : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Certificações</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {showCertificacoes
                        ? "Visível no perfil público para todas as famílias"
                        : "Oculto — famílias não verão suas certificações"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={showCertificacoes}
                  onCheckedChange={setShowCertificacoes}
                  aria-label="Exibir certificações no perfil"
                  className="shrink-0 mt-0.5"
                />
              </div>

              {/* Antecedentes */}
              <div className="flex items-start justify-between gap-3 p-3 md:p-4 rounded-xl border border-border bg-background">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn("p-1.5 rounded-lg mt-0.5 shrink-0", showAntecedentes ? "bg-emerald-50" : "bg-muted")}>
                    {showAntecedentes
                      ? <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Antecedentes Criminais</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {showAntecedentes
                        ? "Exibido apenas para famílias assinantes, após aceitar o contato"
                        : "Oculto — nenhuma família verá o resultado"}
                    </p>
                    {showAntecedentes && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Users className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-xs text-primary font-medium">Restrito a assinantes</span>
                      </div>
                    )}
                  </div>
                </div>
                <Switch
                  checked={showAntecedentes}
                  onCheckedChange={setShowAntecedentes}
                  aria-label="Exibir antecedentes para famílias assinantes"
                  className="shrink-0 mt-0.5"
                />
              </div>

              {/* RG / CNH — uso interno */}
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

              {/* CNPJ MEI — uso interno (somente se MEI) */}
              {registrationType === "mei" && (
                <div className="flex items-start justify-between gap-3 p-3 md:p-4 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-muted mt-0.5 shrink-0">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">CNPJ (MEI)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Dados da empresa — uso interno apenas</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium whitespace-nowrap mt-0.5">
                    Não exibido
                  </span>
                </div>
              )}

              {/* Microcopy de responsabilidade */}
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

          {/* Registro Profissional */}
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
                <Label htmlFor="professional-reg-type" className="text-xs md:text-sm">Tipo de registro profissional</Label>
                <Select
                  value={professionalRegType}
                  onValueChange={(value) => {
                    setProfessionalRegType(value as ProfessionalRegistrationType);
                    setRegistrationNumber("");
                    setRegistrationUF("");
                    setOtherRegistrationDesc("");
                  }}
                >
                  <SelectTrigger id="professional-reg-type" className="text-sm">
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
                    <Label htmlFor="registration-number" className="text-xs md:text-sm">Número do registro</Label>
                    <Input
                      id="registration-number"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder={`Ex: ${professionalRegType.toUpperCase()}-123456`}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration-uf" className="text-xs md:text-sm">UF do registro</Label>
                    <Select value={registrationUF} onValueChange={setRegistrationUF}>
                      <SelectTrigger id="registration-uf" className="text-sm">
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
                  <Label htmlFor="other-registration" className="text-xs md:text-sm">Descrever registro profissional</Label>
                  <Input
                    id="other-registration"
                    value={otherRegistrationDesc}
                    onChange={(e) => setOtherRegistrationDesc(e.target.value)}
                    placeholder="Ex: Conselho X, Certificação Y, Registro municipal…"
                    className="text-sm"
                  />
                </div>
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

          {/* Progresso */}
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
              {sentOrApproved === totalDocs && totalDocs > 0 && (
                <div className="p-3 md:p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 shrink-0" />
                    <p className="text-xs md:text-sm text-emerald-700 font-medium">
                      Todos os documentos foram enviados! Nossa equipe irá analisá-los em até 48 horas úteis.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CaregiverDocuments;
