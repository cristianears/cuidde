import { useState } from "react";
import { Search, Filter, MapPin, DollarSign, Star, Clock, Navigation } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import CaregiverCard from "@/components/shared/CaregiverCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockFamilies, mockCaregivers, specialtiesList, Caregiver } from "@/data/mockData";
import { cn } from "@/lib/utils";

const SearchCaregivers = () => {
  const currentUser = mockFamilies[0];
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [minRating, setMinRating] = useState(0);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [proximityRadius, setProximityRadius] = useState<number | null>(null);

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const filteredCaregivers = mockCaregivers.filter((caregiver) => {
    // Only show verified caregivers
    if (caregiver.status !== 'verified') return false;

    // Search query
    if (searchQuery && !caregiver.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !caregiver.address.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !caregiver.address.city.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Price range
    if (caregiver.pricePerHour < priceRange[0] || caregiver.pricePerHour > priceRange[1]) {
      return false;
    }

    // Rating
    if (caregiver.rating < minRating) {
      return false;
    }

    // Specialties
    if (selectedSpecialties.length > 0 &&
        !selectedSpecialties.some(s => caregiver.specialties.includes(s))) {
      return false;
    }

    // Emergency availability
    if (emergencyOnly && !caregiver.emergencyAvailable) {
      return false;
    }

    return true;
  });

  const clearFilters = () => {
    setPriceRange([0, 100]);
    setMinRating(0);
    setSelectedSpecialties([]);
    setEmergencyOnly(false);
    setProximityRadius(null);
  };

  const hasActiveFilters = priceRange[0] > 0 || priceRange[1] < 100 || 
    minRating > 0 || selectedSpecialties.length > 0 || emergencyOnly || proximityRadius !== null;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="family"
        userName={currentUser.name}
      />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Buscar Cuidadores"
          description="Encontre profissionais qualificados na sua região"
        />

        {/* Search Bar */}
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
                {(priceRange[0] > 0 || priceRange[1] < 100 ? 1 : 0) +
                  (minRating > 0 ? 1 : 0) +
                  (selectedSpecialties.length > 0 ? 1 : 0) +
                      (emergencyOnly ? 1 : 0) +
                      (proximityRadius !== null ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <Card className="w-80 flex-shrink-0 h-fit sticky top-6">
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base">Filtros</CardTitle>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                    Limpar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Specialties */}
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

                {/* Proximity */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Navigation className="w-4 h-4 text-muted-foreground" />
                    Proximidade
                  </Label>
                  <div className="flex gap-2">
                    {[3, 5, 10, 20].map((radius) => (
                      <Button
                        key={radius}
                        variant={proximityRadius === radius ? "default" : "outline"}
                        size="sm"
                        onClick={() => setProximityRadius(proximityRadius === radius ? null : radius)}
                        className={cn(
                          "flex-1",
                          proximityRadius === radius && "bg-primary"
                        )}
                      >
                        {radius} km
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    A distância é calculada a partir do endereço informado no seu perfil.
                  </p>
                </div>

                {/* Price Range */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Valor por hora
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={100}
                    step={5}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>R$ {priceRange[0]}</span>
                    <span>R$ {priceRange[1]}</span>
                  </div>
                </div>

                {/* Rating */}
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
                        className={cn(
                          "flex-1",
                          minRating === rating && "bg-primary"
                        )}
                      >
                        {rating === 0 ? 'Todas' : `${rating}+`}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Emergency */}
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

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredCaregivers.length} cuidador{filteredCaregivers.length !== 1 ? 'es' : ''} encontrado{filteredCaregivers.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filteredCaregivers.length > 0 ? (
              <div className="space-y-4">
                {filteredCaregivers.map((caregiver) => (
                  <CaregiverCard key={caregiver.id} caregiver={caregiver} />
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
