import { useEffect, useMemo, useState } from "react";
import { Briefcase, MapPin, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFamilyJobPost, useUpdateFamilyJobPost } from "@/hooks/useFamilyJobPost";
import {
  FAMILY_JOB_ACTIVITIES,
  FAMILY_JOB_CARE_TYPES,
  FAMILY_JOB_DAYS,
  FAMILY_JOB_PERIODS,
  FAMILY_JOB_REQUIREMENTS,
  buildFamilyJobSummary,
} from "@/lib/family-job-post";
import { cn } from "@/lib/utils";
import { fetchAddressByCep } from "@/lib/viacep";
import type { FamilyJobCareType } from "@/types/database";

type ProfileAddress = {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
};

type FamilyJobPostSectionProps = {
  profileAddress: ProfileAddress;
  setupMode?: boolean;
  onSaved?: () => void;
};

function toggleValue(value: string, current: string[], setCurrent: (next: string[]) => void) {
  setCurrent(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
}

function normalizeAddress(address: Partial<ProfileAddress>) {
  return {
    cep: address.cep ?? "",
    street: address.street ?? "",
    number: address.number ?? "",
    complement: address.complement ?? "",
    neighborhood: address.neighborhood ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
  };
}

export default function FamilyJobPostSection({ profileAddress, setupMode = false, onSaved }: FamilyJobPostSectionProps) {
  const { data: jobPost, isLoading } = useFamilyJobPost();
  const { mutate: saveJobPost, isPending } = useUpdateFamilyJobPost();

  const [isActive, setIsActive] = useState(true);
  const [useProfileAddress, setUseProfileAddress] = useState(true);
  const [careType, setCareType] = useState<FamilyJobCareType | null>(null);
  const [address, setAddress] = useState(normalizeAddress(profileAddress));
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [schedulePeriods, setSchedulePeriods] = useState<string[]>([]);
  const [specificSchedule, setSpecificSchedule] = useState("");
  const [activities, setActivities] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const effectiveAddress = useMemo(
    () => (useProfileAddress ? normalizeAddress(profileAddress) : address),
    [address, profileAddress, useProfileAddress],
  );

  const preview = buildFamilyJobSummary({
    is_active: isActive,
    use_profile_address: useProfileAddress,
    ...effectiveAddress,
    care_type: careType,
    schedule_days: scheduleDays,
    schedule_periods: schedulePeriods,
    specific_schedule: specificSchedule,
    activities,
    requirements,
    notes,
  });

  useEffect(() => {
    if (!jobPost) return;

    setIsActive(jobPost.is_active);
    setUseProfileAddress(jobPost.use_profile_address);
    setCareType(jobPost.care_type);
    setAddress(normalizeAddress({
      cep: jobPost.cep ?? "",
      street: jobPost.street ?? "",
      number: jobPost.number ?? "",
      complement: jobPost.complement ?? "",
      neighborhood: jobPost.neighborhood ?? "",
      city: jobPost.city ?? "",
      state: jobPost.state ?? "",
    }));
    setScheduleDays(jobPost.schedule_days ?? []);
    setSchedulePeriods(jobPost.schedule_periods ?? []);
    setSpecificSchedule(jobPost.specific_schedule ?? "");
    setActivities(jobPost.activities ?? []);
    setRequirements(jobPost.requirements ?? []);
    setNotes(jobPost.notes ?? "");
  }, [jobPost]);

  useEffect(() => {
    if (useProfileAddress) {
      setAddress(normalizeAddress(profileAddress));
    }
  }, [profileAddress, useProfileAddress]);

  const handleCepChange = async (value: string) => {
    setAddress((current) => ({ ...current, cep: value }));
    const cleanCep = value.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const result = await fetchAddressByCep(cleanCep);
      if (result) {
        setAddress((current) => ({
          ...current,
          street: result.street,
          neighborhood: result.neighborhood,
          city: result.city,
          state: result.state,
        }));
      }
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleSave = () => {
    if (!careType && isActive) {
      toast.error("Selecione o tipo de atendimento ou deixe a necessidade inativa.");
      return;
    }

    saveJobPost({
      is_active: isActive,
      use_profile_address: useProfileAddress,
      ...effectiveAddress,
      care_type: careType,
      schedule_days: scheduleDays,
      schedule_periods: schedulePeriods,
      specific_schedule: specificSchedule,
      activities,
      requirements,
      notes,
    }, {
      onSuccess: onSaved,
    });
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Briefcase className="h-5 w-5 text-primary" />
          Necessidade de cuidado
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Informe a vaga ou necessidade atual da familia. Esses dados ajudam a recomendar cuidadores mais alinhados.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <Checkbox
            checked={isActive}
            onCheckedChange={(checked) => setIsActive(checked === true)}
            className="mt-0.5 shrink-0"
          />
          <span>
            <span className="block font-medium text-foreground">Tenho uma necessidade ativa</span>
            <span className="text-muted-foreground">Quando ativo, a busca considera estes dados como criterio complementar.</span>
          </span>
        </label>

        <div className="space-y-2">
          <Label>Tipo de atendimento</Label>
          <Select value={careType ?? ""} onValueChange={(value) => setCareType(value as FamilyJobCareType)}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione"} />
            </SelectTrigger>
            <SelectContent>
              {FAMILY_JOB_CARE_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {careType && (
            <p className="text-xs text-muted-foreground">
              {FAMILY_JOB_CARE_TYPES.find((option) => option.value === careType)?.description}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={useProfileAddress}
              onCheckedChange={(checked) => setUseProfileAddress(checked === true)}
              className="mt-0.5 shrink-0"
            />
            <div>
              <Label className="text-sm font-medium">Usar o mesmo endereco do cadastro</Label>
              <p className="text-xs text-muted-foreground">Desmarque apenas se a vaga for em outro local.</p>
            </div>
          </div>

          {!useProfileAddress && (
            <div className="rounded-lg border border-border p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Endereco da necessidade
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                <div className="md:col-span-2">
                  <Label htmlFor="jobCep">CEP</Label>
                  <Input
                    id="jobCep"
                    value={address.cep}
                    onChange={(event) => handleCepChange(event.target.value)}
                    placeholder="00000-000"
                    inputMode="numeric"
                  />
                  {isFetchingCep && <p className="mt-1 text-xs text-muted-foreground">Buscando CEP...</p>}
                </div>
                <div className="md:col-span-4">
                  <Label htmlFor="jobStreet">Rua</Label>
                  <Input
                    id="jobStreet"
                    value={address.street}
                    onChange={(event) => setAddress((current) => ({ ...current, street: event.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="jobNumber">Numero</Label>
                  <Input
                    id="jobNumber"
                    value={address.number}
                    onChange={(event) => setAddress((current) => ({ ...current, number: event.target.value }))}
                  />
                </div>
                <div className="md:col-span-4">
                  <Label htmlFor="jobNeighborhood">Bairro</Label>
                  <Input
                    id="jobNeighborhood"
                    value={address.neighborhood}
                    onChange={(event) => setAddress((current) => ({ ...current, neighborhood: event.target.value }))}
                  />
                </div>
                <div className="md:col-span-4">
                  <Label htmlFor="jobCity">Cidade</Label>
                  <Input
                    id="jobCity"
                    value={address.city}
                    onChange={(event) => setAddress((current) => ({ ...current, city: event.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="jobState">UF</Label>
                  <Input
                    id="jobState"
                    value={address.state}
                    maxLength={2}
                    onChange={(event) => setAddress((current) => ({ ...current, state: event.target.value.toUpperCase() }))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>Dias desejados</Label>
          <div className="flex flex-wrap gap-2">
            {FAMILY_JOB_DAYS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={scheduleDays.includes(option.value) ? "default" : "outline"}
                size="sm"
                className="h-9 min-w-12"
                onClick={() => toggleValue(option.value, scheduleDays, setScheduleDays)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Periodo</Label>
          <div className="flex flex-wrap gap-2">
            {FAMILY_JOB_PERIODS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={schedulePeriods.includes(option.value) ? "default" : "outline"}
                size="sm"
                className="h-9"
                onClick={() => toggleValue(option.value, schedulePeriods, setSchedulePeriods)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Input
            value={specificSchedule}
            onChange={(event) => setSpecificSchedule(event.target.value)}
            placeholder="Detalhes de horario, escala ou frequencia"
          />
        </div>

        <div className="space-y-3">
          <Label>Atividades esperadas</Label>
          <div className="flex flex-wrap gap-2">
            {FAMILY_JOB_ACTIVITIES.map((activity) => (
              <Badge
                key={activity}
                variant={activities.includes(activity) ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-xs"
                onClick={() => toggleValue(activity, activities, setActivities)}
              >
                {activity}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Requisitos desejados</Label>
          <div className="flex flex-wrap gap-2">
            {FAMILY_JOB_REQUIREMENTS.map((requirement) => (
              <Badge
                key={requirement}
                variant={requirements.includes(requirement) ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-xs"
                onClick={() => toggleValue(requirement, requirements, setRequirements)}
              >
                {requirement}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobNotes">Observacoes da necessidade</Label>
          <Textarea
            id="jobNotes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ex: precisa ter experiencia com banho no leito, morar perto, disponibilidade para inicio imediato..."
            className="min-h-24"
            maxLength={800}
          />
        </div>

        {preview && (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Resumo para solicitações e recomendações</p>
            <p className={cn("text-sm leading-relaxed text-foreground", !isActive && "opacity-60")}>{preview}</p>
          </div>
        )}

        <Button type="button" onClick={handleSave} disabled={isPending} className="w-full gap-2 sm:w-auto">
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : setupMode ? "Salvar e finalizar" : "Salvar necessidade"}
        </Button>
      </CardContent>
    </Card>
  );
}
