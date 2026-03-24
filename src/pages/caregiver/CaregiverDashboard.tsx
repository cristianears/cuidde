import React from "react";
import {
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  Briefcase,
  Eye,
  ArrowRight,
  Shield,
  BadgeCheck,
  Heart,
  MapPin,
  Zap,
  Calendar,
  Languages,
  Clock as ClockIcon,
  Sunset,
  Car,
  Search,
  MessageCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import StarRating from "@/components/shared/StarRating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { mockCaregivers, mockDocuments, mockReviews, mockAppointments, mockReferences } from "@/data/mockData";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCaregiverProfile, useAutoGeocodeCaregiver } from "@/hooks/useCaregiverProfile";

// ---------------------------------------------------------------------------
// Insights mock data
// TODO: Replace with real API data when backend is ready
// ---------------------------------------------------------------------------
const mockInsights = {
  visualizacoes_30d: 87,
  visualizacoes_delta_pct: 12,   // positive = growth vs previous 30-day period
  aparicoes_busca_30d: 234,
  familias_interessadas_30d: 5,
  buscas_proximas_30d: 42,
};

type Caregiver = (typeof mockCaregivers)[0];

function getProfileCompleteness(
  user: Caregiver,
  docs: typeof mockDocuments,
  refs: typeof mockReferences,
): { pct: number; nextSteps: string[] } {
  const checks = [
    { done: !!user.photo, label: "Adicionar foto ao perfil" },
    { done: (user.bio?.length ?? 0) >= 150, label: "Completar biografia (mín. 150 caracteres)" },
    { done: (user.specialties?.length ?? 0) >= 1, label: "Selecionar especialidades" },
    { done: (user.modalities?.length ?? 0) >= 1, label: "Selecionar formato de atendimento" },
    {
      done: docs.some(
        (d) => d.type === "certificacao" && (d.status === "approved" || d.status === "sent"),
      ),
      label: "Adicionar certificações",
    },
    { done: refs.length >= 1, label: "Inserir referências profissionais" },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);
  const nextSteps = checks
    .filter((c) => !c.done)
    .map((c) => c.label)
    .slice(0, 3);
  return { pct, nextSteps };
}

const weeklyTips = [
  {
    body: "Perfis com biografia detalhada e foto clara tendem a receber mais visitas.",
    actionTarget: "/caregiver/profile",
  },
  {
    body: "Adicionar certificações pode aumentar a confiança das famílias no seu perfil.",
    actionTarget: "/caregiver/documents",
  },
  {
    body: "Atualize suas especialidades para aparecer em mais buscas relevantes.",
    actionTarget: "/caregiver/profile",
  },
  {
    body: "Perfis com referências profissionais transmitem mais credibilidade para as famílias.",
    actionTarget: "/caregiver/profile",
  },
  {
    body: "Registre seus atendimentos realizados para construir um histórico sólido.",
    actionTarget: "/caregiver/appointments",
  },
  {
    body: "Mantenha sua disponibilidade sempre atualizada para não perder oportunidades.",
    actionTarget: "/caregiver/availability",
  },
];

function getWeeklyTip() {
  const startOfYear = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - startOfYear) / 86_400_000);
  return weeklyTips[Math.floor(dayOfYear / 7) % weeklyTips.length];
}

// ---------------------------------------------------------------------------

const CaregiverDashboard = () => {
  const { user } = useAuth();
  const { data: profileData } = useCaregiverProfile();
  useAutoGeocodeCaregiver(profileData);
  // Using first caregiver as current user for demo
  const currentUser = mockCaregivers[0];
  const userDocuments = mockDocuments.filter((d) => d.caregiverId === currentUser.id);
  const userReviews = mockReviews.filter((r) => r.caregiverId === currentUser.id);
  const userAppointments = mockAppointments.filter((a) => a.caregiverId === currentUser.id);

  const userReferences = mockReferences.filter((r) => r.caregiverId === currentUser.id);
  const approvedDocs = userDocuments.filter((d) => d.status === "approved").length;

  // Profile badges conditions
  const hasDocsEnviados = userDocuments.some((d) => d.status === "approved" || d.status === "sent");
  const hasCertificados = userDocuments.some((d) => d.type === "certificacao" && d.status === "approved");
  const hasAntecedentes = userDocuments.some((d) => d.type === "antecedentes" && (d.status === "approved" || d.status === "sent"));
  const hasReferencias = userReferences.length > 0;
  const hasPhoto = !!currentUser.photo;
  const profileProgress = currentUser.profileComplete ? 100 : 65;
  const activeAppointments = userAppointments.filter((a) => a.status === "active").length;
  const totalAppointments = userAppointments.filter((a) => a.status === "active" || a.status === "completed").length;

  // Visibility criteria mock
  const visibilityCriteria = [
    { label: "Dados pessoais completos", completed: profileProgress === 100, icon: User },
    { label: "Especialidades e modalidades preenchidas", completed: true, icon: Heart },
    { label: "Histórico de atendimentos registrado", completed: userAppointments.length > 0, icon: Briefcase },
    { label: "Avaliações das famílias", completed: userReviews.length > 0, icon: Star },
    { label: "Seguro profissional informado (opcional)", completed: false, icon: Shield },
  ];

  const completedCriteria = visibilityCriteria.filter((c) => c.completed).length;

  /**
   * Importante:
   * Você não "verifica" profissionais.
   * Aqui o status representa um estado interno de "análise/visibilidade"
   * (ex.: perfil/documentos em análise; aprovado para exibição; etc.).
   */
  const statusConfig: Record<
    string,
    { label: string; className: string; icon: React.ElementType }
  > = {
    pending: { label: "Pendente", className: "bg-amber-100 text-amber-700", icon: Clock },
    analyzing: { label: "Em análise", className: "bg-blue-100 text-blue-700", icon: Clock },
    verified: { label: "Aprovado p/ exibição", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    rejected: { label: "Rejeitado", className: "bg-red-100 text-red-700", icon: AlertCircle },
  };

  const recommendedActions = [
    {
      label: "Completar perfil",
      href: "/caregiver/profile",
      icon: User,
      show: profileProgress < 100,
    },
    {
      label: "Enviar / revisar documentos",
      href: "/caregiver/documents",
      icon: FileText,
      show: approvedDocs < userDocuments.length,
    },
    {
      label: "Registrar atendimentos realizados",
      href: "/caregiver/appointments",
      icon: Calendar,
      show: userAppointments.length < 3,
    },
    {
      label: "Informar seguro profissional (opcional)",
      href: "/caregiver/profile",
      icon: Shield,
      show: true,
    },
  ].filter((action) => action.show);

  // Insights
  const profileCompleteness = getProfileCompleteness(currentUser, userDocuments, userReferences);
  const weeklyTip = getWeeklyTip();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar
        role="caregiver"
        userName={profileData?.profiles.full_name ?? user?.email ?? ""}
        userPhoto={profileData?.photo_url ?? undefined}
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Acompanhe seu perfil, atendimentos e visibilidade na plataforma.
          </p>
        </div>

        {/* Seção 1 — Status Geral do Perfil */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
          {/* Profile Status */}
          <Card className="shadow-sm border-0 bg-card">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 md:p-2.5 rounded-xl bg-primary/10">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Perfil</p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 rounded-full text-xs font-semibold",
                    profileProgress === 100 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                  )}
                >
                  {profileProgress === 100 ? (
                    <>
                      <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      Completo
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      Incompleto
                    </>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status do Perfil (análise/visibilidade) */}
          <Card className="shadow-sm border-0 bg-card">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 md:p-2.5 rounded-xl bg-primary/10">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Status do perfil</p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 rounded-full text-xs font-semibold",
                  statusConfig[currentUser.status]?.className,
                )}
              >
                {React.createElement(statusConfig[currentUser.status]?.icon, { className: "w-3 h-3 md:w-3.5 md:h-3.5" })}
                {statusConfig[currentUser.status]?.label}
              </span>
            </CardContent>
          </Card>

          {/* Average Rating */}
          <Card className="col-span-2 sm:col-span-1 shadow-sm border-0 bg-card">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 md:p-2.5 rounded-xl bg-amber-100">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Avaliação média</p>
              <div className="flex items-center gap-2">
                <StarRating rating={currentUser.rating} size="sm" />
                <span className="text-xs text-muted-foreground">({currentUser.reviewCount})</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Appointments */}
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

          {/* Total Appointments */}
          <Card className="shadow-sm border-0 bg-card">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 md:p-2.5 rounded-xl bg-emerald-100">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Realizados</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{totalAppointments}</p>
              <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                Total desde o cadastro na plataforma.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seção 2 — Insights do seu perfil */}
        <div className="mb-6 md:mb-8">
          <div className="mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold text-foreground">Insights do seu perfil</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Acompanhe sua visibilidade e veja o que pode melhorar para receber mais interesse.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">

            {/* Card 1 — Visualizações do perfil */}
            <Card className="shadow-sm border-0 bg-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 md:p-2.5 rounded-xl bg-sky-100">
                    <Eye className="w-4 h-4 md:w-5 md:h-5 text-sky-600" />
                  </div>
                  {mockInsights.visualizacoes_delta_pct !== 0 && (
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        mockInsights.visualizacoes_delta_pct > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700",
                      )}
                    >
                      {mockInsights.visualizacoes_delta_pct > 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}{" "}
                      {Math.abs(mockInsights.visualizacoes_delta_pct)}% vs mês anterior
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Visualizações do perfil</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{mockInsights.visualizacoes_30d}</p>
                <p className="text-xs text-muted-foreground mt-1">nos últimos 30 dias</p>
                <p className="text-xs text-muted-foreground/70 mt-2 italic">
                  Perfis completos tendem a receber mais visitas.
                </p>
              </CardContent>
            </Card>

            {/* Card 2 — Aparições nas buscas */}
            <Card className="shadow-sm border-0 bg-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 md:p-2.5 rounded-xl bg-violet-100">
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-violet-600" />
                  </div>
                </div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Aparições nas buscas</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{mockInsights.aparicoes_busca_30d}</p>
                <p className="text-xs text-muted-foreground mt-1">nos últimos 30 dias</p>
                <p className="text-xs text-muted-foreground/70 mt-2 italic">
                  Complete seu perfil para aparecer em mais buscas.
                </p>
              </CardContent>
            </Card>

            {/* Card 3 — Perfil completo */}
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
                {profileCompleteness.nextSteps.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-foreground">Próximos passos:</p>
                    {profileCompleteness.nextSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <AlertCircle className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                        <span>{step}</span>
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

            {/* Card 4 — Famílias interessadas */}
            <Card className="shadow-sm border-0 bg-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 md:p-2.5 rounded-xl bg-rose-100">
                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-rose-600" />
                  </div>
                </div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Famílias interessadas</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{mockInsights.familias_interessadas_30d}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">nos últimos 30 dias</p>
                {/* TODO: wire to messaging route when available */}
                <Button variant="outline" size="sm" className="w-full text-xs h-8" asChild>
                  <Link to="/caregiver/appointments">
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                    Ver mensagens
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Card 5 — Buscas na sua região */}
            <Card className="shadow-sm border-0 bg-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 md:p-2.5 rounded-xl bg-teal-100">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
                  </div>
                </div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Buscas na sua região</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{mockInsights.buscas_proximas_30d}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">nos últimos 30 dias</p>
                {/* TODO: wire to opportunities page when available */}
                <Button variant="outline" size="sm" className="w-full text-xs h-8" asChild>
                  <Link to="/caregiver/appointments">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    Ver oportunidades
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Card 6 — Dica da semana */}
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

        {/* Ações recomendadas */}
        {recommendedActions.length > 0 && (
          <Card className="mb-6 md:mb-8 shadow-sm border-0">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg font-semibold">Ações recomendadas</CardTitle>
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
                        {React.createElement(action.icon, { className: "w-3.5 h-3.5 md:w-4 md:h-4" })}
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

        <div className="mb-6 md:mb-8">
          {/* Seção 3 — Como as Famílias Veem Você */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg font-semibold">Como as famílias veem você</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground">
                Esta é uma visualização aproximada de como seu perfil pode aparecer para as famílias.
              </p>
            </CardHeader>
            <CardContent>
              <div className="p-4 md:p-6 rounded-2xl bg-muted/50 border border-border">
                <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src={currentUser.photo}
                      alt={currentUser.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shadow-md"
                    />
                  </div>
                  <div className="flex-1 space-y-2 md:space-y-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg md:text-xl font-bold text-foreground">{currentUser.name}</h3>
                      </div>
                      {currentUser.profissaoFormacao && (
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                          {currentUser.profissaoFormacao}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                        <span>
                          {currentUser.address.neighborhood}, {currentUser.address.city} - {currentUser.address.state}
                        </span>
                      </div>
                    </div>
                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {currentUser.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="bg-background text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    {/* Idiomas */}
                    {currentUser.idiomas?.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Languages className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div className="flex flex-wrap gap-1.5">
                          {currentUser.idiomas.map((idioma, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {idioma}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Valores */}
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-medium">
                        <ClockIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Hora:</span>
                        <span>R$ {currentUser.pricePerHour}/h</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-medium">
                        <Sunset className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Plantão:</span>
                        <span>R$ {currentUser.pricePerDay}</span>
                      </div>
                    </div>
                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <StarRating rating={currentUser.rating} size="sm" />
                      <span className="text-xs md:text-sm text-muted-foreground">({currentUser.reviewCount} avaliações)</span>
                    </div>
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 md:gap-2 pt-1 md:pt-2">
                      {hasDocsEnviados && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                          <FileText className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          Documentos enviados
                        </div>
                      )}
                      {hasCertificados && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                          <BadgeCheck className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          Certificados informados
                        </div>
                      )}
                      {hasAntecedentes && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium">
                          <Shield className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          Certidão de antecedentes anexada
                        </div>
                      )}
                      {hasReferencias && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                          <User className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          Referências profissionais
                        </div>
                      )}
                      {hasPhoto && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-medium">
                          <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          Perfil com foto
                        </div>
                      )}
                      {currentUser.hasCNH && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                          <Car className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          Possui CNH
                        </div>
                      )}
                      {currentUser.hasInsurance && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-medium">
                          <Shield className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          Seguro informado
                        </div>
                      )}
                      {currentUser.emergencyAvailable && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium">
                          <Zap className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          Disponível para emergência
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção 4 — Avaliações Recentes */}
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
            {userReviews.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50">
                  <div className="text-3xl md:text-4xl font-bold text-amber-600">{currentUser.rating.toFixed(1)}</div>
                  <div>
                    <StarRating rating={currentUser.rating} showValue={false} size="md" />
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">Baseado em {currentUser.reviewCount} avaliações</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {userReviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="p-3 md:p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 md:gap-3 mb-3">
                        <img
                          src={review.familyPhoto}
                          alt={review.familyName}
                          className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-xs md:text-sm font-medium text-foreground">{review.familyName}</p>
                          <StarRating rating={review.rating} size="sm" showValue={false} />
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">{review.comment}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(review.date).toLocaleDateString("pt-BR")}
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
