import { useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import CaregiverCard from "@/components/shared/CaregiverCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockFamilies, mockCaregivers } from "@/data/mockData";
import { Link } from "react-router-dom";

const Favorites = () => {
  const currentUser = mockFamilies[0];
  const [favorites, setFavorites] = useState(
    mockCaregivers.filter(c => c.status === 'verified').slice(0, 3)
  );

  const handleRemoveFavorite = (id: string) => {
    setFavorites(favorites.filter(f => f.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="family"
        userName={currentUser.name}
      />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Favoritos"
          description="Cuidadores que você salvou"
        />

        {favorites.length > 0 ? (
          <div className="space-y-4">
            {favorites.map((caregiver) => (
              <CaregiverCard
                key={caregiver.id}
                caregiver={caregiver}
                isFavorite={true}
                onFavorite={handleRemoveFavorite}
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
