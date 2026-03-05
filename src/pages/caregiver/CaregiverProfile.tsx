import { useState } from "react";
import {
  Camera,
  Save,
  Trash2,
  Plus,
  X,
  Phone,
  Building,
  Clock,
  Car,
  GraduationCap,
  Globe,
} from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import Stepper from "@/components/shared/Stepper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  mockCaregivers,
  specialtiesList,
  modalitiesList,
  idiomasList,
  ProfessionalReference,
} from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const profileSteps = [
  { id: 1, title: "Dados básicos" },
  { id: 2, title: "Biografia" },
  { id: 3, title: "Especialidades" },
  { id: 4, title: "Referências" },
];

const CaregiverProfile = () => {
  const currentUser = mockCaregivers[0];
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Básico
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    whatsapp: currentUser.whatsapp,
    photo: currentUser.photo,
    // Endereço
    cep: currentUser.address.cep,
    street: currentUser.address.street,
    number: currentUser.address.number,
    neighborhood: currentUser.address.neighborhood,
    city: currentUser.address.city,
    state: currentUser.address.state,
    // Bio
    bio: currentUser.bio,
    hasInsurance: currentUser.hasInsurance,
    // Formação
    profissaoFormacao: (
      "" as
        | ""
        | "cuidador"
        | "tecnico_enfermagem"
        | "auxiliar_enfermagem"
        | "enfermeiro"
        | "fisioterapeuta"
        | "terapeuta_ocupacional"
        | "outro"
    ),
    profissaoOutro: "",
    formacaoComplementar: "",
    // Idiomas
    idiomas: (currentUser.idiomas || ["Português"]) as string[],
    idiomaOutro: "",
    // Especialidades
    specialties: currentUser.specialties || [],
    modalities: currentUser.modalities || [],
    yearsExperience: currentUser.experienceYears?.toString() ?? "",
    // CNH
    possuiCNH: false,
    categoriaCNH: "" as "" | "A" | "B" | "AB" | "C" | "D" | "E",
    // Referências — visibilidade
    showReferencesToSubscribers: true,
    maskReferencePhones: true,
    showReferenceFullNames: false,
  });

  const [references, setReferences] = useState<ProfessionalReference[]>([]);
  const [showAddReference, setShowAddReference] = useState(false);
  const [newReference, setNewReference] = useState<Partial<ProfessionalReference>>({
    name: "",
    phone: "",
    workplace: "",
    position: "",
    workDuration: "",
    notes: "",
  });

  const toggleSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const toggleModality = (modality: string) => {
    setFormData((prev) => ({
      ...prev,
      modalities: prev.modalities.includes(modality)
        ? prev.modalities.filter((m) => m !== modality)
        : [...prev.modalities, modality],
    }));
  };

  const toggleIdioma = (idioma: string) => {
    setFormData((prev) => ({
      ...prev,
      idiomas: prev.idiomas.includes(idioma)
        ? prev.idiomas.filter((i) => i !== idioma)
        : [...prev.idiomas, idioma],
      idiomaOutro: idioma === "Outro" && prev.idiomas.includes("Outro") ? "" : prev.idiomaOutro,
    }));
  };

  const handleAddReference = () => {
    if (newReference.name && newReference.phone) {
      const reference: ProfessionalReference = {
        id: String(Date.now()),
        caregiverId: currentUser.id,
        name: newReference.name || "",
        phone: newReference.phone || "",
        workplace: newReference.workplace || "",
        position: newReference.position || "",
        workDuration: newReference.workDuration || "",
        notes: newReference.notes || "",
      };
      setReferences([...references, reference]);
      setNewReference({ name: "", phone: "", workplace: "", position: "", workDuration: "", notes: "" });
      setShowAddReference(false);
    }
  };

  const handleRemoveReference = (id: string) => {
    setReferences(references.filter((r) => r.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="caregiver" userName={currentUser.name} userPhoto={currentUser.photo} />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais e profissionais">
          <Button className="gap-2 bg-accent hover:bg-accent/90 text-xs md:text-sm">
            <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Salvar alterações
          </Button>
        </PageHeader>

        {/* Steps */}
        <div className="mb-6 md:mb-8">
          <Stepper steps={profileSteps} currentStep={currentStep} />
        </div>

        <div className="max-w-4xl">
          {/* STEP 1 — Dados básicos */}
          {currentStep === 1 && (
            <Card className="animate-fade-in">
              <CardHeader className="pb-4 md:pb-6">
                <CardTitle className="text-base md:text-lg">Dados básicos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 md:space-y-6">
                {/* Photo */}
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="relative shrink-0">
                    <img
                      src={formData.photo}
                      alt={formData.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover"
                    />
                    <button className="absolute -bottom-2 -right-2 p-1.5 md:p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                      <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-foreground">Foto de perfil</p>
                    <p className="text-xs md:text-sm text-muted-foreground mb-2">JPG, PNG ou GIF. Máximo 5MB.</p>
                    <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive text-xs md:text-sm">
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      Remover foto
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label htmlFor="name" className="text-xs md:text-sm">Nome completo</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} className="mt-1.5 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs md:text-sm">E-mail</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} className="mt-1.5 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-xs md:text-sm">Telefone</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} className="mt-1.5 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp" className="text-xs md:text-sm">WhatsApp</Label>
                    <Input id="whatsapp" value={formData.whatsapp} onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))} className="mt-1.5 text-sm" />
                  </div>
                </div>

                {/* Endereço */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm md:text-base font-medium text-foreground mb-3 md:mb-4">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <div>
                      <Label htmlFor="cep" className="text-xs md:text-sm">CEP</Label>
                      <Input id="cep" value={formData.cep} onChange={(e) => setFormData((prev) => ({ ...prev, cep: e.target.value }))} className="mt-1.5 text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="street" className="text-xs md:text-sm">Rua</Label>
                      <Input id="street" value={formData.street} onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))} className="mt-1.5 text-sm" />
                    </div>
                    <div>
                      <Label htmlFor="number" className="text-xs md:text-sm">Número</Label>
                      <Input id="number" value={formData.number} onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))} className="mt-1.5 text-sm" />
                    </div>
                    <div>
                      <Label htmlFor="neighborhood" className="text-xs md:text-sm">Bairro</Label>
                      <Input id="neighborhood" value={formData.neighborhood} onChange={(e) => setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))} className="mt-1.5 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <Label htmlFor="city" className="text-xs md:text-sm">Cidade</Label>
                        <Input id="city" value={formData.city} onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))} className="mt-1.5 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-xs md:text-sm">UF</Label>
                        <Input id="state" value={formData.state} onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))} className="mt-1.5 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CNH */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm md:text-base font-medium text-foreground mb-3 md:mb-4 flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Habilitação
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-muted/50">
                      <div>
                        <p className="text-sm md:text-base font-medium text-foreground">Possuo habilitação para dirigir (CNH)</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Marque se você possui carteira de motorista válida</p>
                      </div>
                      <Switch
                        checked={formData.possuiCNH}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, possuiCNH: checked, categoriaCNH: checked ? prev.categoriaCNH : "" }))
                        }
                      />
                    </div>
                    {formData.possuiCNH && (
                      <div className="max-w-xs">
                        <Label htmlFor="categoriaCNH" className="text-xs md:text-sm">Categoria da CNH</Label>
                        <Select
                          value={formData.categoriaCNH}
                          onValueChange={(value: "A" | "B" | "AB" | "C" | "D" | "E") =>
                            setFormData((prev) => ({ ...prev, categoriaCNH: value }))
                          }
                        >
                          <SelectTrigger className="mt-1.5 text-sm">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="AB">AB</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                            <SelectItem value="E">E</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2 — Biografia */}
          {currentStep === 2 && (
            <Card className="animate-fade-in">
              <CardHeader className="pb-4 md:pb-6">
                <CardTitle className="text-base md:text-lg">Biografia profissional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 md:space-y-6">
                {/* Formação */}
                <div className="space-y-3 md:space-y-4">
                  <h4 className="text-sm md:text-base font-medium text-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Formação
                  </h4>
                  <div>
                    <Label htmlFor="profissaoFormacao" className="text-xs md:text-sm">Profissão / Formação *</Label>
                    <Select
                      value={formData.profissaoFormacao}
                      onValueChange={(value: typeof formData.profissaoFormacao) =>
                        setFormData((prev) => ({
                          ...prev,
                          profissaoFormacao: value,
                          profissaoOutro: value === "outro" ? prev.profissaoOutro : "",
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1.5 text-sm">
                        <SelectValue placeholder="Selecione sua profissão/formação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cuidador">Cuidador(a) de idosos</SelectItem>
                        <SelectItem value="tecnico_enfermagem">Técnico(a) em Enfermagem</SelectItem>
                        <SelectItem value="auxiliar_enfermagem">Auxiliar de Enfermagem</SelectItem>
                        <SelectItem value="enfermeiro">Enfermeiro(a)</SelectItem>
                        <SelectItem value="fisioterapeuta">Fisioterapeuta</SelectItem>
                        <SelectItem value="terapeuta_ocupacional">Terapeuta Ocupacional</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.profissaoFormacao === "outro" && (
                    <div>
                      <Label htmlFor="profissaoOutro" className="text-xs md:text-sm">Descreva sua profissão/formação *</Label>
                      <Input
                        id="profissaoOutro"
                        placeholder="Ex: Acompanhante terapêutico, Gerontólogo..."
                        value={formData.profissaoOutro}
                        onChange={(e) => setFormData((prev) => ({ ...prev, profissaoOutro: e.target.value }))}
                        className="mt-1.5 text-sm"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="formacaoComplementar" className="text-xs md:text-sm">Formação complementar / cursos (opcional)</Label>
                    <Textarea
                      id="formacaoComplementar"
                      placeholder="Ex: Curso de cuidador de idosos, especialização em Alzheimer, primeiros socorros..."
                      value={formData.formacaoComplementar}
                      onChange={(e) => setFormData((prev) => ({ ...prev, formacaoComplementar: e.target.value }))}
                      className="mt-1.5 min-h-[80px] text-sm"
                    />
                  </div>
                </div>

                {/* Idiomas */}
                <div className="pt-4 border-t border-border space-y-3 md:space-y-4">
                  <h4 className="text-sm md:text-base font-medium text-foreground flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4" />
                    Idiomas
                  </h4>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3">
                    Selecione os idiomas em que você consegue se comunicar com pacientes e famílias
                  </p>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {idiomasList.map((idioma) => (
                      <label
                        key={idioma}
                        className={cn(
                          "flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border cursor-pointer transition-colors",
                          formData.idiomas.includes(idioma)
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50",
                        )}
                      >
                        <Checkbox checked={formData.idiomas.includes(idioma)} onCheckedChange={() => toggleIdioma(idioma)} />
                        <span className="text-xs md:text-sm font-medium">{idioma}</span>
                      </label>
                    ))}
                  </div>
                  {formData.idiomas.includes("Outro") && (
                    <div className="mt-3 max-w-sm">
                      <Label htmlFor="idiomaOutro" className="text-xs md:text-sm">Qual idioma?</Label>
                      <Input
                        id="idiomaOutro"
                        placeholder="Ex: Alemão, Japonês, Libras..."
                        value={formData.idiomaOutro}
                        onChange={(e) => setFormData((prev) => ({ ...prev, idiomaOutro: e.target.value }))}
                        className="mt-1.5 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Sobre você */}
                <div className="pt-4 border-t border-border">
                  <Label htmlFor="bio" className="text-xs md:text-sm">Sobre você</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    className="mt-1.5 min-h-[160px] md:min-h-[200px] text-sm"
                    placeholder="Conte sobre sua experiência, formação e o que te motiva a atuar na área..."
                  />
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-muted-foreground">Mínimo 150 caracteres.</p>
                    <p className={cn("text-xs", formData.bio.length < 150 ? "text-amber-600" : "text-muted-foreground")}>
                      {formData.bio.length}/1000
                    </p>
                  </div>
                </div>

                {/* Seguro */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-muted/50">
                    <div>
                      <p className="text-sm md:text-base font-medium text-foreground">Possuo seguro profissional</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Tenho cobertura de responsabilidade civil</p>
                    </div>
                    <Switch
                      checked={formData.hasInsurance}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, hasInsurance: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3 — Especialidades */}
          {currentStep === 3 && (
            <Card className="animate-fade-in">
              <CardHeader className="pb-4 md:pb-6">
                <CardTitle className="text-base md:text-lg">Especialidades e atendimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 md:space-y-8">
                {/* Especialidades */}
                <div>
                  <Label className="text-xs md:text-sm">Especialidades</Label>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3">
                    Selecione as áreas em que você tem experiência
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {specialtiesList.map((specialty) => (
                      <Badge
                        key={specialty}
                        variant={formData.specialties.includes(specialty) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all text-xs",
                          formData.specialties.includes(specialty)
                            ? "bg-primary hover:bg-primary/90"
                            : "hover:bg-muted",
                        )}
                        onClick={() => toggleSpecialty(specialty)}
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Formato de atendimento */}
                <div className="pt-4 border-t border-border">
                  <Label className="text-xs md:text-sm">Formato de atendimento</Label>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3">
                    Selecione os formatos de jornada em que você pode atuar
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {modalitiesList.map((modality) => (
                      <Badge
                        key={modality}
                        variant={formData.modalities.includes(modality) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all text-xs",
                          formData.modalities.includes(modality)
                            ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                            : "hover:bg-muted",
                        )}
                        onClick={() => toggleModality(modality)}
                      >
                        {modality}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Anos de experiência */}
                <div className="pt-4 border-t border-border">
                  <Label className="text-xs md:text-sm">Anos de experiência</Label>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3">
                    Opcional, mas ajuda na confiança e no ranqueamento das buscas
                  </p>
                  <div className="max-w-xs">
                    <Select
                      value={formData.yearsExperience}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, yearsExperience: value }))}
                    >
                      <SelectTrigger className="mt-1.5 text-sm">
                        <SelectValue placeholder="Selecione o tempo de experiência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 ano</SelectItem>
                        <SelectItem value="2">2 anos</SelectItem>
                        <SelectItem value="3">3 anos</SelectItem>
                        <SelectItem value="4">4 anos</SelectItem>
                        <SelectItem value="5">5 anos</SelectItem>
                        <SelectItem value="6">6 anos</SelectItem>
                        <SelectItem value="7">7 anos</SelectItem>
                        <SelectItem value="8">8 anos</SelectItem>
                        <SelectItem value="9">9 anos</SelectItem>
                        <SelectItem value="10">10 anos</SelectItem>
                        <SelectItem value="12">11 a 12 anos</SelectItem>
                        <SelectItem value="15">13 a 15 anos</SelectItem>
                        <SelectItem value="20">Mais de 15 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4 — Referências */}
          {currentStep === 4 && (
            <Card className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between pb-4 md:pb-6">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Building className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Referências profissionais
                </CardTitle>
                {references.length < 3 && !showAddReference && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddReference(true)} className="gap-2 text-xs md:text-sm">
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Adicionar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-5 md:space-y-6">
                {/* Visibilidade */}
                <div className="p-3 md:p-4 rounded-xl bg-muted/40 border border-border">
                  <h4 className="text-sm md:text-base font-medium text-foreground mb-1">Visibilidade das referências</h4>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4">
                    Referências aumentam a confiança e podem melhorar sua visibilidade na plataforma.
                  </p>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Exibir para famílias assinantes</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Famílias assinantes poderão ver suas referências.</p>
                      </div>
                      <Switch
                        checked={formData.showReferencesToSubscribers}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, showReferencesToSubscribers: checked }))}
                      />
                    </div>
                    <div className={cn("flex items-center justify-between gap-4", !formData.showReferencesToSubscribers && "opacity-50")}>
                      <div>
                        <p className="text-sm font-medium text-foreground">Mascarar telefone</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Exibe apenas os últimos dígitos (ex: *****-1234).</p>
                      </div>
                      <Switch
                        checked={formData.maskReferencePhones}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, maskReferencePhones: checked }))}
                        disabled={!formData.showReferencesToSubscribers}
                      />
                    </div>
                    <div className={cn("flex items-center justify-between gap-4", !formData.showReferencesToSubscribers && "opacity-50")}>
                      <div>
                        <p className="text-sm font-medium text-foreground">Exibir nome completo</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Se desligado, exibimos apenas iniciais para mais privacidade.</p>
                      </div>
                      <Switch
                        checked={formData.showReferenceFullNames}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, showReferenceFullNames: checked }))}
                        disabled={!formData.showReferencesToSubscribers}
                      />
                    </div>
                  </div>
                </div>

                {/* Lista de referências */}
                {references.map((ref) => (
                  <div key={ref.id} className="p-3 md:p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm md:text-base font-medium text-foreground">{ref.name}</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">{ref.position}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveReference(ref.id)} className="text-muted-foreground hover:text-destructive -mt-1 -mr-1">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mt-3 text-xs md:text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                        {ref.phone}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                        {ref.workplace}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                        {ref.workDuration} de trabalho conjunto
                      </div>
                    </div>
                    {ref.notes && (
                      <p className="text-xs md:text-sm text-muted-foreground mt-3 pt-3 border-t border-border">{ref.notes}</p>
                    )}
                  </div>
                ))}

                {/* Formulário nova referência */}
                {showAddReference && (
                  <div className="p-3 md:p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm md:text-base font-medium text-foreground">Nova referência</h4>
                      <Button variant="ghost" size="icon" onClick={() => setShowAddReference(false)} className="text-muted-foreground">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <Label htmlFor="refName" className="text-xs md:text-sm">Nome</Label>
                        <Input id="refName" placeholder="Nome da referência" value={newReference.name} onChange={(e) => setNewReference((prev) => ({ ...prev, name: e.target.value }))} className="mt-1.5 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="refPhone" className="text-xs md:text-sm">Telefone</Label>
                        <Input id="refPhone" placeholder="(11) 99999-9999" value={newReference.phone} onChange={(e) => setNewReference((prev) => ({ ...prev, phone: e.target.value }))} className="mt-1.5 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="refWorkplace" className="text-xs md:text-sm">Local de trabalho</Label>
                        <Input id="refWorkplace" placeholder="Empresa ou residência" value={newReference.workplace} onChange={(e) => setNewReference((prev) => ({ ...prev, workplace: e.target.value }))} className="mt-1.5 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="refPosition" className="text-xs md:text-sm">Cargo / Função</Label>
                        <Input id="refPosition" placeholder="Ex: Médico, Familiar" value={newReference.position} onChange={(e) => setNewReference((prev) => ({ ...prev, position: e.target.value }))} className="mt-1.5 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="refDuration" className="text-xs md:text-sm">Tempo de trabalho</Label>
                        <Input id="refDuration" placeholder="Ex: 2 anos" value={newReference.workDuration} onChange={(e) => setNewReference((prev) => ({ ...prev, workDuration: e.target.value }))} className="mt-1.5 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="refNotes" className="text-xs md:text-sm">Observações</Label>
                      <Textarea id="refNotes" placeholder="Contexto do trabalho realizado..." value={newReference.notes} onChange={(e) => setNewReference((prev) => ({ ...prev, notes: e.target.value }))} className="mt-1.5 text-sm" />
                    </div>
                    <Button onClick={handleAddReference} className="w-full bg-primary hover:bg-primary/90 text-sm">
                      Adicionar referência
                    </Button>
                  </div>
                )}

                {references.length === 0 && !showAddReference && (
                  <div className="text-center py-6 md:py-8">
                    <p className="text-sm text-muted-foreground mb-4">Nenhuma referência adicionada</p>
                    <Button variant="outline" onClick={() => setShowAddReference(true)} className="gap-2 text-sm">
                      <Plus className="w-4 h-4" />
                      Adicionar primeira referência
                    </Button>
                  </div>
                )}

                <p className="text-xs md:text-sm text-muted-foreground">
                  Você pode adicionar até 3 referências profissionais ({references.length}/3)
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step Navigation */}
          <div className="flex justify-between mt-4 md:mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="text-xs md:text-sm"
            >
              Anterior
            </Button>
            <Button
              onClick={() => setCurrentStep(Math.min(profileSteps.length, currentStep + 1))}
              disabled={currentStep === profileSteps.length}
              className="bg-primary hover:bg-primary/90 text-xs md:text-sm"
            >
              Próximo
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaregiverProfile;
