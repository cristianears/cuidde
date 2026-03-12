import { Heart } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import CaregiverCard from "@/components/shared/CaregiverCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFavorites, useRemoveFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Favorites = () => {
  const { user } = useAuth();
  const { data: favorites = [], isLoading } = useFavorites();
  const { mutate: removeFavorite } = useRemoveFavorite();

  const handleRemoveFavorite = (caregiverId: string) => {
    removeFavorite(caregiverId);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="family" userName="" />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Favoritos"
          description="Cuidadores que você salvou"
        />

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-48 animate-pulse bg-muted" />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="space-y-4">
            {favorites.map(({ favorite_id, caregiver }) => (
              <CaregiverCard
                key={favorite_id}
                caregiver={caregiver}
                isFavorite={true}
                onFavorite={handleRemoveFavorite}
                hasDocsSent={caregiver.has_rg_cnh}
                hasAntecedentes={caregiver.has_antecedentes}
                hasCertificados={caregiver.has_certificado}
                hasReferencias={caregiver.has_references}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum favorito ainda
            </h3>
            <p className="text-muted-foreground mb-4">
              Explore cuidadores e salve seus favoritos para acessá-los facilmente
            </p>
            <Button asChild className="bg-accent hover:bg-accent/90">
              <Link to="/family/search">Buscar cuidadores</Link>
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Favorites;
