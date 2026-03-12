import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Save,
  Trash2,
  Plus,
  X,
  Pencil,
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
import { specialtiesList, modalitiesList, idiomasList } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchAddressByCep } from "@/lib/viacep";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { ProfessionalReference } from "@/types/database";
import {
  useCaregiverProfile,
  useProfessionalReferences,
  useUpdateCaregiverBasic,
  useUpdateCaregiverBio,
  useUpdateCaregiverSpecialties,
  useUpdateCaregiverReferences,
  useUploadCaregiverPhoto,
} from "@/hooks/useCaregiverProfile";

const profileSteps = [
  { id: 1, title: "Dados básicos" },
  { id: 2, title: "Biografia" },
  { id: 3, title: "Especialidades" },
  { id: 4, title: "Referências" },
];

type NewRef = Omit<ProfessionalReference, 'id' | 'caregiver_id' | 'created_at'>

const CaregiverProfile = () => {
  const { user } = useAuth()
  const { data: profileData, isLoading } = useCaregiverProfile()
  const { data: refsData } = useProfessionalReferences()

  const updateBasic = useUpdateCaregiverBasic()
  const updateBio = useUpdateCaregiverBio()
  const updateSpecialties = useUpdateCaregiverSpecialties()
  const updateReferences = useUpdateCaregiverReferences()
  const uploadPhoto = useUploadCaregiverPhoto()

  const photoInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState(1);
  const [isFetchingCep, setIsFetchingCep] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    photo: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zona: "" as "" | "zona_norte" | "zona_sul" | "zona_leste" | "zona_oeste" | "centro",
    bio: "",
    hasInsurance: false,
    profissaoFormacao: "" as "" | "cuidador" | "tecnico_enfermagem" | "auxiliar_enfermagem" | "enfermeiro" | "fisioterapeuta" | "terapeuta_ocupacional" | "outro",
    profissaoOutro: "",
    formacaoComplementar: "",
    idiomas: ["Português"] as string[],
    idiomaOutro: "",
    specialties: [] as string[],
    modalities: [] as string[],
    yearsExperience: "",
    emergencyAvailable: false,
    possuiCNH: false,
    categoriaCNH: "" as "" | "A" | "B" | "AB" | "C" | "D" | "E",
    showReferencesToSubscribers: true,
    maskReferencePhones: true,
    showReferenceFullNames: false,
  });

  const [references, setReferences] = useState<ProfessionalReference[]>([]);
  const [showAddReference, setShowAddReference] = useState(false);
  const [newReference, setNewReference] = useState<NewRef>({
    name: "",
    phone: "",
    workplace: "",
    position: "",
    work_duration: "",
    notes: "",
  });
  const [refErrors, setRefErrors] = useState({ name: false, phone: false });

  const [editingRefId, setEditingRefId] = useState<string | null>(null);
  const [editRef, setEditRef] = useState<NewRef>({ name: "", phone: "", workplace: "", position: "", work_duration: "", notes: "" });
  const [editRefErrors, setEditRefErrors] = useState({ name: false, phone: false });

  // Sincronizar form com dados do Supabase quando carregarem
  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.profiles.full_name ?? "",
        email: user?.email ?? "",
        phone: "",
        whatsapp: profileData.whatsapp ?? profileData.profiles.phone ?? "",
        photo: profileData.photo_url ?? "",
        cep: profileData.cep ?? "",
        street: profileData.street ?? "",
        number: profileData.number ?? "",
        complement: profileData.complement ?? "",
        neighborhood: profileData.neighborhood ?? "",
        city: profileData.city ?? "",
        state: profileData.state ?? "",
        zona: (profileData.zona ?? "") as typeof formData.zona,
        bio: profileData.bio ?? "",
        hasInsurance: profileData.has_insurance,
        profissaoFormacao: (profileData.profissao_formacao ?? "") as typeof formData.profissaoFormacao,
        profissaoOutro: "",
        formacaoComplementar: profileData.formacao_complementar ?? "",
        ...(() => {
          const standardSet = new Set(idiomasList.filter((i) => i !== "Outro"))
          const dbIdiomas = profileData.idiomas?.length ? profileData.idiomas : ["Português"]
          const customIdioma = dbIdiomas.find((i) => !standardSet.has(i)) ?? ""
          const idiomasForForm = customIdioma
            ? [...dbIdiomas.filter((i) => standardSet.has(i)), "Outro"]
            : dbIdiomas
          return { idiomas: idiomasForForm, idiomaOutro: customIdioma }
        })(),
        specialties: profileData.specialties ?? [],
        modalities: profileData.modalities ?? [],
        yearsExperience: profileData.experience_years ? String(profileData.experience_years) : "",
        emergencyAvailable: profileData.emergency_available,
        possuiCNH: profileData.possui_cnh,
        categoriaCNH: (profileData.categoria_cnh ?? "") as typeof formData.categoriaCNH,
        showReferencesToSubscribers: profileData.show_refs_to_subscribers,
        maskReferencePhones: profileData.mask_reference_phones,
        showReferenceFullNames: profileData.show_reference_full_names,
      })
    }
  }, [profileData, user?.email])

  useEffect(() => {
    if (refsData) setReferences(refsData)
  }, [refsData])

  const handleCepChange = async (value: string) => {
    setFormData((prev) => ({ ...prev, cep: value }))
    const clean = value.replace(/\D/g, '')
    if (clean.length === 8) {
      setIsFetchingCep(true)
      try {
        const address = await fetchAddressByCep(clean)
        if (address) {
          setFormData((prev) => ({
            ...prev,
            street: address.street,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
          }))
        }
      } finally {
        setIsFetchingCep(false)
      }
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadPhoto.mutate(file)
  }

  const handleSave = () => {
    if (currentStep === 1) {
      updateBasic.mutate({
        full_name: formData.name,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        cep: formData.cep,
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zona: formData.zona || null,
        possui_cnh: formData.possuiCNH,
        categoria_cnh: formData.possuiCNH ? formData.categoriaCNH || null : null,
      })
    } else if (currentStep === 2) {
      if (formData.bio.trim().length > 0 && formData.bio.trim().length < 150) {
        toast.error("A biografia deve ter pelo menos 150 caracteres.")
        return
      }
      // Substitui "Outro" pelo texto digitado; remove se o campo estiver vazio
      const idiomasToSave = formData.idiomas.flatMap((i) =>
        i === "Outro"
          ? formData.idiomaOutro.trim() ? [formData.idiomaOutro.trim()] : []
          : [i]
      )
      updateBio.mutate({
        bio: formData.bio,
        profissao_formacao: formData.profissaoFormacao || null,
        formacao_complementar: formData.formacaoComplementar,
        idiomas: idiomasToSave,
        has_insurance: formData.hasInsurance,
      })
    } else if (currentStep === 3) {
      updateSpecialties.mutate({
        specialties: formData.specialties,
        modalities: formData.modalities,
        experience_years: formData.yearsExperience ? Number(formData.yearsExperience) : 0,
        emergency_available: formData.emergencyAvailable,
      })
    } else if (currentStep === 4) {
      updateReferences.mutate({
        references: references.map((r) => ({
          name: r.name,
          phone: r.phone,
          workplace: r.workplace,
          position: r.position,
          work_duration: r.work_duration,
          notes: r.notes,
        })),
        show_refs_to_subscribers: formData.showReferencesToSubscribers,
        mask_reference_phones: formData.maskReferencePhones,
        show_reference_full_names: formData.showReferenceFullNames,
      })
    }
  }

  const isSaving =
    updateBasic.isPending ||
    updateBio.isPending ||
    updateSpecialties.isPending ||
    updateReferences.isPending

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
    const errors = { name: !newReference.name.trim(), phone: !newReference.phone.trim() };
    setRefErrors(errors);
    if (errors.name || errors.phone) return;

    const ref: ProfessionalReference = {
      id: String(Date.now()),
      caregiver_id: user?.id ?? "",
      name: newReference.name,
      phone: newReference.phone,
      workplace: newReference.workplace,
      position: newReference.position,
      work_duration: newReference.work_duration,
      notes: newReference.notes,
      created_at: new Date().toISOString(),
    };
    setReferences([...references, ref]);
    setNewReference({ name: "", phone: "", workplace: "", position: "", work_duration: "", notes: "" });
    setRefErrors({ name: false, phone: false });
    setShowAddReference(false);
  };

  const handleRemoveReference = (id: string) => {
    setReferences(references.filter((r) => r.id !== id));
    if (editingRefId === id) setEditingRefId(null);
  };

  const handleStartEdit = (ref: ProfessionalReference) => {
    setEditingRefId(ref.id);
    setEditRef({ name: ref.name, phone: ref.phone, workplace: ref.workplace, position: ref.position, work_duration: ref.work_duration, notes: ref.notes });
    setEditRefErrors({ name: false, phone: false });
    setShowAddReference(false);
  };

  const handleSaveEdit = (id: string) => {
    const errors = { name: !editRef.name.trim(), phone: !editRef.phone.trim() };
    setEditRefErrors(errors);
    if (errors.name || errors.phone) return;

    setReferences(references.map((r) =>
      r.id === id ? { ...r, ...editRef } : r
    ));
    setEditingRefId(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar role="caregiver" userName="" />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="caregiver"
        userName={profileData?.profiles.full_name ?? user?.email ?? ""}
        userPhoto={profileData?.photo_url ?? undefined}
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais e profissionais" />

        {/* Steps */}
        <div className="mb-6 md:mb-8">
          <Stepper steps={profileSteps} currentStep={currentStep} onStepClick={setCurrentStep} />
        </div>

        {/* Hidden file input for photo upload */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />

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
                    {formData.photo ? (
                      <img
                        src={formData.photo}
                        alt={formData.name}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-muted flex items-center justify-center">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadPhoto.isPending}
                      className="absolute -bottom-2 -right-2 p-1.5 md:p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {uploadPhoto.isPending ? (
                        <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      )}
                    </button>
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-foreground">Foto de perfil</p>
                    <p className="text-xs md:text-sm text-muted-foreground mb-2">JPG, PNG ou GIF. Máximo 5MB.</p>
                    {formData.photo && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive text-xs md:text-sm"
                        onClick={() => setFormData((prev) => ({ ...prev, photo: "" }))}
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Remover foto
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label htmlFor="name" className="text-xs md:text-sm">Nome completo</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} className="mt-1.5 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs md:text-sm">E-mail</Label>
                    <Input id="email" type="email" value={formData.email} readOnly className="mt-1.5 text-sm bg-muted/40 cursor-not-allowed" />
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
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        className={cn("mt-1.5 text-sm", isFetchingCep && "opacity-70")}
                      />
                      {isFetchingCep && <p className="text-xs text-muted-foreground mt-1">Buscando endereço...</p>}
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
                      <Label htmlFor="complement" className="text-xs md:text-sm">Complemento</Label>
                      <Input id="complement" value={formData.complement} onChange={(e) => setFormData((prev) => ({ ...prev, complement: e.target.value }))} placeholder="Apto, bloco, etc." className="mt-1.5 text-sm" />
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

                {/* Zona / Região */}
                <div className="pt-4 border-t border-border">
                  <Label htmlFor="zona" className="text-xs md:text-sm">Região de atuação</Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Selecione a zona da cidade onde você atende. Aparece no filtro de busca das famílias.
                  </p>
                  <Select
                    value={formData.zona}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        zona: value as typeof formData.zona,
                      }))
                    }
                  >
                    <SelectTrigger id="zona" className="mt-1.5 text-sm">
                      <SelectValue placeholder="Selecione a região" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zona_norte">Zona Norte</SelectItem>
                      <SelectItem value="zona_sul">Zona Sul</SelectItem>
                      <SelectItem value="zona_leste">Zona Leste</SelectItem>
                      <SelectItem value="zona_oeste">Zona Oeste</SelectItem>
                      <SelectItem value="centro">Centro</SelectItem>
                    </SelectContent>
                  </Select>
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

                {/* Disponibilidade para emergências */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-start gap-3">
                    <Switch
                      id="emergency-available"
                      checked={formData.emergencyAvailable}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, emergencyAvailable: checked }))
                      }
                    />
                    <div>
                      <Label htmlFor="emergency-available" className="text-xs md:text-sm cursor-pointer">
                        Disponível para atendimento emergencial
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ative se puder aceitar chamados com pouca antecedência ou em situações urgentes.
                        Aparecerá como badge no seu perfil e no filtro de busca das famílias.
                      </p>
                    </div>
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
                  <div key={ref.id} className="rounded-xl border border-border overflow-hidden">
                    {editingRefId === ref.id ? (
                      /* Form de edição inline */
                      <div className="p-3 md:p-4 bg-primary/5 space-y-3 md:space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm md:text-base font-medium text-foreground">Editar referência</h4>
                          <Button variant="ghost" size="icon" onClick={() => setEditingRefId(null)} className="text-muted-foreground">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                          <div>
                            <Label className="text-xs md:text-sm">
                              Nome <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              value={editRef.name}
                              onChange={(e) => { setEditRef((p) => ({ ...p, name: e.target.value })); setEditRefErrors((p) => ({ ...p, name: false })); }}
                              className={cn("mt-1.5 text-sm", editRefErrors.name && "border-destructive focus-visible:ring-destructive")}
                            />
                            {editRefErrors.name && <p className="text-xs text-destructive mt-1">Campo obrigatório</p>}
                          </div>
                          <div>
                            <Label className="text-xs md:text-sm">
                              Telefone <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              value={editRef.phone}
                              onChange={(e) => { setEditRef((p) => ({ ...p, phone: e.target.value })); setEditRefErrors((p) => ({ ...p, phone: false })); }}
                              className={cn("mt-1.5 text-sm", editRefErrors.phone && "border-destructive focus-visible:ring-destructive")}
                            />
                            {editRefErrors.phone && <p className="text-xs text-destructive mt-1">Campo obrigatório</p>}
                          </div>
                          <div>
                            <Label className="text-xs md:text-sm">Local de trabalho</Label>
                            <Input value={editRef.workplace ?? ""} onChange={(e) => setEditRef((p) => ({ ...p, workplace: e.target.value }))} className="mt-1.5 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs md:text-sm">Cargo / Função</Label>
                            <Input value={editRef.position ?? ""} onChange={(e) => setEditRef((p) => ({ ...p, position: e.target.value }))} className="mt-1.5 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs md:text-sm">Tempo de trabalho</Label>
                            <Input value={editRef.work_duration ?? ""} onChange={(e) => setEditRef((p) => ({ ...p, work_duration: e.target.value }))} className="mt-1.5 text-sm" placeholder="Ex: 2 anos" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs md:text-sm">Observações</Label>
                          <Textarea value={editRef.notes ?? ""} onChange={(e) => setEditRef((p) => ({ ...p, notes: e.target.value }))} className="mt-1.5 text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleSaveEdit(ref.id)} className="flex-1 bg-primary hover:bg-primary/90 text-sm">
                            Salvar alterações
                          </Button>
                          <Button variant="outline" onClick={() => setEditingRefId(null)} className="text-sm">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Visualização normal */
                      <div className="p-3 md:p-4 bg-muted/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm md:text-base font-medium text-foreground">{ref.name}</h4>
                            <p className="text-xs md:text-sm text-muted-foreground">{ref.position}</p>
                          </div>
                          <div className="flex items-center gap-1 -mt-1 -mr-1">
                            <Button variant="ghost" size="icon" onClick={() => handleStartEdit(ref)} className="text-muted-foreground hover:text-primary">
                              <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveReference(ref.id)} className="text-muted-foreground hover:text-destructive">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
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
                          {ref.work_duration && (
                            <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                              {ref.work_duration}
                            </div>
                          )}
                        </div>
                        {ref.notes && (
                          <p className="text-xs md:text-sm text-muted-foreground mt-3 pt-3 border-t border-border">{ref.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Formulário nova referência */}
                {showAddReference && (
                  <div className="p-3 md:p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm md:text-base font-medium text-foreground">Nova referência</h4>
                      <Button variant="ghost" size="icon" onClick={() => { setShowAddReference(false); setRefErrors({ name: false, phone: false }); }} className="text-muted-foreground">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <Label htmlFor="refName" className="text-xs md:text-sm">
                          Nome <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="refName"
                          placeholder="Nome da referência"
                          value={newReference.name}
                          onChange={(e) => { setNewReference((prev) => ({ ...prev, name: e.target.value })); setRefErrors((p) => ({ ...p, name: false })); }}
                          className={cn("mt-1.5 text-sm", refErrors.name && "border-destructive focus-visible:ring-destructive")}
                        />
                        {refErrors.name && <p className="text-xs text-destructive mt-1">Campo obrigatório</p>}
                      </div>
                      <div>
                        <Label htmlFor="refPhone" className="text-xs md:text-sm">
                          Telefone <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="refPhone"
                          placeholder="(11) 99999-9999"
                          value={newReference.phone}
                          onChange={(e) => { setNewReference((prev) => ({ ...prev, phone: e.target.value })); setRefErrors((p) => ({ ...p, phone: false })); }}
                          className={cn("mt-1.5 text-sm", refErrors.phone && "border-destructive focus-visible:ring-destructive")}
                        />
                        {refErrors.phone && <p className="text-xs text-destructive mt-1">Campo obrigatório</p>}
                      </div>
                      <div>
                        <Label htmlFor="refWorkplace" className="text-xs md:text-sm">Local de trabalho</Label>
                        <Input id="refWorkplace" placeholder="Empresa ou residência" value={newReference.workplace ?? ""} onChange={(e) => setNewReference((prev) => ({ ...prev, workplace: e.target.value }))} className="mt-1.5 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="refPosition" className="text-xs md:text-sm">Cargo / Função</Label>
                        <Input id="refPosition" placeholder="Ex: Médico, Familiar" value={newReference.position ?? ""} onChange={(e) => setNewReference((prev) => ({ ...prev, position: e.target.value }))} className="mt-1.5 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="refDuration" className="text-xs md:text-sm">Tempo de trabalho</Label>
                        <Input id="refDuration" placeholder="Ex: 2 anos" value={newReference.work_duration ?? ""} onChange={(e) => setNewReference((prev) => ({ ...prev, work_duration: e.target.value }))} className="mt-1.5 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="refNotes" className="text-xs md:text-sm">Observações</Label>
                      <Textarea id="refNotes" placeholder="Contexto do trabalho realizado..." value={newReference.notes ?? ""} onChange={(e) => setNewReference((prev) => ({ ...prev, notes: e.target.value }))} className="mt-1.5 text-sm" />
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
          <div className="flex items-center justify-between mt-4 md:mt-6 gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="text-xs md:text-sm"
            >
              Anterior
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 bg-accent hover:bg-accent/90 text-xs md:text-sm"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />
              )}
              Salvar alterações
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
