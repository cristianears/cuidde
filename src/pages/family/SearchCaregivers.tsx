import { useState, useMemo } from "react";
import { Search, Filter, DollarSign, Star, Clock, MapPin } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import CaregiverCard from "@/components/shared/CaregiverCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { specialtiesList } from "@/data/mockData";
import { useSearchCaregivers, type SearchFilters } from "@/hooks/useSearchCaregivers";
import { useFavoriteIds, useAddFavorite, useRemoveFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const SearchCaregivers = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [minRating, setMinRating] = useState(0);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("");

  const filters: SearchFilters = useMemo(() => ({
    query: searchQuery || undefined,
    city: cityFilter || undefined,
    neighborhood: neighborhoodFilter || undefined,
    specialties: selectedSpecialties.length > 0 ? selectedSpecialties : undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 200 ? priceRange[1] : undefined,
    minRating: minRating > 0 ? minRating : undefined,
    emergencyOnly: emergencyOnly || undefined,
  }), [searchQuery, cityFilter, neighborhoodFilter, selectedSpecialties, priceRange, minRating, emergencyOnly]);

  const { data: caregivers = [], isLoading } = useSearchCaregivers(filters);
  const { data: favoriteIds = new Set<string>() } = useFavoriteIds();
  const { mutate: addFavorite } = useAddFavorite();
  const { mutate: removeFavorite } = useRemoveFavorite();

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const clearFilters = () => {
    setPriceRange([0, 200]);
    setMinRating(0);
    setSelectedSpecialties([]);
    setEmergencyOnly(false);
    setCityFilter("");
    setNeighborhoodFilter("");
  };

  const hasActiveFilters =
    priceRange[0] > 0 ||
    priceRange[1] < 200 ||
    minRating > 0 ||
    selectedSpecialties.length > 0 ||
    emergencyOnly ||
    cityFilter.trim() !== "" ||
    neighborhoodFilter.trim() !== "";

  const activeFilterCount =
    (priceRange[0] > 0 || priceRange[1] < 200 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (selectedSpecialties.length > 0 ? 1 : 0) +
    (emergencyOnly ? 1 : 0) +
    (cityFilter.trim() ? 1 : 0) +
    (neighborhoodFilter.trim() ? 1 : 0);

  const handleFavorite = (caregiverId: string) => {
    if (!user) return;
    if (favoriteIds.has(caregiverId)) {
      removeFavorite(caregiverId);
    } else {
      addFavorite(caregiverId);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="family" userName="" />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Buscar Cuidadores"
          description="Encontre profissionais qualificados na sua região"
        />

        {/* Barra de busca */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, bairro ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 h-12"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Painel de filtros */}
          {showFilters && (
            <Card className="w-80 flex-shrink-0 h-fit sticky top-6">
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base">Filtros</CardTitle>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    Limpar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Especialidades */}
                <div>
                  <Label className="mb-3 block">Especialidades</Label>
                  <div className="flex flex-wrap gap-2">
                    {specialtiesList.slice(0, 6).map((specialty) => (
                      <Badge
                        key={specialty}
                        variant={selectedSpecialties.includes(specialty) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all text-xs",
                          selectedSpecialties.includes(specialty)
                            ? "bg-primary hover:bg-primary/90"
                            : "hover:bg-muted"
                        )}
                        onClick={() => toggleSpecialty(specialty)}
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Localização — Cidade e Bairro */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Localização
                  </Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Cidade"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Input
                      placeholder="Bairro"
                      value={neighborhoodFilter}
                      onChange={(e) => setNeighborhoodFilter(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Valor por hora */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Valor por hora
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={200}
                    step={5}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>R$ {priceRange[0]}</span>
                    <span>R$ {priceRange[1]}</span>
                  </div>
                </div>

                {/* Avaliação mínima */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    Avaliação mínima
                  </Label>
                  <div className="flex gap-2">
                    {[0, 3, 4, 4.5].map((rating) => (
                      <Button
                        key={rating}
                        variant={minRating === rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMinRating(rating)}
                        className={cn("flex-1", minRating === rating && "bg-primary")}
                      >
                        {rating === 0 ? "Todas" : `${rating}+`}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Disponibilidade */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Disponibilidade
                  </Label>
                  <Button
                    variant={emergencyOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEmergencyOnly(!emergencyOnly)}
                    className={cn("w-full", emergencyOnly && "bg-primary")}
                  >
                    Disponível para emergências
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultados */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Buscando cuidadores...</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {caregivers.length} cuidador
                  {caregivers.length !== 1 ? "es" : ""} encontrado
                  {caregivers.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-48 animate-pulse bg-muted" />
                ))}
              </div>
            ) : caregivers.length > 0 ? (
              <div className="space-y-4">
                {caregivers.map((caregiver) => (
                  <CaregiverCard
                    key={caregiver.id}
                    caregiver={caregiver}
                    isFavorite={favoriteIds.has(caregiver.id)}
                    onFavorite={handleFavorite}
                    hasDocsSent={caregiver.has_rg_cnh}
                    hasAntecedentes={caregiver.has_antecedentes}
                    hasCertificados={caregiver.has_certificado}
                    hasReferencias={caregiver.has_references}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum cuidador encontrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros para ver mais resultados
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchCaregivers;
