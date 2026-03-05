import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, Search, Camera, Trash2 } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { mockFamilies } from "@/data/mockData";

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
  const currentUser = mockFamilies[0];

  // Responsible data
  const [responsibleName, setResponsibleName] = useState(currentUser.name);
  const [responsibleEmail, setResponsibleEmail] = useState(currentUser.email);
  const [responsiblePhone, setResponsiblePhone] = useState(currentUser.phone);
  const [relationship, setRelationship] = useState("filho");
  const [responsiblePhoto, setResponsiblePhoto] = useState<string | null>(currentUser.photo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Photo upload handler (mock)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo permitido: 5MB.");
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error("Formato inválido. Use JPG ou PNG.");
      return;
    }

    // Simulate upload with FileReader (mock)
    const reader = new FileReader();
    reader.onload = (event) => {
      setResponsiblePhoto(event.target?.result as string);
      toast.success("Foto atualizada com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  // Remove photo handler
  const handleRemovePhoto = () => {
    setResponsiblePhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success("Foto removida.");
  };

  // Address
  const [cep, setCep] = useState(currentUser.address?.cep || "01310-100");
  const [street, setStreet] = useState(currentUser.address?.street || "Avenida Paulista");
  const [number, setNumber] = useState(currentUser.address?.number || "1000");
  const [neighborhood, setNeighborhood] = useState(currentUser.address?.neighborhood || "Bela Vista");
  const [city, setCity] = useState(currentUser.address?.city || "São Paulo");
  const [state, setState] = useState(currentUser.address?.state || "SP");

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
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const toggleServiceFormat = (format: string) => {
    setSelectedServiceFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleSearchCep = () => {
    // Mock - no real integration yet
    toast.info("Busca de CEP será implementada em breve.");
  };

  const handleSave = () => {
    // Mock save
    toast.success("Perfil atualizado com sucesso!");
  };

  const handleCancel = () => {
    navigate("/family");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="family"
        userName={currentUser.name}
      />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Perfil da Família"
          description="Atualize as informações do responsável e do idoso para facilitar o match com cuidadores."
        >
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Salvar alterações
          </Button>
        </PageHeader>

        <div className="space-y-6 max-w-4xl">
          {/* Seção A — Dados do Responsável */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Responsável</CardTitle>
              <CardDescription>Informações de contato do responsável pelo idoso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo upload section */}
              <div className="flex items-start gap-6 pb-4 border-b">
                <Avatar className="w-24 h-24">
                  {responsiblePhoto ? (
                    <AvatarImage src={responsiblePhoto} alt={responsibleName} />
                  ) : null}
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(responsibleName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-medium text-foreground">Foto do responsável</h4>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG. Máximo 5MB. (Opcional)
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    {responsiblePhoto ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Trocar foto
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePhoto}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover foto
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Adicionar foto
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    Adicionar uma foto ajuda o cuidador a reconhecer você.
                  </p>
                </div>
              </div>

              {/* Existing form fields */}
              <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsibleName">Nome completo</Label>
                  <Input
                    id="responsibleName"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsibleEmail">E-mail</Label>
                  <Input
                    id="responsibleEmail"
                    type="email"
                    value={responsibleEmail}
                    onChange={(e) => setResponsibleEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsiblePhone">WhatsApp / Telefone</Label>
                  <Input
                    id="responsiblePhone"
                    value={responsiblePhone}
                    onChange={(e) => setResponsiblePhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Parentesco com o idoso</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger>
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
              </div>
            </CardContent>
          </Card>

          {/* Seção B — Endereço */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Usado para busca por proximidade com cuidadores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="00000-000"
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" onClick={handleSearchCep}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {cep.length < 9 && (
                    <p className="text-xs text-muted-foreground">
                      Preencha o CEP para autopreencher o endereço.
                    </p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">UF</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção C — Perfil do Idoso */}
          <Card>
            <CardHeader>
              <CardTitle>Perfil do Idoso</CardTitle>
              <CardDescription>Informações sobre a pessoa que receberá os cuidados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="elderlyName">Nome do idoso</Label>
                  <Input
                    id="elderlyName"
                    value={elderlyName}
                    onChange={(e) => setElderlyName(e.target.value)}
                    placeholder="Nome do idoso"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elderlyAge">Idade</Label>
                  <Input
                    id="elderlyAge"
                    type="number"
                    value={elderlyAge}
                    onChange={(e) => setElderlyAge(e.target.value)}
                    placeholder="Ex: 78"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Condições de saúde</Label>
                <div className="flex flex-wrap gap-2">
                  {healthConditionOptions.map((condition) => (
                    <Badge
                      key={condition}
                      variant={selectedConditions.includes(condition) ? "default" : "outline"}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleCondition(condition)}
                    >
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="careNeeds">Necessidades de cuidado</Label>
                <Textarea
                  id="careNeeds"
                  value={careNeeds}
                  onChange={(e) => setCareNeeds(e.target.value)}
                  placeholder="Descreva rotina, limitações, medicações, preferências e o que é essencial no cuidado…"
                  rows={4}
                />
              </div>

              {/* Saúde Geral */}
              <div className="pt-4 border-t">
                <h4 className="font-medium text-foreground mb-4">Saúde Geral</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Tipo sanguíneo</Label>
                    <Select value={bloodType} onValueChange={setBloodType}>
                      <SelectTrigger className="w-full md:w-[200px]">
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

                  <div className="space-y-2">
                    <Label htmlFor="preExistingConditions">Doenças pré-existentes</Label>
                    <Textarea
                      id="preExistingConditions"
                      value={preExistingConditions}
                      onChange={(e) => setPreExistingConditions(e.target.value)}
                      placeholder="Ex: diabetes, hipertensão, cardiopatias, AVC, etc."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">Alergias</Label>
                    <Textarea
                      id="allergies"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="Ex: alergia a alimentos, medicamentos, látex, etc."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="continuousMedications">Medicações de uso contínuo</Label>
                    <Textarea
                      id="continuousMedications"
                      value={continuousMedications}
                      onChange={(e) => setContinuousMedications(e.target.value)}
                      placeholder="Informe medicações, dosagem e horários, se aplicável."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Acompanhamento Médico */}
              <div className="pt-4 border-t">
                <h4 className="font-medium text-foreground mb-4">Acompanhamento Médico</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsibleDoctor">Médico responsável / Clínica</Label>
                    <Input
                      id="responsibleDoctor"
                      value={responsibleDoctor}
                      onChange={(e) => setResponsibleDoctor(e.target.value)}
                      placeholder="Nome do médico ou clínica responsável"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="healthInsurance">Plano de saúde</Label>
                    <Input
                      id="healthInsurance"
                      value={healthInsurance}
                      onChange={(e) => setHealthInsurance(e.target.value)}
                      placeholder="Nome do plano de saúde (se houver)"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção D — Preferências de busca */}
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Busca</CardTitle>
              <CardDescription>Essas preferências ajudam a filtrar cuidadores e acelerar o match. Você pode alterar quando quiser.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Preferência de formato de atendimento</Label>
                <div className="flex flex-wrap gap-2">
                  {serviceFormatOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={selectedServiceFormats.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleServiceFormat(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Faixa de valor por hora: R$ {hourlyRange[0]} - R$ {hourlyRange[1]}</Label>
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
                  <Label>Faixa de valor por diária: R$ {dailyRange[0]} - R$ {dailyRange[1]}</Label>
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

              <div className="space-y-2">
                <Label htmlFor="distance">Preferência de distância</Label>
                <Select value={distancePreference} onValueChange={setDistancePreference}>
                  <SelectTrigger className="w-full md:w-[200px]">
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
            </CardContent>
          </Card>

          {/* Rodapé de ações */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
