import { Search, Heart, Clock, Users } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import MetricCard from "@/components/shared/MetricCard";
import CaregiverCard from "@/components/shared/CaregiverCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useFamilyMatches } from "@/hooks/useFamilyMatches";
import { useFavoriteIds, useAddFavorite, useRemoveFavorite } from "@/hooks/useFavorites";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { useAuth } from "@/contexts/AuthContext";

const FamilyDashboard = () => {
  const { user } = useAuth();
  const { data: familyProfile } = useFamilyProfile();
  const { data: matchedCaregivers = [], isLoading: loadingMatches } = useFamilyMatches(3);
  const { data: favoriteIds = new Set<string>() } = useFavoriteIds();
  const { mutate: addFavorite } = useAddFavorite();
  const { mutate: removeFavorite } = useRemoveFavorite();

  const handleFavorite = (caregiverId: string) => {
    if (!user) return;
    if (favoriteIds.has(caregiverId)) {
      removeFavorite(caregiverId);
    } else {
      addFavorite(caregiverId);
    }
  };

  const displayName = familyProfile
    ? (familyProfile as any).profiles?.full_name ?? ""
    : "";
  const firstName = displayName ? displayName.split(" ")[0] : "Família";

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="family"
        userName={displayName}
      />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title={`Olá, ${firstName}!`}
          description="Encontre o cuidador ideal para sua família"
        >
          <Button asChild className="gap-2 bg-accent hover:bg-accent/90">
            <Link to="/family/search">
              <Search className="w-4 h-4" />
              Buscar cuidadores
            </Link>
          </Button>
        </PageHeader>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MetricCard
            title="Cuidadores favoritos"
            value={favoriteIds.size}
            icon={<Heart className="w-5 h-5" />}
          />
          <MetricCard
            title="Solicitações ativas"
            value={2}
            icon={<Clock className="w-5 h-5" />}
          />
          <MetricCard
            title="Cuidadores recomendados"
            value={matchedCaregivers.length}
            icon={<Users className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cuidadores recomendados */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cuidadores recomendados</CardTitle>
              <Link to="/family/search" className="text-sm text-primary hover:underline">
                Ver todos
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingMatches ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 rounded-lg animate-pulse bg-muted" />
                  ))}
                </>
              ) : matchedCaregivers.length > 0 ? (
                matchedCaregivers.map((caregiver) => (
                  <CaregiverCard
                    key={caregiver.id}
                    caregiver={caregiver}
                    isFavorite={favoriteIds.has(caregiver.id)}
                    onFavorite={handleFavorite}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum cuidador disponível no momento.{" "}
                  <Link to="/family/search" className="text-primary hover:underline">
                    Buscar cuidadores
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Perfil do idoso */}
          <Card>
            <CardHeader>
              <CardTitle>Perfil do idoso</CardTitle>
            </CardHeader>
            <CardContent>
              {familyProfile ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{familyProfile.elderly_name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Idade</p>
                    <p className="font-medium">
                      {familyProfile.elderly_age ? `${familyProfile.elderly_age} anos` : "—"}
                    </p>
                  </div>
                  {familyProfile.elderly_conditions.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Condições de saúde</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {familyProfile.elderly_conditions.map((condition) => (
                          <span
                            key={condition}
                            className="px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {familyProfile.care_needs && (
                    <div>
                      <p className="text-sm text-muted-foreground">Necessidades</p>
                      <p className="text-sm text-foreground mt-1">{familyProfile.care_needs}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete o perfil da família para ver as informações do idoso.
                </p>
              )}

              <Button asChild variant="outline" className="w-full mt-6">
                <Link to="/family/profile">Editar perfil</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FamilyDashboard;
