import { useState, useMemo } from "react";
import { Search, Filter, DollarSign, Star, Clock, MapPin, CalendarClock, User, Globe } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import CaregiverCard from "@/components/shared/CaregiverCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { modalitiesList, idiomasList } from "@/data/mockData";
import { useSearchCaregivers, type SearchFilters } from "@/hooks/useSearchCaregivers";
import { useFavoriteIds, useAddFavorite, useRemoveFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { cn } from "@/lib/utils";

// Idiomas exibíveis no filtro (sem "Outro")
const idiomasFilter = idiomasList.filter((i) => i !== "Outro");

const SearchCaregivers = () => {
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [minRating, setMinRating] = useState(0);
  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [selectedIdiomas, setSelectedIdiomas] = useState<string[]>([]);
  const [withReferences, setWithReferences] = useState(false);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("");

  const filters: SearchFilters = useMemo(() => ({
    query: searchQuery || undefined,
    city: cityFilter || undefined,
    neighborhood: neighborhoodFilter || undefined,
    modalities: selectedModalities.length > 0 ? selectedModalities : undefined,
    idiomas: selectedIdiomas.length > 0 ? selectedIdiomas : undefined,
    withReferences: withReferences || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 200 ? priceRange[1] : undefined,
    minRating: minRating > 0 ? minRating : undefined,
    emergencyOnly: emergencyOnly || undefined,
  }), [searchQuery, cityFilter, neighborhoodFilter, selectedModalities, selectedIdiomas, withReferences, priceRange, minRating, emergencyOnly]);

  const { data: caregivers = [], isLoading } = useSearchCaregivers(filters);
  const { data: favoriteIdsList = [] } = useFavoriteIds();
  const favoriteIds = new Set(favoriteIdsList);
  const { mutate: addFavorite } = useAddFavorite();
  const { mutate: removeFavorite } = useRemoveFavorite();

  const toggle = <T extends string>(
    list: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>,
    value: T
  ) => setList((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);

  const clearFilters = () => {
    setPriceRange([0, 200]);
    setMinRating(0);
    setSelectedModalities([]);
    setSelectedIdiomas([]);
    setWithReferences(false);
    setEmergencyOnly(false);
    setCityFilter("");
    setNeighborhoodFilter("");
  };

  const hasActiveFilters =
    priceRange[0] > 0 || priceRange[1] < 200 ||
    minRating > 0 ||
    selectedModalities.length > 0 ||
    selectedIdiomas.length > 0 ||
    withReferences ||
    emergencyOnly ||
    cityFilter.trim() !== "" ||
    neighborhoodFilter.trim() !== "";

  const activeFilterCount =
    (priceRange[0] > 0 || priceRange[1] < 200 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (selectedModalities.length > 0 ? 1 : 0) +
    (selectedIdiomas.length > 0 ? 1 : 0) +
    (withReferences ? 1 : 0) +
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
      <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} />

      <main className="flex-1 min-w-0 overflow-hidden p-4 lg:p-5">
        <PageHeader
          title="Buscar Cuidadores"
          description="Encontre profissionais qualificados na sua região"
        />
        {/* Busca + toggle filtros */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, bairro ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 h-10 shrink-0"
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

        <div className="flex gap-4 min-w-0 items-start">
          {/* Painel de filtros — metade da tela */}
          {showFilters && (
            <Card className="w-[317px] flex-shrink-0 h-fit sticky top-4">
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm font-semibold">Filtros</CardTitle>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-7 text-xs">
                    Limpar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6 px-4 pb-4">

                {/* Formato de atendimento */}
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-xs">
                    <CalendarClock className="w-4 h-4 text-muted-foreground" />
                    Formato de atendimento
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {modalitiesList.map((modality) => (
                      <Badge
                        key={modality}
                        variant={selectedModalities.includes(modality) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all text-xs",
                          selectedModalities.includes(modality)
                            ? "bg-primary hover:bg-primary/90"
                            : "hover:bg-muted"
                        )}
                        onClick={() => toggle(selectedModalities, setSelectedModalities, modality)}
                      >
                        {modality}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Idiomas */}
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-xs">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Idiomas
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {idiomasFilter.map((idioma) => (
                      <Badge
                        key={idioma}
                        variant={selectedIdiomas.includes(idioma) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all text-xs",
                          selectedIdiomas.includes(idioma)
                            ? "bg-primary hover:bg-primary/90"
                            : "hover:bg-muted"
                        )}
                        onClick={() => toggle(selectedIdiomas, setSelectedIdiomas, idioma)}
                      >
                        {idioma}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Localização */}
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-xs">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Localização
                  </Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Cidade"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Bairro"
                      value={neighborhoodFilter}
                      onChange={(e) => setNeighborhoodFilter(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Valor por hora */}
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-xs">
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
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>R$ {priceRange[0]}</span>
                    <span>R$ {priceRange[1]}</span>
                  </div>
                </div>

                {/* Avaliação mínima */}
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-xs">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    Avaliação mínima
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {[0, 3, 4, 4.5].map((rating) => (
                      <Button
                        key={rating}
                        variant={minRating === rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMinRating(rating)}
                        className={cn("h-8 text-xs px-2", minRating === rating && "bg-primary")}
                      >
                        {rating === 0 ? "Todas" : `${rating}+`}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Disponibilidade */}
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-xs">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Disponibilidade
                  </Label>
                  <Button
                    variant={emergencyOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEmergencyOnly(!emergencyOnly)}
                    className={cn("h-8 text-xs justify-start w-full", emergencyOnly && "bg-primary")}
                  >
                    Disponível p/ emergências
                  </Button>
                </div>

                {/* Referências */}
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-xs">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Referências
                  </Label>
                  <Button
                    variant={withReferences ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWithReferences(!withReferences)}
                    className={cn("h-8 text-xs justify-start w-full", withReferences && "bg-primary")}
                  >
                    Com referências
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Resultados */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Buscando cuidadores...</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {caregivers.length} cuidador{caregivers.length !== 1 ? "es" : ""} encontrado{caregivers.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-36 animate-pulse bg-muted" />
                ))}
              </div>
            ) : caregivers.length > 0 ? (
              <div className="space-y-3">
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
