import {
  Heart, MapPin, Shield, Briefcase, Star, Car, Award,
  FileCheck, FileText, User, BadgeCheck, Zap, Globe, Clock, CalendarClock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CaregiverPublic } from "@/types/database";
import { cn } from "@/lib/utils";
import { useState } from "react";

const PROFISSAO_LABELS: Record<string, string> = {
  cuidador: "Cuidador(a)",
  tecnico_enfermagem: "Técnico(a) de Enfermagem",
  auxiliar_enfermagem: "Auxiliar de Enfermagem",
  enfermeiro: "Enfermeiro(a)",
  fisioterapeuta: "Fisioterapeuta",
  terapeuta_ocupacional: "Terapeuta Ocupacional",
  outro: "Outro",
};

interface CaregiverCardProps {
  caregiver: CaregiverPublic;
  onFavorite?: (id: string) => void;
  onContact?: (id: string) => void;
  isFavorite?: boolean;
  className?: string;
  hasDocsSent?: boolean;
  hasAntecedentes?: boolean;
  hasReferencias?: boolean;
  hasCertificados?: boolean;
  distanceKm?: number;
}

function Chip({ label, color = "gray" }: { label: string; color?: "gray" | "blue" | "emerald" }) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-full text-xs font-medium leading-tight whitespace-nowrap",
        color === "blue"    && "bg-blue-50 text-blue-700",
        color === "emerald" && "bg-emerald-50 text-emerald-700",
        color === "gray"    && "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

function ChipList({ items, color, max = 3 }: { items: string[]; color: "blue" | "emerald"; max?: number }) {
  const visible = items.slice(0, max);
  const extra = items.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((s) => <Chip key={s} label={s} color={color} />)}
      {extra > 0 && <Chip label={`+${extra}`} color="gray" />}
    </div>
  );
}

const CaregiverCard = ({
  caregiver,
  onFavorite,
  onContact,
  isFavorite = false,
  className,
  hasDocsSent = false,
  hasAntecedentes = false,
  hasReferencias = false,
  hasCertificados = false,
  distanceKm,
}: CaregiverCardProps) => {
  const [favorite, setFavorite] = useState(isFavorite);

  const handleFavorite = () => {
    setFavorite(!favorite);
    onFavorite?.(caregiver.id);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const profissaoLabel = caregiver.profissao_formacao
    ? (PROFISSAO_LABELS[caregiver.profissao_formacao] ?? caregiver.profissao_formacao)
    : null;

  const idiomasDisplay = (caregiver.idiomas ?? []).filter((i) => i.toLowerCase() !== "outro");

  const trustBadges = [
    hasDocsSent       && { icon: FileText,   label: "Documentos enviados",      cls: "bg-emerald-50 text-emerald-700" },
    hasAntecedentes   && { icon: Shield,     label: "Certidão de antecedentes", cls: "bg-violet-50 text-violet-700"  },
    hasReferencias    && { icon: User,       label: "Referências profissionais", cls: "bg-amber-50 text-amber-700"   },
    hasCertificados   && { icon: BadgeCheck, label: "Certificados informados",  cls: "bg-blue-50 text-blue-700"     },
    caregiver.possui_cnh      && { icon: Car,      label: "Possui CNH",               cls: "bg-indigo-50 text-indigo-700" },
    caregiver.has_insurance   && { icon: Award,    label: "Seguro informado",         cls: "bg-teal-50 text-teal-700"   },
    caregiver.professional_reg_number && { icon: FileCheck, label: "Registro profissional", cls: "bg-accent/10 text-accent" },
    caregiver.emergency_available     && { icon: Zap,       label: "Disponível p/ emergências", cls: "bg-rose-50 text-rose-700" },
  ].filter(Boolean) as { icon: React.ElementType; label: string; cls: string }[];

  return (
    <Card className={cn("overflow-hidden hover:shadow-md transition-shadow duration-200", className)}>
      <CardContent className="p-0">
        <div className="flex min-w-0">

          {/* ── Foto ── */}
          <div className="relative w-28 sm:w-40 flex-shrink-0 bg-muted self-stretch">
            {caregiver.photo_url ? (
              <img
                src={caregiver.photo_url}
                alt={caregiver.full_name ?? "Cuidador"}
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {getInitials(caregiver.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <button
              onClick={handleFavorite}
              aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              className={cn(
                "absolute top-2 right-2 p-2 rounded-full transition-all z-10 cursor-pointer",
                favorite
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:bg-background"
              )}
            >
              <Heart className={cn("w-4 h-4", favorite && "fill-current")} />
            </button>
          </div>

          {/* ── Conteúdo ── */}
          <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-1.5">

            {/* Linha 1: Nome */}
            <h3 className="font-semibold text-base text-foreground truncate leading-tight">
              {caregiver.full_name ?? "Nome não informado"}
            </h3>

            {/* Linha 2: Profissão + exp + localização */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {profissaoLabel && (
                <span className="flex items-center gap-1 shrink-0">
                  <Briefcase className="w-3 h-3" />
                  {profissaoLabel}
                  {caregiver.experience_years > 0 && (
                    <span className="text-muted-foreground/70">
                      · {caregiver.experience_years}{caregiver.experience_years === 1 ? " ano" : " anos"} exp.
                    </span>
                  )}
                </span>
              )}
              {(caregiver.neighborhood || caregiver.city) && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {[caregiver.neighborhood, caregiver.city].filter(Boolean).join(", ")}
                  </span>
                  {distanceKm !== undefined && (
                    <span className="text-primary font-medium shrink-0">
                      {distanceKm < 1 ? "< 1 km" : `${distanceKm} km`}
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Linha 3: Preços + Avaliação */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs">
              {caregiver.price_per_hour && (
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  R$ {caregiver.price_per_hour}/h
                </span>
              )}
              {caregiver.price_per_day && (
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <CalendarClock className="w-3 h-3 text-muted-foreground" />
                  R$ {caregiver.price_per_day}/plantão
                </span>
              )}
              {caregiver.review_count > 0 ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">{Number(caregiver.average_rating).toFixed(1)}</span>
                  <span>({caregiver.review_count})</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Star className="w-3 h-3 text-muted-foreground/40" />
                  Sem avaliações
                </span>
              )}
            </div>

            {/* Linha 4: Bio */}
            {caregiver.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed overflow-hidden">
                {caregiver.bio}
              </p>
            )}

            {/* Linha 5: Especialidades + Formatos lado a lado */}
            <div className="flex flex-col gap-1">
              {caregiver.specialties?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-foreground mr-1.5">Especialidades</span>
                  <ChipList items={caregiver.specialties} color="blue" max={3} />
                </div>
              )}
              {caregiver.modalities?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-foreground mr-1.5">Formatos</span>
                  <ChipList items={caregiver.modalities} color="emerald" max={3} />
                </div>
              )}
            </div>

            {/* Linha 6: Idiomas */}
            {idiomasDisplay.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="w-3 h-3 shrink-0" />
                <span className="truncate">{idiomasDisplay.join(" · ")}</span>
              </div>
            )}

            {/* Linha 7: Trust badges */}
            {trustBadges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {trustBadges.map(({ icon: Icon, label, cls }) => (
                  <span key={label} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", cls)}>
                    <Icon className="w-3 h-3" />
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="pt-1.5 mt-auto border-t border-border/50">
              <Button
                onClick={() => onContact?.(caregiver.id)}
                size="sm"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-8 text-xs"
              >
                Ver perfil
              </Button>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaregiverCard;
