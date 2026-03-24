import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, DollarSign, Star, Clock, MapPin, CalendarClock, User, Globe, Locate } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import CaregiverCard from "@/components/shared/CaregiverCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { modalitiesList, idiomasList } from "@/data/mockData";
import { useSearchCaregivers, type SearchFilters, type CaregiverPublicWithDistance } from "@/hooks/useSearchCaregivers";
import { useFavoriteIds, useAddFavorite, useRemoveFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { geocodeAddress, geocodeByCity } from "@/lib/geocode";
import { supabase } from "@/lib/supabase";
import { DEFAULT_RADIUS_KM, MAX_PRICE_PER_HOUR } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Idiomas exibíveis no filtro (sem "Outro")
const idiomasFilter = idiomasList.filter((i) => i !== "Outro");

const FILTERS_STORAGE_KEY = "cuidde_search_filters";

interface StoredFilters {
  searchQuery: string;
  showFilters: boolean;
  priceRange: number[];
  minRating: number;
  selectedModalities: string[];
  selectedIdiomas: string[];
  withReferences: boolean;
  emergencyOnly: boolean;
  cityFilter: string;
  neighborhoodFilter: string;
  radiusKm: number;
}

function loadStoredFilters(): Partial<StoredFilters> {
  try {
    const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const SearchCaregivers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: familyProfileData } = useFamilyProfile();
  const stored = useMemo(() => loadStoredFilters(), []);
  const [searchQuery, setSearchQuery] = useState(stored.searchQuery ?? "");
  const [showFilters, setShowFilters] = useState(stored.showFilters ?? true);
  const [priceRange, setPriceRange] = useState(stored.priceRange ?? [0, MAX_PRICE_PER_HOUR]);
  const [minRating, setMinRating] = useState(stored.minRating ?? 0);
  const [selectedModalities, setSelectedModalities] = useState<string[]>(stored.selectedModalities ?? []);
  const [selectedIdiomas, setSelectedIdiomas] = useState<string[]>(stored.selectedIdiomas ?? []);
  const [withReferences, setWithReferences] = useState(stored.withReferences ?? false);
  const [emergencyOnly, setEmergencyOnly] = useState(stored.emergencyOnly ?? false);
  const [cityFilter, setCityFilter] = useState(stored.cityFilter ?? "");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState(stored.neighborhoodFilter ?? "");
  const [radiusKm, setRadiusKm] = useState<number>(stored.radiusKm ?? DEFAULT_RADIUS_KM);

  // Persistir filtros no sessionStorage
  const persistFilters = useCallback(() => {
    const data: StoredFilters = {
      searchQuery, showFilters, priceRange, minRating,
      selectedModalities, selectedIdiomas, withReferences,
      emergencyOnly, cityFilter, neighborhoodFilter, radiusKm,
    };
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(data));
  }, [searchQuery, showFilters, priceRange, minRating, selectedModalities, selectedIdiomas, withReferences, emergencyOnly, cityFilter, neighborhoodFilter, radiusKm]);

  useEffect(() => { persistFilters(); }, [persistFilters]);

  const familyHasLocation = familyProfileData?.lat != null && familyProfileData?.lng != null;

  // Auto-geocodificar se o perfil não tem lat/lng
  // Dependências estáveis para evitar cancelamento prematuro por re-render
  const familyCep = familyProfileData?.cep ?? '';
  const familyCity = familyProfileData?.city ?? '';
  const familyState = familyProfileData?.state ?? '';
  const userId = user?.id;

  useEffect(() => {
    if (familyHasLocation || !userId) return;
    const hasCep = !!familyCep;
    const hasCity = !!familyCity && !!familyState;
    if (!hasCep && !hasCity) return;

    let cancelled = false;
    (async () => {
      let geo = hasCep
        ? await geocodeAddress({ cep: familyCep })
        : null;

      // Fallback: geocodificar por cidade/estado
      if (!geo && hasCity) {
        geo = await geocodeByCity(familyCity, familyState);
      }

      if (cancelled || !geo) return;
      await supabase
        .from('family_profiles')
        .update({ lat: geo.lat, lng: geo.lng })
        .eq('id', userId);
      qc.invalidateQueries({ queryKey: queryKeys.familyProfile(userId) });
    })();
    return () => { cancelled = true; };
  }, [familyHasLocation, familyCep, familyCity, familyState, userId, qc]);

  const filters: SearchFilters = useMemo(() => ({
    query: searchQuery || undefined,
    city: cityFilter || undefined,
    neighborhood: neighborhoodFilter || undefined,
    modalities: selectedModalities.length > 0 ? selectedModalities : undefined,
    idiomas: selectedIdiomas.length > 0 ? selectedIdiomas : undefined,
    withReferences: withReferences || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < MAX_PRICE_PER_HOUR ? priceRange[1] : undefined,
    minRating: minRating > 0 ? minRating : undefined,
    emergencyOnly: emergencyOnly || undefined,
    radiusKm: familyHasLocation ? radiusKm : undefined,
    familyLat: familyProfileData?.lat ?? undefined,
    familyLng: familyProfileData?.lng ?? undefined,
  }), [searchQuery, cityFilter, neighborhoodFilter, selectedModalities, selectedIdiomas, withReferences, priceRange, minRating, emergencyOnly, radiusKm, familyHasLocation, familyProfileData?.lat, familyProfileData?.lng]);

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
    setPriceRange([0, MAX_PRICE_PER_HOUR]);
    setMinRating(0);
    setSelectedModalities([]);
    setSelectedIdiomas([]);
    setWithReferences(false);
    setEmergencyOnly(false);
    setCityFilter("");
    setNeighborhoodFilter("");
  };

  const hasActiveFilters =
    priceRange[0] > 0 || priceRange[1] < MAX_PRICE_PER_HOUR ||
    minRating > 0 ||
    selectedModalities.length > 0 ||
    selectedIdiomas.length > 0 ||
    withReferences ||
    emergencyOnly ||
    cityFilter.trim() !== "" ||
    neighborhoodFilter.trim() !== "";

  const activeFilterCount =
    (priceRange[0] > 0 || priceRange[1] < MAX_PRICE_PER_HOUR ? 1 : 0) +
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
      <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} userPhoto={familyProfileData?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture} />

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

                {/* Raio de proximidade */}
                {familyHasLocation && (
                  <div>
                    <Label className="flex items-center gap-2 mb-2 text-xs">
                      <Locate className="w-4 h-4 text-muted-foreground" />
                      Raio de busca
                    </Label>
                    <Select
                      value={String(radiusKm)}
                      onValueChange={(v) => setRadiusKm(Number(v))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 km</SelectItem>
                        <SelectItem value="10">10 km</SelectItem>
                        <SelectItem value="20">20 km</SelectItem>
                        <SelectItem value="50">50 km</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Valor por hora */}
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-xs">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Valor por hora
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={MAX_PRICE_PER_HOUR}
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
                    onContact={(id) => navigate(`/family/caregiver/${id}`)}
                    hasDocsSent={caregiver.has_rg_cnh}
                    hasAntecedentes={caregiver.has_antecedentes}
                    hasCertificados={caregiver.has_certificado}
                    hasReferencias={caregiver.has_references}
                    distanceKm={caregiver.distance_km}
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
