import { Search, Heart, Clock, Users } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import MetricCard from "@/components/shared/MetricCard";
import CaregiverCard from "@/components/shared/CaregiverCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockFamilies, mockCaregivers, mockDocuments, mockReferences } from "@/data/mockData";
import { Link } from "react-router-dom";

const FamilyDashboard = () => {
  const currentUser = mockFamilies[0];
  const favoriteCaregivers = mockCaregivers.filter(c => c.status === 'verified').slice(0, 2);
  const recentSearches = mockCaregivers.filter(c => c.status === 'verified').slice(0, 3);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="family"
        userName={currentUser.name}
      />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title={`Olá, ${currentUser.name.split(' ')[0]}!`}
          description="Encontre o cuidador ideal para sua família"
        >
          <Button asChild className="gap-2 bg-accent hover:bg-accent/90">
            <Link to="/family/search">
              <Search className="w-4 h-4" />
              Buscar cuidadores
            </Link>
          </Button>
        </PageHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MetricCard
            title="Cuidadores favoritos"
            value={favoriteCaregivers.length}
            icon={<Heart className="w-5 h-5" />}
          />
          <MetricCard
            title="Solicitações ativas"
            value={2}
            icon={<Clock className="w-5 h-5" />}
          />
          <MetricCard
            title="Cuidadores disponíveis"
            value={mockCaregivers.filter(c => c.status === 'verified').length}
            icon={<Users className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Searches */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cuidadores recomendados</CardTitle>
              <Link to="/family/search" className="text-sm text-primary hover:underline">
                Ver todos
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* TODO: replace mockDistances with real geolocation distances from API */}
              {recentSearches.map((caregiver, index) => {
                const docs = mockDocuments.filter((d) => d.caregiverId === caregiver.id);
                const refs = mockReferences.filter((r) => r.caregiverId === caregiver.id);
                const mockDistances = [2, 5, 11];
                return (
                  <CaregiverCard
                    key={caregiver.id}
                    caregiver={caregiver}
                    distanceKm={mockDistances[index]}
                    hasDocsSent={docs.some((d) => d.status === "approved" || d.status === "sent")}
                    hasCertificados={docs.some((d) => d.type === "certificacao" && (d.status === "approved" || d.status === "sent"))}
                    hasAntecedentes={docs.some((d) => d.type === "antecedentes" && (d.status === "approved" || d.status === "sent"))}
                    hasReferencias={refs.length > 0}
                  />
                );
              })}
            </CardContent>
          </Card>

          {/* Elderly Info */}
          <Card>
            <CardHeader>
              <CardTitle>Perfil do idoso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{currentUser.elderlyInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Idade</p>
                  <p className="font-medium">{currentUser.elderlyInfo.age} anos</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Condições de saúde</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentUser.elderlyInfo.healthConditions.map((condition) => (
                      <span
                        key={condition}
                        className="px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Necessidades</p>
                  <p className="text-sm text-foreground mt-1">{currentUser.elderlyInfo.careNeeds}</p>
                </div>
              </div>

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
