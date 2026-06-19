import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, PlayCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCaregiverProfile } from "@/hooks/useCaregiverProfile";
import { useDocuments } from "@/hooks/useCaregiverDocuments";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { useFavoriteIds } from "@/hooks/useFavorites";
import { onboardingVideoLinks, type OnboardingVideoRole } from "@/config/onboardingVideos";

const ONBOARDING_GUIDE_STORAGE_PREFIX = "icuide_onboarding_guide_seen_";
export const ONBOARDING_GUIDE_OPEN_EVENT = "icuide:open-onboarding-guide";

interface OnboardingStep {
  id: string;
  title: string;
  statusLabel: string;
  description: string;
  detail: string;
  href: string;
  done: boolean;
  markSeenOnAction?: boolean;
}

function getGuideStorageKey(role: OnboardingVideoRole, stepId: string) {
  return `${ONBOARDING_GUIDE_STORAGE_PREFIX}${role}_${stepId}`;
}

interface OnboardingGuideControllerProps {
  role: OnboardingVideoRole;
  steps: OnboardingStep[];
}

function OnboardingGuideController({ role, steps }: OnboardingGuideControllerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = React.useState<OnboardingStep | null>(null);
  const [dismissedForSession, setDismissedForSession] = React.useState(false);
  const [pendingStepId, setPendingStepId] = React.useState<string | null>(null);
  const [storageVersion, setStorageVersion] = React.useState(0);
  const videoUrl = onboardingVideoLinks[role].trim();

  const getNextStep = React.useCallback(
    (ignoreSeen = false) =>
      steps.find((step) => {
        if (step.done) return false;
        if (ignoreSeen) return true;
        return window.localStorage.getItem(getGuideStorageKey(role, step.id)) !== "true";
      }) ?? null,
    [role, steps],
  );

  React.useEffect(() => {
    if (steps.length === 0) {
      setActiveStep(null);
      return;
    }

    if (pendingStepId) {
      const pendingStep = steps.find((step) => step.id === pendingStepId);
      if (pendingStep && !pendingStep.done) {
        setActiveStep(null);
        return;
      }
      setPendingStepId(null);
    }

    if (dismissedForSession) {
      setActiveStep(null);
      return;
    }

    setActiveStep(getNextStep(false));
  }, [dismissedForSession, getNextStep, location.pathname, pendingStepId, steps, storageVersion]);

  const openGuide = React.useCallback(() => {
    setDismissedForSession(false);
    setPendingStepId(null);
    setActiveStep(getNextStep(true));
  }, [getNextStep]);

  React.useEffect(() => {
    window.addEventListener(ONBOARDING_GUIDE_OPEN_EVENT, openGuide);
    return () => window.removeEventListener(ONBOARDING_GUIDE_OPEN_EVENT, openGuide);
  }, [openGuide]);

  const closeGuideForNow = () => {
    setDismissedForSession(true);
    setActiveStep(null);
  };

  const skipStep = () => {
    if (!activeStep) return;
    window.localStorage.setItem(getGuideStorageKey(role, activeStep.id), "true");
    setPendingStepId(null);
    setStorageVersion((current) => current + 1);
  };

  const goToStep = () => {
    if (!activeStep) return;
    if (activeStep.markSeenOnAction) {
      window.localStorage.setItem(getGuideStorageKey(role, activeStep.id), "true");
      setStorageVersion((current) => current + 1);
    }
    setPendingStepId(activeStep.id);
    setDismissedForSession(false);
    setActiveStep(null);
    navigate(activeStep.href);
  };

  const openVideo = () => {
    if (!videoUrl) return;
    window.open(videoUrl, "_blank", "noopener,noreferrer");
  };

  if (!steps.some((step) => !step.done)) return null;

  return (
    <>
      <Dialog open={!!activeStep} onOpenChange={(open) => !open && closeGuideForNow()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <DialogTitle>{activeStep?.title}</DialogTitle>
            <DialogDescription>{activeStep?.description}</DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {activeStep?.statusLabel} precisa de ajuste
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {activeStep?.detail}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              variant="outline"
              onClick={openVideo}
              disabled={!videoUrl}
              title={!videoUrl ? "Adicione o link do YouTube em src/config/onboardingVideos.ts" : undefined}
              className="w-full justify-center"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Ver vídeo
            </Button>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="ghost" onClick={skipStep} className="w-full whitespace-normal">
                Não mostrar esta etapa
              </Button>
              <Button onClick={goToStep} className="w-full">
                Preencher
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CaregiverRouteOnboardingGuide() {
  const { data: profileData } = useCaregiverProfile();
  const { data: documents = [] } = useDocuments();

  const steps = React.useMemo<OnboardingStep[]>(() => {
    if (profileData === undefined) return [];

    const needsBiography = profileData ? (profileData.bio?.trim().length ?? 0) < 150 : true;
    const hasFormation = !!(
      profileData?.profissao_formacao ||
      profileData?.formacao_complementar?.trim()
    );
    const hasExperience = (profileData?.experience_years ?? 0) > 0;
    const hasSpecialties = (profileData?.specialties?.length ?? 0) > 0;
    const hasAvailability = !!(
      profileData?.is_available_for_new ||
      (profileData?.journey_types?.length ?? 0) > 0 ||
      profileData?.availability_notes?.trim()
    );
    const rgCnh = documents.find((doc) => doc.type === "rg_cnh");
    const hasDocument = !!rgCnh && (rgCnh.status === "approved" || rgCnh.status === "sent");

    return [
      {
        id: "formation",
        title: "Complete sua formação",
        statusLabel: "Formação",
        description:
          "Famílias querem entender sua base profissional antes de chamar para uma conversa.",
        detail:
          "Informe sua formação principal e, se tiver, cursos complementares na área de cuidado.",
        href: "/caregiver/profile?step=bio",
        done: hasFormation,
      },
      {
        id: "experience",
        title: "Mostre sua experiência",
        statusLabel: "Experiência",
        description:
          "A experiência ajuda a família a perceber se você combina com o tipo de cuidado que ela precisa.",
        detail:
          "Preencha seus anos de atuação e explique, na biografia, com quais rotinas e pacientes você já trabalhou.",
        href: "/caregiver/profile?step=bio",
        done: hasExperience,
      },
      {
        id: "bio",
        title: "Capriche na biografia",
        statusLabel: "Biografia",
        description:
          "Conte sua experiência, sua formação e o tipo de cuidado que você oferece. Uma boa biografia ajuda as famílias a entenderem por que podem confiar em você.",
        detail:
          "Escreva pelo menos 150 caracteres falando sobre sua experiência, especialidades e jeito de cuidar.",
        href: "/caregiver/profile?step=bio",
        done: !needsBiography,
      },
      {
        id: "specialties",
        title: "Escolha suas especialidades",
        statusLabel: "Especialidades",
        description:
          "Especialidades fazem seu perfil aparecer nas buscas certas e evitam contatos que não combinam com sua atuação.",
        detail:
          "Marque todas as áreas em que você atende, como idosos, Alzheimer, pós-operatório ou companhia.",
        href: "/caregiver/profile?step=specialties",
        done: hasSpecialties,
      },
      {
        id: "availability",
        title: "Atualize sua disponibilidade",
        statusLabel: "Disponibilidade",
        description:
          "Famílias filtram por horários e formatos de atendimento. Disponibilidade clara evita conversa perdida.",
        detail:
          "Informe se você está aceitando novos atendimentos e quais jornadas consegue fazer.",
        href: "/caregiver/availability",
        done: hasAvailability,
      },
      {
        id: "documents",
        title: "Envie seus documentos",
        statusLabel: "Documentos",
        description:
          "Documentos aumentam a confiança e são necessários para deixar seu perfil pronto para famílias.",
        detail:
          "Envie RG ou CNH em uma imagem legível, com boa luz e sem cortes.",
        href: "/caregiver/documents",
        done: hasDocument,
      },
      {
        id: "references",
        title: "Adicione referências",
        statusLabel: "Referências",
        description:
          "Referências profissionais são um dos sinais de confiança mais fortes para quem está contratando cuidado.",
        detail:
          "Cadastre contatos de pessoas que possam confirmar sua experiência profissional.",
        href: "/caregiver/profile?step=references",
        done: !!profileData?.has_references,
      },
    ];
  }, [documents, profileData]);

  return <OnboardingGuideController role="caregiver" steps={steps} />;
}

function FamilyRouteOnboardingGuide() {
  const location = useLocation();
  const { data: familyProfile } = useFamilyProfile();
  const { data: favoriteIds = [] } = useFavoriteIds();

  const steps = React.useMemo<OnboardingStep[]>(() => {
    if (familyProfile === undefined) return [];

    const hasResponsible = !!(
      familyProfile?.profiles?.full_name?.trim() &&
      familyProfile?.profiles?.phone?.trim() &&
      familyProfile?.relationship
    );
    const hasAddress = !!(familyProfile?.cep && familyProfile?.city && familyProfile?.state);
    const hasElderlyProfile = !!(familyProfile?.elderly_name && familyProfile?.elderly_age);
    const hasCareNeeds = !!(
      (familyProfile?.care_needs?.trim().length ?? 0) >= 30 ||
      (familyProfile?.elderly_conditions?.length ?? 0) > 0
    );
    const hasSearchStarted = favoriteIds.length > 0 || location.pathname.startsWith("/family/search");

    return [
      {
        id: "responsible",
        title: "Complete seus dados",
        statusLabel: "Dados do responsável",
        description:
          "Esses dados ajudam o cuidador a saber com quem ele está conversando e como retornar o contato.",
        detail:
          "Preencha nome, WhatsApp e parentesco com a pessoa que receberá os cuidados.",
        href: "/family/profile",
        done: hasResponsible,
      },
      {
        id: "address",
        title: "Informe o endereço",
        statusLabel: "Endereço",
        description:
          "A busca usa a localização para mostrar cuidadores próximos e reduzir deslocamentos.",
        detail:
          "Complete CEP, cidade e estado para melhorar as recomendações por proximidade.",
        href: "/family/profile",
        done: hasAddress,
      },
      {
        id: "elderly-profile",
        title: "Descreva quem vai receber cuidado",
        statusLabel: "Perfil do idoso",
        description:
          "O perfil do idoso ajuda o cuidador a entender idade, rotina e nível de atenção necessário.",
        detail:
          "Informe nome, idade e condições de saúde relevantes para o atendimento.",
        href: "/family/profile",
        done: hasElderlyProfile,
      },
      {
        id: "care-needs",
        title: "Explique a necessidade de cuidado",
        statusLabel: "Necessidades de cuidado",
        description:
          "Uma descrição clara evita conversas desencontradas e ajuda a família a receber contatos mais adequados.",
        detail:
          "Descreva rotina, limitações, medicações, preferências e o que é essencial no cuidado.",
        href: "/family/profile",
        done: hasCareNeeds,
      },
      {
        id: "search-caregivers",
        title: "Procure cuidadores compatíveis",
        statusLabel: "Buscar cuidadores",
        description:
          "Depois do perfil preenchido, a busca fica mais certeira para comparar cuidadores próximos.",
        detail:
          "Use os filtros de localização, valor, referências e disponibilidade para encontrar boas opções.",
        href: "/family/search",
        done: hasSearchStarted,
        markSeenOnAction: true,
      },
    ];
  }, [familyProfile, favoriteIds.length, location.pathname]);

  return <OnboardingGuideController role="family" steps={steps} />;
}

const RoleOnboardingGuide = () => {
  const location = useLocation();
  const { role } = useAuth();

  if (role === "caregiver" && location.pathname.startsWith('/caregiver')) {
    return <CaregiverRouteOnboardingGuide />;
  }

  if (role === "family" && location.pathname.startsWith('/family')) {
    return <FamilyRouteOnboardingGuide />;
  }

  return null;
};

export default RoleOnboardingGuide;
