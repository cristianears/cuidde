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
  Search,
  Pill,
  Plus,
  Clock,
} from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useHasAcceptedUserConsent } from "@/hooks/useUserConsents";
import { useFamilyProfile, useUpdateFamilyProfileFull, useUploadFamilyPhoto, useRemoveFamilyPhoto } from "@/hooks/useFamilyProfile";
import { fetchAddressByCep } from "@/lib/viacep";
import type { ElderlyMedication } from "@/types/database";
import { LEGAL_DOCUMENTS } from "@/lib/legal-documents";
import { recordUserConsents } from "@/lib/user-consents";

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


const FamilyProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: hasAcceptedThirdPartyConsent = false } = useHasAcceptedUserConsent(user?.id, "thirdPartyConsent");
  const { data: familyProfileData } = useFamilyProfile();
  const { mutate: saveProfile, isPending: isSaving } = useUpdateFamilyProfileFull();
  const { mutate: uploadPhoto, isPending: isUploadingPhoto } = useUploadFamilyPhoto();
  const { mutate: removePhoto } = useRemoveFamilyPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const realName = familyProfileData?.profiles?.full_name ?? user?.user_metadata?.full_name ?? "";
  const realEmail = user?.email ?? "";
  const realPhone = familyProfileData?.profiles?.phone ?? user?.user_metadata?.phone ?? "";
  const googlePhoto =
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined) ||
    null;

  // Responsible data
  const [responsibleName, setResponsibleName] = useState("");
  const [responsibleEmail, setResponsibleEmail] = useState("");
  const [responsiblePhone, setResponsiblePhone] = useState("");
  const [relationship, setRelationship] = useState("filho");
  const [responsiblePhoto, setResponsiblePhoto] = useState<string | null>(null);

  // Sincronizar dados reais quando carregarem
  useEffect(() => {
    // Dados do responsável — usa profile real ou metadata do auth
    const name = familyProfileData?.profiles?.full_name ?? user?.user_metadata?.full_name ?? "";
    const phone = familyProfileData?.profiles?.phone ?? user?.user_metadata?.phone ?? "";
    if (name) setResponsibleName(name);
    if (phone) setResponsiblePhone(phone);
    if (user?.email) setResponsibleEmail(user.email);

    if (familyProfileData) {
      const fp = familyProfileData;
      if (fp.relationship) setRelationship(fp.relationship);
      // Endereço
      if (fp.cep) setCep(fp.cep);
      if (fp.street) setStreet(fp.street);
      if (fp.number) setNumber(fp.number);
      if (fp.neighborhood) setNeighborhood(fp.neighborhood);
      if (fp.city) setCity(fp.city);
      if (fp.state) setState(fp.state);
      // Idoso
      if (fp.elderly_name) setElderlyName(fp.elderly_name);
      if (fp.elderly_age) setElderlyAge(String(fp.elderly_age));
      if (fp.elderly_conditions?.length) setSelectedConditions(fp.elderly_conditions);
      if (fp.blood_type) setBloodType(fp.blood_type);
      if (fp.pre_existing_conditions) setPreExistingConditions(fp.pre_existing_conditions);
      if (fp.allergies) setAllergies(fp.allergies);
      if (fp.continuous_medications) setContinuousMedications(fp.continuous_medications);
      if (fp.responsible_doctor) setResponsibleDoctor(fp.responsible_doctor);
      if (fp.health_insurance) setHealthInsurance(fp.health_insurance);
      if (fp.care_needs) setCareNeeds(fp.care_needs);
      if (fp.elderly_medications?.length) setElderlyMedications(fp.elderly_medications);
      setResponsiblePhoto(fp.photo_url ?? googlePhoto);
    }
  }, [familyProfileData, googlePhoto, user?.email, user?.user_metadata]);

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
    uploadPhoto(file, {
      onSuccess: (url) => {
        setResponsiblePhoto(url);
      },
    });
  };

  const handleRemovePhoto = () => {
    removePhoto(undefined, {
      onSuccess: () => {
        setResponsiblePhoto(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  // Address
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  // Elderly profile
  const [elderlyName, setElderlyName] = useState("");
  const [elderlyAge, setElderlyAge] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [bloodType, setBloodType] = useState("");
  const [preExistingConditions, setPreExistingConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [continuousMedications, setContinuousMedications] = useState("");
  const [responsibleDoctor, setResponsibleDoctor] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [careNeeds, setCareNeeds] = useState("");

  // Medications
  const [elderlyMedications, setElderlyMedications] = useState<ElderlyMedication[]>([]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedTime, setNewMedTime] = useState("");
  const [hasAcceptedElderlyConsent, setHasAcceptedElderlyConsent] = useState(false);
  const [isSavingElderlyConsent, setIsSavingElderlyConsent] = useState(false);

  const elderlyConsentAccepted = hasAcceptedThirdPartyConsent || hasAcceptedElderlyConsent;

  const handleAcceptElderlyConsent = async (checked: boolean) => {
    if (!checked || elderlyConsentAccepted) return;
    if (!user?.id) return;

    setIsSavingElderlyConsent(true);
    try {
      await recordUserConsents({
        userId: user.id,
        documentKeys: ["thirdPartyConsent"],
        context: "third_party_data",
        metadata: { role: "family", source: "family_elderly_profile", relationship },
      });
      setHasAcceptedElderlyConsent(true);
    } catch {
      toast.error("Nao foi possivel registrar o aceite do termo. Tente novamente.");
    } finally {
      setIsSavingElderlyConsent(false);
    }
  };

  const handleMedicationTimeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
    setNewMedTime(formatted);
  };

  const handleAddMedication = () => {
    if (!newMedName.trim() || !newMedTime.trim()) {
      toast.error("Preencha o nome do medicamento e o horário.");
      return;
    }
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(newMedTime)) {
      toast.error("Informe um horário válido no formato HH:MM.");
      return;
    }
    const existingTimes = elderlyMedications
      .filter((m) => m.name.toLowerCase() === newMedName.trim().toLowerCase())
      .map((m) => m.time);
    if (existingTimes.length > 0) {
      toast.info(`${newMedName.trim()} já cadastrado para ${existingTimes.join(", ")}. Adicionando novo horário.`);
    }
    setElderlyMedications((prev) => [...prev, { name: newMedName.trim(), time: newMedTime }]);
    setNewMedName("");
    setNewMedTime("");
  };

  const handleRemoveMedication = (index: number) => {
    setElderlyMedications((prev) => prev.filter((_, i) => i !== index));
  };


  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
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

  const handleSave = async () => {
    const hasElderlyInfo = [
      elderlyName,
      elderlyAge,
      careNeeds,
      preExistingConditions,
      allergies,
      continuousMedications,
      responsibleDoctor,
      healthInsurance,
    ].some((value) => value.trim().length > 0)
      || selectedConditions.length > 0
      || elderlyMedications.length > 0
      || Boolean(bloodType)

    if (hasElderlyInfo) {
      if (!user?.id || !elderlyConsentAccepted) {
        toast.error("Aceite o termo de consentimento antes de salvar os dados do idoso.");
        return;
      }
    }

    saveProfile({
      full_name: responsibleName,
      phone: responsiblePhone,
      relationship,
      cep,
      street,
      number,
      neighborhood,
      city,
      state,
      elderly_name: elderlyName,
      elderly_age: elderlyAge ? parseInt(elderlyAge, 10) : null,
      elderly_conditions: selectedConditions,
      blood_type: bloodType,
      pre_existing_conditions: preExistingConditions,
      allergies,
      continuous_medications: continuousMedications,
      responsible_doctor: responsibleDoctor,
      health_insurance: healthInsurance,
      care_needs: careNeeds,
      elderly_medications: elderlyMedications,
    });
  };

  const handleCancel = () => {
    navigate("/family");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="family"
        userName={familyProfileData?.profiles?.full_name ?? user?.user_metadata?.full_name ?? user?.email ?? ""}
        userPhoto={familyProfileData?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture}
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
                      onError={() => setResponsiblePhoto(null)}
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
                    <Label htmlFor="continuousMedications" className="text-xs md:text-sm">Medicações de uso contínuo (texto livre)</Label>
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

              {/* Checklist de Medicamentos */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm md:text-base font-medium text-foreground mb-1 flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  Checklist de Medicamentos
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Cadastre os medicamentos e horários. O cuidador poderá marcar cada um como "Aplicado" durante o atendimento.
                </p>

                {/* Lista de medicamentos cadastrados */}
                {elderlyMedications.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {elderlyMedications.map((med, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Pill className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">{med.name}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Clock className="w-3 h-3" />
                            {med.time}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive shrink-0 h-8 w-8 p-0"
                          onClick={() => handleRemoveMedication(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulário para adicionar medicamento */}
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(14rem,16rem)_auto] md:items-end">
                  <div>
                    <Label htmlFor="newMedName" className="sr-only">Nome do medicamento</Label>
                    <Input
                      id="newMedName"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      placeholder="Nome do medicamento (ex: Losartana 50mg)"
                      className="text-sm"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMedication())}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newMedTime" className="text-xs text-muted-foreground">
                      Horário da medicação
                    </Label>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="newMedTime"
                        type="text"
                        inputMode="numeric"
                        value={newMedTime}
                        onChange={(e) => handleMedicationTimeChange(e.target.value)}
                        placeholder="HH:MM"
                        maxLength={5}
                        className="pl-9 text-sm"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMedication())}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMedication}
                    className="h-10 gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  O registro é meramente informativo. A plataforma não realiza prescrições médicas.
                </p>
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

          {/* Rodapé de ações */}
          <div className="rounded-xl border border-border bg-card p-3 md:p-4">
            <label className="flex items-start gap-3 text-xs md:text-sm leading-relaxed">
              <Checkbox
                checked={elderlyConsentAccepted}
                disabled={elderlyConsentAccepted || isSavingElderlyConsent}
                onCheckedChange={(checked) => handleAcceptElderlyConsent(checked === true)}
                className="mt-0.5 shrink-0"
              />
              <span className="text-muted-foreground">
                {elderlyConsentAccepted ? 'Termo já aceito para informações de terceiros. ' : 'Declaro que tenho autorização para cadastrar informações do idoso e aceito o '}
                <a
                  href={LEGAL_DOCUMENTS.thirdPartyConsent.path}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Termo de Consentimento para Tratamento de Dados, Documentos e Informações de Terceiros
                </a>
                .
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-6">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? "Salvando..." : "Salvar alterações"}
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
