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

// ─── Labels ──────────────────────────────────────────────────────────────────

const PROFISSAO_LABELS: Record<string, string> = {
  cuidador: "Cuidador(a)",
  tecnico_enfermagem: "Técnico(a) de Enfermagem",
  auxiliar_enfermagem: "Auxiliar de Enfermagem",
  enfermeiro: "Enfermeiro(a)",
  fisioterapeuta: "Fisioterapeuta",
  terapeuta_ocupacional: "Terapeuta Ocupacional",
  outro: "Outro",
};

// ─── Props ────────────────────────────────────────────────────────────────────

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

// ─── Chip helper ─────────────────────────────────────────────────────────────

function Chip({ label, color = "gray" }: { label: string; color?: "gray" | "blue" | "emerald" }) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-full text-xs font-medium leading-tight",
        color === "blue"    && "bg-blue-50 text-blue-700",
        color === "emerald" && "bg-emerald-50 text-emerald-700",
        color === "gray"    && "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

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

  // Idiomas: remover "Outro" se aparecer (substituído pelo valor digitado)
  const idiomasDisplay = (caregiver.idiomas ?? []).filter(
    (i) => i.toLowerCase() !== "outro"
  );

  return (
    <Card className={cn("overflow-hidden hover:shadow-lg transition-shadow duration-300", className)}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">

          {/* ── Foto ─────────────────────────────────────────────────────── */}
          <div className="relative w-full sm:w-40 h-48 sm:h-auto flex-shrink-0 bg-muted">
            {caregiver.photo_url ? (
              <img
                src={caregiver.photo_url}
                alt={caregiver.full_name ?? "Cuidador"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={caregiver.photo_url ?? undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(caregiver.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <button
              onClick={handleFavorite}
              className={cn(
                "absolute top-3 right-3 p-2 rounded-full transition-all",
                favorite
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:bg-background"
              )}
            >
              <Heart className={cn("w-4 h-4", favorite && "fill-current")} />
            </button>
          </div>

          {/* ── Conteúdo ─────────────────────────────────────────────────── */}
          <div className="flex-1 p-4 sm:p-5">

            {/* Nome */}
            <h3 className="font-semibold text-lg text-foreground mb-0.5">
              {caregiver.full_name ?? "Nome não informado"}
            </h3>

            {/* Formação + experiência */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {profissaoLabel && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span>{profissaoLabel}</span>
                </div>
              )}
              {caregiver.experience_years > 0 && (
                <span className="text-xs text-muted-foreground">
                  · {caregiver.experience_years}{" "}
                  {caregiver.experience_years === 1 ? "ano de exp." : "anos de exp."}
                </span>
              )}
            </div>

            {/* Localização */}
            {(caregiver.neighborhood || caregiver.city) && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {[caregiver.neighborhood, caregiver.city].filter(Boolean).join(", ")}
                </span>
                {distanceKm !== undefined && (
                  <span className="ml-auto text-xs font-medium text-primary whitespace-nowrap">
                    {distanceKm < 1 ? "< 1 km" : `${distanceKm} km`}
                  </span>
                )}
              </div>
            )}

            {/* Preços */}
            {(caregiver.price_per_hour || caregiver.price_per_day) && (
              <div className="flex items-center gap-4 mb-2">
                {caregiver.price_per_hour && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground">
                      R$ {caregiver.price_per_hour}/h
                    </span>
                  </div>
                )}
                {caregiver.price_per_day && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <CalendarClock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground">
                      R$ {caregiver.price_per_day}/plantão
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Avaliações */}
            <div className="flex items-center gap-2 mb-3">
              {caregiver.review_count > 0 ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span className="font-semibold text-foreground text-sm">
                    {Number(caregiver.average_rating).toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({caregiver.review_count}{" "}
                    {caregiver.review_count === 1 ? "avaliação" : "avaliações"})
                  </span>
                </>
              ) : (
                <>
                  <Star className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  <span className="text-xs text-muted-foreground">Sem avaliações ainda</span>
                </>
              )}
            </div>

            {/* Biografia */}
            {caregiver.bio && (
              <div className="bg-muted/50 rounded-lg px-3 py-2.5 mb-3 border border-border/50">
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {caregiver.bio}
                </p>
              </div>
            )}

            {/* Especialidades */}
            {caregiver.specialties?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-foreground mb-1.5">Especialidades</p>
                <div className="flex flex-wrap gap-1">
                  {caregiver.specialties.map((s) => (
                    <Chip key={s} label={s} color="blue" />
                  ))}
                </div>
              </div>
            )}

            {/* Formatos de atendimento */}
            {caregiver.modalities?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-foreground mb-1.5">Formatos de atendimento</p>
                <div className="flex flex-wrap gap-1">
                  {caregiver.modalities.map((m) => (
                    <Chip key={m} label={m} color="emerald" />
                  ))}
                </div>
              </div>
            )}

            {/* Idiomas */}
            {idiomasDisplay.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs">{idiomasDisplay.join(" · ")}</span>
              </div>
            )}

            {/* Badges de documentos e confiança */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {hasDocsSent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  <FileText className="w-3 h-3" />
                  Documentos enviados
                </span>
              )}
              {hasCertificados && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  <BadgeCheck className="w-3 h-3" />
                  Certificados informados
                </span>
              )}
              {hasAntecedentes && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                  <Shield className="w-3 h-3" />
                  Certidão de antecedentes
                </span>
              )}
              {hasReferencias && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                  <User className="w-3 h-3" />
                  Referências profissionais
                </span>
              )}
              {caregiver.possui_cnh && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                  <Car className="w-3 h-3" />
                  Possui CNH
                </span>
              )}
              {caregiver.has_insurance && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                  <Award className="w-3 h-3" />
                  Seguro informado
                </span>
              )}
              {caregiver.professional_reg_number && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                  <FileCheck className="w-3 h-3" />
                  Registro profissional
                </span>
              )}
              {caregiver.emergency_available && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                  <Zap className="w-3 h-3" />
                  Disponível para emergências
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="pt-3 border-t border-border/50">
              <Button
                onClick={() => onContact?.(caregiver.id)}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
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
