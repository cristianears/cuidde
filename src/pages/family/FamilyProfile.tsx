import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  X,
  Camera,
  Trash2,
  User,
  MapPin,
  Heart,
  Stethoscope,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { mockFamilies } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { fetchAddressByCep } from "@/lib/viacep";

const healthConditionOptions = [
  "Alzheimer",
  "Parkinson",
  "Acamado",
  "Mobilidade reduzida",
  "Demência",
  "Pós-operatório",
  "AVC",
  "Diabetes",
  "Hipertensão",
  "Outros"
];

const serviceFormatOptions = [
  { value: "plantoes", label: "Plantões avulsos" },
  { value: "diarias", label: "Diárias" },
  { value: "turnos", label: "Turnos fixos" },
  { value: "cobertura", label: "Cobertura temporária / substituição" }
];

const FamilyProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();
  const currentUser = mockFamilies[0];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const realName = familyProfileData?.profiles?.full_name ?? user?.user_metadata?.full_name ?? "";
  const realEmail = user?.email ?? "";
  const realPhone = familyProfileData?.profiles?.phone ?? user?.user_metadata?.phone ?? "";

  // Responsible data
  const [responsibleName, setResponsibleName] = useState(realName || currentUser.name);
  const [responsibleEmail, setResponsibleEmail] = useState(realEmail || currentUser.email);
  const [responsiblePhone, setResponsiblePhone] = useState(realPhone || currentUser.phone);
  const [relationship, setRelationship] = useState("filho");
  const [responsiblePhoto, setResponsiblePhoto] = useState<string | null>(currentUser.photo || null);

  // Sincronizar dados reais quando carregarem
  useEffect(() => {
    if (familyProfileData) {
      const name = familyProfileData.profiles?.full_name ?? "";
      const phone = familyProfileData.profiles?.phone ?? "";
      if (name) setResponsibleName(name);
      if (phone) setResponsiblePhone(phone);
    }
    if (user?.email) setResponsibleEmail(user.email);
  }, [familyProfileData, user?.email]);

  // Photo upload handler (mock)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo permitido: 5MB.");
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error("Formato inválido. Use JPG ou PNG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setResponsiblePhoto(event.target?.result as string);
      toast.success("Foto atualizada com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setResponsiblePhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success("Foto removida.");
  };

  // Address
  const [cep, setCep] = useState(currentUser.address?.cep || "01310-100");
  const [street, setStreet] = useState(currentUser.address?.street || "Avenida Paulista");
  const [number, setNumber] = useState(currentUser.address?.number || "1000");
  const [neighborhood, setNeighborhood] = useState(currentUser.address?.neighborhood || "Bela Vista");
  const [city, setCity] = useState(currentUser.address?.city || "São Paulo");
  const [state, setState] = useState(currentUser.address?.state || "SP");
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  // Elderly profile
  const [elderlyName, setElderlyName] = useState(currentUser.elderlyInfo.name);
  const [elderlyAge, setElderlyAge] = useState(currentUser.elderlyInfo.age.toString());
  const [selectedConditions, setSelectedConditions] = useState<string[]>(currentUser.elderlyInfo.healthConditions);
  const [bloodType, setBloodType] = useState("O+");
  const [preExistingConditions, setPreExistingConditions] = useState("Diabetes tipo 2, hipertensão arterial controlada.");
  const [allergies, setAllergies] = useState("Dipirona, frutos do mar.");
  const [continuousMedications, setContinuousMedications] = useState("Metformina 850mg (08h e 20h), Losartana 50mg (08h).");
  const [responsibleDoctor, setResponsibleDoctor] = useState("Dr. Carlos Mendes - Clínica Vida Plena");
  const [healthInsurance, setHealthInsurance] = useState("Bradesco Saúde");
  const [careNeeds, setCareNeeds] = useState(currentUser.elderlyInfo.careNeeds);

  // Preferences
  const [selectedServiceFormats, setSelectedServiceFormats] = useState<string[]>(["diarias"]);
  const [hourlyRange, setHourlyRange] = useState([15, 35]);
  const [dailyRange, setDailyRange] = useState([150, 350]);
  const [distancePreference, setDistancePreference] = useState("10km");

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    );
  };

  const toggleServiceFormat = (format: string) => {
    setSelectedServiceFormats(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const handleCepChange = async (value: string) => {
    setCep(value);
    const clean = value.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsFetchingCep(true);
      try {
        const address = await fetchAddressByCep(clean);
        if (address) {
          setStreet(address.street);
          setNeighborhood(address.neighborhood);
          setCity(address.city);
          setState(address.state);
        }
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  const handleSave = () => {
    toast.success("Perfil atualizado com sucesso!");
  };

  const handleCancel = () => {
    navigate("/family");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="family"
        userName={familyProfileData?.profiles?.full_name ?? user?.user_metadata?.full_name ?? user?.email ?? ""}
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PageHeader
          title="Perfil da Família"
          description="Atualize as informações do responsável e do idoso para facilitar o match com cuidadores."
        />

        {/* Hidden file input for photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        <div className="space-y-5 md:space-y-6 max-w-4xl">
          {/* Seção A — Dados do Responsável */}
          <Card className="animate-fade-in">
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Dados do Responsável
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 md:space-y-6">
              {/* Photo */}
              <div className="flex items-center gap-4 md:gap-6">
                <div className="relative shrink-0">
                  {responsiblePhoto ? (
                    <img
                      src={responsiblePhoto}
                      alt={responsibleName}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-muted flex items-center justify-center">
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-1.5 md:p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
                <div>
                  <p className="text-sm md:text-base font-medium text-foreground">Foto do responsável</p>
                  <p className="text-xs md:text-sm text-muted-foreground mb-2">JPG, PNG. Máximo 5MB.</p>
                  {responsiblePhoto && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive text-xs md:text-sm"
                      onClick={handleRemovePhoto}
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      Remover foto
                    </Button>
                  )}
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="responsibleName" className="text-xs md:text-sm">Nome completo</Label>
                  <Input
                    id="responsibleName"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    placeholder="Nome do responsável"
                    className="mt-1.5 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="responsibleEmail" className="text-xs md:text-sm">E-mail</Label>
                  <Input
                    id="responsibleEmail"
                    type="email"
                    value={responsibleEmail}
                    readOnly
                    className="mt-1.5 text-sm bg-muted/40 cursor-not-allowed"
                  />
                </div>
                <div>
                  <Label htmlFor="responsiblePhone" className="text-xs md:text-sm">WhatsApp / Telefone</Label>
                  <Input
                    id="responsiblePhone"
                    value={responsiblePhone}
                    onChange={(e) => setResponsiblePhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="mt-1.5 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="relationship" className="text-xs md:text-sm">Parentesco com o idoso</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger className="mt-1.5 text-sm">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filho">Filho(a)</SelectItem>
                      <SelectItem value="conjuge">Cônjuge</SelectItem>
                      <SelectItem value="neto">Neto(a)</SelectItem>
                      <SelectItem value="responsavel">Responsável legal</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção B — Endereço */}
          <Card className="animate-fade-in">
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 md:space-y-6">
              <p className="text-xs md:text-sm text-muted-foreground -mt-2">
                Usado para busca por proximidade com cuidadores
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="cep" className="text-xs md:text-sm">CEP</Label>
                  <Input
                    id="cep"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className={cn("mt-1.5 text-sm", isFetchingCep && "opacity-70")}
                  />
                  {isFetchingCep && <p className="text-xs text-muted-foreground mt-1">Buscando endereço...</p>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="street" className="text-xs md:text-sm">Rua</Label>
                  <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Nome da rua" className="mt-1.5 text-sm" />
                </div>
                <div>
                  <Label htmlFor="number" className="text-xs md:text-sm">Número</Label>
                  <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="123" className="mt-1.5 text-sm" />
                </div>
                <div>
                  <Label htmlFor="neighborhood" className="text-xs md:text-sm">Bairro</Label>
                  <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className="mt-1.5 text-sm" />
                </div>
                <div className="grid grid-cols-[1fr_5rem] gap-3 md:gap-4">
                  <div>
                    <Label htmlFor="city" className="text-xs md:text-sm">Cidade</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-xs md:text-sm">UF</Label>
                    <Input id="state" value={state} onChange={(e) => setState(e.target.value)} maxLength={2} className="mt-1.5 text-sm" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção C — Perfil do Idoso */}
          <Card className="animate-fade-in">
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Heart className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Perfil do Idoso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 md:space-y-6">
              <p className="text-xs md:text-sm text-muted-foreground -mt-2">
                Informações sobre a pessoa que receberá os cuidados
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="elderlyName" className="text-xs md:text-sm">Nome do idoso</Label>
                  <Input id="elderlyName" value={elderlyName} onChange={(e) => setElderlyName(e.target.value)} placeholder="Nome do idoso" className="mt-1.5 text-sm" />
                </div>
                <div>
                  <Label htmlFor="elderlyAge" className="text-xs md:text-sm">Idade</Label>
                  <Input id="elderlyAge" type="number" value={elderlyAge} onChange={(e) => setElderlyAge(e.target.value)} placeholder="Ex: 78" className="mt-1.5 text-sm" />
                </div>
              </div>

              <div>
                <Label className="text-xs md:text-sm">Condições de saúde</Label>
                <p className="text-xs md:text-sm text-muted-foreground mb-3">
                  Selecione as condições relevantes para o cuidado
                </p>
                <div className="flex flex-wrap gap-2">
                  {healthConditionOptions.map((condition) => (
                    <Badge
                      key={condition}
                      variant={selectedConditions.includes(condition) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all text-xs",
                        selectedConditions.includes(condition)
                          ? "bg-primary hover:bg-primary/90"
                          : "hover:bg-muted",
                      )}
                      onClick={() => toggleCondition(condition)}
                    >
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="careNeeds" className="text-xs md:text-sm">Necessidades de cuidado</Label>
                <Textarea
                  id="careNeeds"
                  value={careNeeds}
                  onChange={(e) => setCareNeeds(e.target.value)}
                  placeholder="Descreva rotina, limitações, medicações, preferências e o que é essencial no cuidado…"
                  className="mt-1.5 min-h-[100px] md:min-h-[120px] text-sm"
                />
              </div>

              {/* Saúde Geral */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm md:text-base font-medium text-foreground mb-3 md:mb-4 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Saúde Geral
                </h4>
                <div className="space-y-3 md:space-y-4">
                  <div className="max-w-xs">
                    <Label htmlFor="bloodType" className="text-xs md:text-sm">Tipo sanguíneo</Label>
                    <Select value={bloodType} onValueChange={setBloodType}>
                      <SelectTrigger className="mt-1.5 text-sm">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preExistingConditions" className="text-xs md:text-sm">Doenças pré-existentes</Label>
                    <Textarea
                      id="preExistingConditions"
                      value={preExistingConditions}
                      onChange={(e) => setPreExistingConditions(e.target.value)}
                      placeholder="Ex: diabetes, hipertensão, cardiopatias, AVC, etc."
                      className="mt-1.5 min-h-[80px] text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="allergies" className="text-xs md:text-sm">Alergias</Label>
                    <Textarea
                      id="allergies"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="Ex: alergia a alimentos, medicamentos, látex, etc."
                      className="mt-1.5 min-h-[80px] text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="continuousMedications" className="text-xs md:text-sm">Medicações de uso contínuo</Label>
                    <Textarea
                      id="continuousMedications"
                      value={continuousMedications}
                      onChange={(e) => setContinuousMedications(e.target.value)}
                      placeholder="Informe medicações, dosagem e horários, se aplicável."
                      className="mt-1.5 min-h-[80px] text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Acompanhamento Médico */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm md:text-base font-medium text-foreground mb-3 md:mb-4 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Acompanhamento Médico
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label htmlFor="responsibleDoctor" className="text-xs md:text-sm">Médico responsável / Clínica</Label>
                    <Input
                      id="responsibleDoctor"
                      value={responsibleDoctor}
                      onChange={(e) => setResponsibleDoctor(e.target.value)}
                      placeholder="Nome do médico ou clínica responsável"
                      className="mt-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="healthInsurance" className="text-xs md:text-sm">Plano de saúde</Label>
                    <Input
                      id="healthInsurance"
                      value={healthInsurance}
                      onChange={(e) => setHealthInsurance(e.target.value)}
                      placeholder="Nome do plano de saúde (se houver)"
                      className="mt-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção D — Preferências de busca */}
          <Card className="animate-fade-in">
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Preferências de Busca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 md:space-y-6">
              <p className="text-xs md:text-sm text-muted-foreground -mt-2">
                Essas preferências ajudam a filtrar cuidadores e acelerar o match. Você pode alterar quando quiser.
              </p>

              <div>
                <Label className="text-xs md:text-sm">Formato de atendimento</Label>
                <p className="text-xs md:text-sm text-muted-foreground mb-3">
                  Selecione os formatos que melhor atendem suas necessidades
                </p>
                <div className="flex flex-wrap gap-2">
                  {serviceFormatOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={selectedServiceFormats.includes(option.value) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all text-xs",
                        selectedServiceFormats.includes(option.value)
                          ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                          : "hover:bg-muted",
                      )}
                      onClick={() => toggleServiceFormat(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-4 md:space-y-5">
                <div className="space-y-3">
                  <Label className="text-xs md:text-sm">Faixa de valor por hora: R$ {hourlyRange[0]} - R$ {hourlyRange[1]}</Label>
                  <Slider
                    value={hourlyRange}
                    onValueChange={setHourlyRange}
                    min={10}
                    max={80}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs md:text-sm">Faixa de valor por diária: R$ {dailyRange[0]} - R$ {dailyRange[1]}</Label>
                  <Slider
                    value={dailyRange}
                    onValueChange={setDailyRange}
                    min={100}
                    max={600}
                    step={25}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="max-w-xs">
                  <Label htmlFor="distance" className="text-xs md:text-sm">Preferência de distância</Label>
                  <Select value={distancePreference} onValueChange={setDistancePreference}>
                    <SelectTrigger className="mt-1.5 text-sm">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3km">Até 3 km</SelectItem>
                      <SelectItem value="5km">Até 5 km</SelectItem>
                      <SelectItem value="10km">Até 10 km</SelectItem>
                      <SelectItem value="20km">Até 20 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rodapé de ações */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-6">
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Salvar alterações
            </Button>
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X className="w-4 h-4" />
              Cancelar
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FamilyProfile;
