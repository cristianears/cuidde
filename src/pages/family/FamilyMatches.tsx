import { Link } from "react-router-dom";
import { Calendar, Search, Clock, CheckCircle, XCircle, UserCheck } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";

type MatchStatus = "pending" | "accepted" | "rejected";

interface MatchRequest {
  id: string;
  caregiver: {
    name: string;
    photo?: string;
    specialties: string[];
  };
  requestDate: string;
  status: MatchStatus;
  appointmentId?: string;
}

const mockMatchRequests: MatchRequest[] = [
  {
    id: "1",
    caregiver: {
      name: "Maria Silva",
      photo: "",
      specialties: ["Alzheimer", "Mobilidade Reduzida"],
    },
    requestDate: "2024-01-20",
    status: "accepted",
    appointmentId: "1",
  },
  {
    id: "2",
    caregiver: {
      name: "João Santos",
      photo: "",
      specialties: ["Parkinson", "Cuidados Noturnos"],
    },
    requestDate: "2024-01-22",
    status: "pending",
  },
  {
    id: "3",
    caregiver: {
      name: "Ana Costa",
      photo: "",
      specialties: ["Diabetes", "Hipertensão"],
    },
    requestDate: "2024-01-18",
    status: "rejected",
  },
  {
    id: "4",
    caregiver: {
      name: "Carlos Oliveira",
      photo: "",
      specialties: ["Fisioterapia", "Reabilitação"],
    },
    requestDate: "2024-01-25",
    status: "pending",
  },
];

const FamilyMatches = () => {
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();

  const hasAnyMatches = mockMatchRequests.length > 0;

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Aguardando resposta
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3" />
            Aceito
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <XCircle className="w-3 h-3" />
            Recusado
          </Badge>
        );
    }
  };

  const getStatusMessage = (status: MatchStatus) => {
    switch (status) {
      case "pending":
        return "Aguardando resposta do cuidador.";
      case "accepted":
        return "O cuidador aceitou sua solicitação.";
      case "rejected":
        return "O cuidador recusou esta solicitação.";
    }
  };

  const MatchCard = ({ match }: { match: MatchRequest }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={match.caregiver.photo} alt={match.caregiver.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {match.caregiver.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {match.caregiver.name}
              </h3>
              {getStatusBadge(match.status)}
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {match.caregiver.specialties.map((specialty) => (
                <Badge key={specialty} variant="outline" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
              <Calendar className="w-4 h-4" />
              <span>Solicitado em {new Date(match.requestDate).toLocaleDateString("pt-BR")}</span>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {getStatusMessage(match.status)}
            </p>

            {match.status === "accepted" && match.appointmentId && (
              <Button asChild size="sm" className="gap-2">
                <Link to={`/family/appointments/${match.appointmentId}`}>
                  <CheckCircle className="w-4 h-4" />
                  Acessar atendimento
                </Link>
              </Button>
            )}

            {match.status === "rejected" && (
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to="/family/search">
                  <Search className="w-4 h-4" />
                  Buscar outros cuidadores
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <UserCheck className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhuma solicitação enviada
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Quando você solicitar contato com um cuidador, o status aparecerá aqui.
        </p>
        <Button asChild className="gap-2">
          <Link to="/family/search">
            <Search className="w-4 h-4" />
            Buscar cuidadores
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  if (!hasAnyMatches) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} />

        <main className="flex-1 p-6 lg:p-8">
          <PageHeader
            title="Solicitações"
            description="Acompanhe o status das suas solicitações enviadas aos cuidadores"
          />

          <div className="mt-6">
            <EmptyState />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Solicitações"
          description="Acompanhe o status das suas solicitações enviadas aos cuidadores"
        />

        <div className="grid gap-4">
          {mockMatchRequests.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default FamilyMatches;
