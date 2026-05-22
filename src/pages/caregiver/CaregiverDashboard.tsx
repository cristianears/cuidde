import React from "react";
import {
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  Briefcase,
  Eye,
  ArrowRight,
  Calendar,
  Search,
  MessageCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import StarRating from "@/components/shared/StarRating";
import CaregiverCard from "@/components/shared/CaregiverCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCaregiverProfile, useProfessionalReferences, useAutoGeocodeCaregiver } from "@/hooks/useCaregiverProfile";
import { useDocuments } from "@/hooks/useCaregiverDocuments";
import { useAppointments } from "@/hooks/useAppointments";
import { useReviews } from "@/hooks/useReviews";
import type { CaregiverProfileFull } from "@/hooks/useCaregiverProfile";
import type { CaregiverDocument, ProfessionalReference, CaregiverPublic } from "@/types/database";

// ─── Completude do perfil ─────────────────────────────────────────────────────
// 8 critérios ponderados — cada um vale 1 ponto

interface CompletenessCheck {
  done: boolean;
  label: string;
  href: string;
}

function getProfileCompleteness(
  profile: CaregiverProfileFull,
  docs: CaregiverDocument[],
  refs: ProfessionalReference[],
): { pct: number; checks: CompletenessCheck[] } {
  const checks: CompletenessCheck[] = [
    {
      done: !!profile.photo_url,
      label: "Adicionar foto ao perfil",
      href: "/caregiver/profile",
    },
    {
      done: (profile.bio?.length ?? 0) >= 150,
      label: "Completar biografia (mín. 150 caracteres)",
      href: "/caregiver/profile",
    },
    {
      done: (profile.specialties?.length ?? 0) >= 1,
      label: "Selecionar especialidades",
      href: "/caregiver/profile",
    },
    {
      done: (profile.modalities?.length ?? 0) >= 1,
      label: "Selecionar formato de atendimento",
      href: "/caregiver/profile",
    },
    {
      done: !!(profile.cep && profile.city && profile.state),
      label: "Completar endereço",
      href: "/caregiver/profile",
    },
    {
      done: !!(profile.price_per_hour != null || profile.price_per_day != null),
      label: "Definir valores de atendimento",
      href: "/caregiver/pricing",
    },
    (() => {
      const rgCnh = docs.find((d) => d.type === "rg_cnh");
      if (rgCnh?.status === "rejected") {
        return {
          done: false,
          label: "Reenviar RG/CNH — documento ilegível",
          href: "/caregiver/documents",
        };
      }
      return {
        done: !!rgCnh && (rgCnh.status === "approved" || rgCnh.status === "sent"),
        label: "Enviar RG ou CNH",
        href: "/caregiver/documents",
      };
    })(),
    {
      done: refs.length >= 1,
      label: "Inserir referências profissionais",
      href: "/caregiver/profile",
    },
  ];

  const doneCount = checks.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);
  return { pct, checks };
}

// ─── Dica semanal ─────────────────────────────────────────────────────────────

// Dica personalizada baseada no primeiro item incompleto do perfil.
// Se tudo estiver completo, rotaciona dicas de engajamento semanalmente.

const TIP_BY_CHECK: Record<string, { body: string; actionTarget: string }> = {
  "Adicionar foto ao perfil": {
    body: "Perfis com foto recebem até 3x mais cliques. Adicione uma foto profissional para se destacar na busca.",
    actionTarget: "/caregiver/profile",
  },
  "Completar biografia (mín. 150 caracteres)": {
    body: "Uma biografia detalhada conta sua história e gera confiança. Descreva sua experiência e diferenciais.",
    actionTarget: "/caregiver/profile",
  },
  "Selecionar especialidades": {
    body: "Especialidades definem em quais buscas você aparece. Marque todas as áreas em que atua.",
    actionTarget: "/caregiver/profile",
  },
  "Selecionar formato de atendimento": {
    body: "Informe se você faz plantões, diárias ou períodos longos — famílias filtram por isso na busca.",
    actionTarget: "/caregiver/profile",
  },
  "Completar endereço": {
    body: "Sem endereço cadastrado você não aparece nas buscas por proximidade. Complete seu CEP e cidade.",
    actionTarget: "/caregiver/profile",
  },
  "Definir valores de atendimento": {
    body: "Famílias filtram por faixa de preço. Defina seus valores para aparecer nesses resultados.",
    actionTarget: "/caregiver/pricing",
  },
  "Enviar RG ou CNH": {
    body: "O documento de identificação é obrigatório para habilitar seu perfil. Tire uma foto clara ou faça upload do arquivo.",
    actionTarget: "/caregiver/documents",
  },
  "Reenviar RG/CNH — documento ilegível": {
    body: "Seu documento foi recusado por estar ilegível. Envie uma nova foto com boa iluminação e sem cortes.",
    actionTarget: "/caregiver/documents",
  },
  "Inserir referências profissionais": {
    body: "Referências profissionais são o fator de confiança mais valorizado pelas famílias.",
    actionTarget: "/caregiver/profile",
  },
};

const engagementTips = [
  { body: "Mantenha sua disponibilidade sempre atualizada para não perder oportunidades.", actionTarget: "/caregiver/availability" },
  { body: "Responda às solicitações rapidamente — famílias valorizam cuidadores ágeis.", actionTarget: "/caregiver/appointments" },
  { body: "Perfis com avaliações positivas sobem no ranking de busca. Peça feedback aos seus pacientes.", actionTarget: "/caregiver/reviews" },
];

function getPersonalizedTip(incompleteLabels: string[]) {
  // Prioridade: primeiro item incompleto do perfil
  for (const label of incompleteLabels) {
    if (TIP_BY_CHECK[label]) return TIP_BY_CHECK[label];
  }
  // Tudo completo: rotaciona dicas de engajamento semanalmente
  const startOfYear = new Date(new Date().getFullYear(), 0, 0).getTime();
  const week = Math.floor((Date.now() - startOfYear) / (7 * 86_400_000));
  return engagementTips[week % engagementTips.length];
}

// ─── Componente ───────────────────────────────────────────────────────────────

const CaregiverDashboard = () => {
  const { user } = useAuth();

  // ── Dados reais ──────────────────────────────────────────────────────────
  const { data: profileData, isLoading: profileLoading } = useCaregiverProfile();
  useAutoGeocodeCaregiver(profileData);

  const { data: documents = [] } = useDocuments();
  const { data: refs = [] } = useProfessionalReferences();
  const { data: appointments = [] } = useAppointments("caregiver");
  const { data: reviews = [] } = useReviews(user?.id);

  // ── Métricas de atendimentos ─────────────────────────────────────────────
  const activeAppointments  = appointments.filter((a) => a.status === "ativo").length;
  const doneAppointments    = appointments.filter((a) => a.status === "finalizado").length;

  // ── Completude do perfil ─────────────────────────────────────────────────
  const profileCompleteness = profileData
    ? getProfileCompleteness(profileData, documents, refs)
    : { pct: 0, checks: [] };

  const incompleteChecks = profileCompleteness.checks.filter((c) => !c.done);

  // ── Ações recomendadas (mostrar apenas itens incompletos, máx. 4) ────────
  const recommendedActions = incompleteChecks
    .slice(0, 4)
    .map((c) => ({ label: c.label, href: c.href }));

  const weeklyTip = getPersonalizedTip(incompleteChecks.map((c) => c.label));

  // ── Loading state ────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="flex min-h-screen bg-muted/30">
        <AppSidebar
          role="caregiver"
          userName={user?.email ?? ""}
          userPhoto={undefined}
        />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  // ── Valores do perfil com fallbacks seguros ──────────────────────────────
  const profileName      = profileData?.profiles.full_name ?? user?.email ?? "";
  const profilePhoto     = profileData?.photo_url ?? undefined;
  const avgRating        = profileData?.average_rating ?? 0;
  const reviewCount      = profileData?.review_count ?? 0;
  const profileViews30d  = profileData?.profile_views_30d ?? 0;
  const searchApps30d    = profileData?.search_appearances_30d ?? 0;
  const intFamilies30d   = profileData?.interested_families_30d ?? 0;

  // ── Objeto CaregiverPublic para o card (exatamente como a família vê) ────
  const caregiverPublicView: CaregiverPublic | null = profileData
    ? {
        id: profileData.id,
        full_name: profileData.profiles.full_name,
        photo_url: profileData.photo_url,
        bio: profileData.bio,
        experience_years: profileData.experience_years,
        profissao_formacao: profileData.profissao_formacao,
        neighborhood: profileData.neighborhood,
        city: profileData.city,
        state: profileData.state,
        zona: profileData.zona,
        cep: profileData.cep,
        price_per_hour: profileData.price_per_hour,
        price_per_day: profileData.price_per_day,
        average_rating: profileData.average_rating,
        review_count: profileData.review_count,
        specialties: profileData.specialties,
        modalities: profileData.modalities,
        idiomas: profileData.idiomas,
        possui_cnh: profileData.possui_cnh,
        has_insurance: profileData.has_insurance,
        professional_reg_number: profileData.professional_reg_number,
        emergency_available: profileData.emergency_available,
        whatsapp: profileData.whatsapp,
        has_rg_cnh: profileData.has_rg_cnh,
        has_antecedentes: profileData.has_antecedentes,
        has_certificado: profileData.has_certificado,
        has_references: profileData.has_references,
        is_available_for_new: profileData.is_available_for_new,
      }
    : null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar
        role="caregiver"
        userName={profileName}
        userPhoto={profilePhoto}
      />

      <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Acompanhe seu perfil, atendimentos e visibilidade na plataforma.
          </p>
        </div>

        {/* ── Seção 1 — Métricas rápidas ──────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">

          {/* 1. Perfil completo */}
          <Card className="shadow-sm border-0 bg-card">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 md:p-2.5 rounded-xl bg-primary/10">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Perfil</p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 rounded-full text-xs font-semibold",
                  profileCompleteness.pct === 100
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700",
                )}
              >
                {profileCompleteness.pct === 100 ? (
                  <><CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5" /> Completo</>
                ) : (
                  <><Clock className="w-3 h-3 md:w-3.5 md:h-3.5" /> {profileCompleteness.pct}%</>
                )}
              </span>
            </CardContent>
          </Card>

          {/* 2. Avaliação média */}
          <Card className="col-span-2 sm:col-span-1 shadow-sm border-0 bg-card">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 md:p-2.5 rounded-xl bg-amber-100">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Avaliação média</p>
              {reviewCount > 0 ? (
                <div className="flex items-center gap-2">
                  <StarRating rating={avgRating} size="sm" />
                  <span className="text-xs text-muted-foreground">({reviewCount})</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Sem avaliações ainda</span>
              )}
            </CardContent>
          </Card>

          {/* 3. Ativos */}
          <Card className="shadow-sm border-0 bg-card">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 md:p-2.5 rounded-xl bg-accent/10">
                  <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                </div>
              </div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Ativos</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{activeAppointments}</p>
            </CardContent>
          </Card>

          {/* 4. Realizados */}
          <Card className="shadow-sm border-0 bg-card">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 md:p-2.5 rounded-xl bg-emerald-100">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Realizados</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{doneAppointments}</p>
              <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                Total finalizados na plataforma.
              </p>
            </CardContent>
          </Card>


        </div>

        {/* ── Seção 2 — Insights do perfil ────────────────────────────────── */}
        <div className="mb-6 md:mb-8">
          <div className="mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold text-foreground">Insights do seu perfil</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Acompanhe sua visibilidade e veja o que pode melhorar para receber mais interesse.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">

            {/* Visualizações do perfil */}
            <Card className="shadow-sm border-0 bg-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 md:p-2.5 rounded-xl bg-sky-100">
                    <Eye className="w-4 h-4 md:w-5 md:h-5 text-sky-600" />
                  </div>
                </div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Visualizações do perfil</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{profileViews30d}</p>
                <p className="text-xs text-muted-foreground mt-1">nos últimos 30 dias</p>
                <p className="text-xs text-muted-foreground/70 mt-2 italic">
                  Perfis completos tendem a receber mais visitas.
                </p>
              </CardContent>
            </Card>

            {/* Aparições nas buscas */}
            <Card className="shadow-sm border-0 bg-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 md:p-2.5 rounded-xl bg-violet-100">
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-violet-600" />
                  </div>
                </div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Aparições nas buscas</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{searchApps30d}</p>
                <p className="text-xs text-muted-foreground mt-1">nos últimos 30 dias</p>
                <p className="text-xs text-muted-foreground/70 mt-2 italic">
                  Complete seu perfil para aparecer em mais buscas.
                </p>
              </CardContent>
            </Card>

            {/* Perfil completo — barra de progresso */}
            <Card className="shadow-sm border-0 bg-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 md:p-2.5 rounded-xl bg-amber-100">
                    <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      profileCompleteness.pct >= 80
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {profileCompleteness.pct}%
                  </span>
                </div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Perfil completo</p>
                <Progress value={profileCompleteness.pct} className="h-1.5 mb-3" />
                {incompleteChecks.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-foreground">Próximos passos:</p>
                    {incompleteChecks.slice(0, 3).map((check, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <AlertCircle className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                        <span>{check.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                    <CheckCircle className="w-3 h-3 shrink-0" />
                    Perfil completo!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 5. Famílias interessadas */}
            <Card className="shadow-sm border-0 bg-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 md:p-2.5 rounded-xl bg-rose-100">
                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-rose-600" />
                  </div>
                </div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Famílias interessadas</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{intFamilies30d}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">nos últimos 30 dias</p>
                <Button variant="outline" size="sm" className="w-full text-xs h-8" asChild>
                  <Link to="/caregiver/appointments">
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                    Ver atendimentos
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Dica da semana */}
            <Card className="shadow-sm border-0 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 md:p-2.5 rounded-xl bg-primary/10">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Semana
                  </span>
                </div>
                <p className="text-xs md:text-sm font-medium text-foreground mb-2">Dica da semana</p>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-3">
                  {weeklyTip.body}
                </p>
                <Button size="sm" className="w-full text-xs h-8" asChild>
                  <Link to={weeklyTip.actionTarget}>
                    <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                    Melhorar perfil
                  </Link>
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* 7. Ações recomendadas */}
        {recommendedActions.length > 0 && (
          <Card className="mb-6 md:mb-8 shadow-sm border-0">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg font-semibold">Ações recomendadas</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground">
                Complete estes itens para aumentar suas chances de ser encontrado pelas famílias.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                {recommendedActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.href}
                    className="flex items-center justify-between w-full border border-input rounded-lg py-2.5 md:py-3 px-3 md:px-4 bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="p-1.5 md:p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </div>
                      <span className="text-xs font-medium text-left leading-snug">{action.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 8. Como as famílias veem você — card idêntico ao da busca */}
        {caregiverPublicView && (
          <div className="mb-6 md:mb-8">
            <div className="mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">Como as famílias veem você</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Este é o seu card exato na busca de cuidadores — mesma ordem, mesma informação.
              </p>
            </div>
            <CaregiverCard
              caregiver={caregiverPublicView}
              hasDocsSent={caregiverPublicView.has_rg_cnh}
              hasAntecedentes={caregiverPublicView.has_antecedentes}
              hasCertificados={caregiverPublicView.has_certificado}
              hasReferencias={caregiverPublicView.has_references}
            />
          </div>
        )}

        {/* 9. Avaliações recentes */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg font-semibold">Avaliações recentes</CardTitle>
              <Link to="/caregiver/reviews" className="text-xs md:text-sm text-primary hover:underline font-medium">
                Ver todas
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {/* Resumo da nota */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50">
                  <div className="text-3xl md:text-4xl font-bold text-amber-600">{avgRating.toFixed(1)}</div>
                  <div>
                    <StarRating rating={avgRating} showValue={false} size="md" />
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Baseado em {reviewCount} {reviewCount === 1 ? "avaliação" : "avaliações"}
                    </p>
                  </div>
                </div>
                {/* Cards das últimas 3 avaliações */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="p-3 md:p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 md:gap-3 mb-3">
                        {review.family_photo ? (
                          <img
                            src={review.family_photo}
                            alt={review.family_name ?? "Família"}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs md:text-sm font-medium text-foreground">
                            {review.family_name ?? "Família"}
                          </p>
                          <StarRating rating={review.rating} size="sm" showValue={false} />
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">{review.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(review.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 md:py-12 text-muted-foreground">
                <Star className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Você ainda não tem avaliações</p>
                <p className="text-xs md:text-sm mt-1">Conclua atendimentos para receber avaliações das famílias.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CaregiverDashboard;
