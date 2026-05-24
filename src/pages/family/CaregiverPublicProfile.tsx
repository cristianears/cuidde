import { useState, useEffect } from "react"
import { trackCaregiverView } from "@/hooks/useTrackCaregiverEvent"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, MapPin, Briefcase, Star, Clock, CalendarClock, Shield, Car,
  Award, FileCheck, FileText, User, BadgeCheck, Zap, Globe, Heart, Send,
  GraduationCap, MapPinned, ClipboardList, DollarSign, MessageSquare, Eye, Loader2, Lock,
} from "lucide-react"
import AppSidebar from "@/components/shared/AppSidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import { useFamilyProfile } from "@/hooks/useFamilyProfile"
import { usePublicCaregiverProfile } from "@/hooks/usePublicCaregiverProfile"
import { useFavoriteIds, useAddFavorite, useRemoveFavorite } from "@/hooks/useFavorites"
import RequestAppointmentDialog from "@/components/shared/RequestAppointmentDialog"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { canCreatePaidAppointment, hasFullPaidAccess } from "@/lib/subscription-access"

const PROFISSAO_LABELS: Record<string, string> = {
  cuidador: "Cuidador(a)",
  tecnico_enfermagem: "Técnico(a) de Enfermagem",
  auxiliar_enfermagem: "Auxiliar de Enfermagem",
  enfermeiro: "Enfermeiro(a)",
  fisioterapeuta: "Fisioterapeuta",
  terapeuta_ocupacional: "Terapeuta Ocupacional",
  outro: "Outro",
}

const REG_TYPE_LABELS: Record<string, string> = {
  coren: "COREN",
  crefito: "CREFITO",
  outros: "Outro",
}

const JOURNEY_TYPE_LABELS: Record<string, string> = {
  plantoes: "Plantões avulsos",
  diarias: "Diárias",
  coberturas: "Coberturas / Substituição",
  "finais-semana": "Finais de semana",
  "longo-periodo": "Longo período",
}

const AREA_TYPE_LABELS: Record<string, string> = {
  bairro: "Mesmo bairro",
  cidade: "Mesma cidade",
  proximas: "Proximidade (raio definido)",
}

const DOC_TYPE_LABELS: Record<string, string> = {
  curriculo: "Currículo",
  certificacao: "Certificação",
  antecedentes: "Certidão de Antecedentes",
}

const DOC_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  approved: { label: "Verificado", cls: "bg-emerald-50 text-emerald-700" },
  sent: { label: "Enviado", cls: "bg-blue-50 text-blue-700" },
  pending: { label: "Pendente", cls: "bg-amber-50 text-amber-700" },
}

function Chip({ label, color = "gray" }: { label: string; color?: "gray" | "blue" | "emerald" }) {
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-1 rounded-full text-xs font-medium",
        color === "blue" && "bg-blue-50 text-blue-700",
        color === "emerald" && "bg-emerald-50 text-emerald-700",
        color === "gray" && "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  )
}

const CaregiverPublicProfile = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: familyProfile } = useFamilyProfile()
  const { data: caregiver, isLoading } = usePublicCaregiverProfile(id)
  const { data: favoriteIdsList = [] } = useFavoriteIds()
  const { mutate: addFavorite } = useAddFavorite()
  const { mutate: removeFavorite } = useRemoveFavorite()

  // Tracking de view do perfil público (best-effort, dedup por dia no banco)
  useEffect(() => {
    if (id && user && id !== user.id) {
      trackCaregiverView(id)
    }
  }, [id, user])

  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string; isPdf: boolean } | null>(null)

  const isSubscriber = caregiver?.isSubscriber ?? false
  const canRequestAppointment = canCreatePaidAppointment(familyProfile)
  const appointmentCtaLabel = familyProfile?.subscription_status === 'past_due'
    ? 'Regularize para contato'
    : 'Assine para contato'

  const handleRequestAppointment = () => {
    if (!canRequestAppointment) {
      navigate('/family/billing')
      return
    }
    setRequestDialogOpen(true)
  }
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null)

  const handleViewDocument = async (docId: string, fileUrl: string | null, fileName: string | null) => {
    if (!fileUrl) return
    setLoadingDocId(docId)
    try {
      const { data, error } = await supabase.storage.from('documents').download(fileUrl)
      if (error || !data) {
        toast.error('Não foi possível abrir o documento. Verifique seu plano de assinatura.')
        return
      }
      const blobUrl = URL.createObjectURL(data)
      const isPdf = fileUrl.toLowerCase().endsWith('.pdf')
      setViewingDoc({ url: blobUrl, name: fileName ?? 'Documento', isPdf })
    } finally {
      setLoadingDocId(null)
    }
  }

  const handleCloseDoc = () => {
    if (viewingDoc) {
      try {
        URL.revokeObjectURL(viewingDoc.url)
      } catch {
        // Blob URL may already be revoked by the browser.
      }
    }
    setViewingDoc(null)
  }

  const favoriteIds = new Set(favoriteIdsList)
  const isFavorite = id ? favoriteIds.has(id) : false
  const canFavorite = hasFullPaidAccess(familyProfile)

  const handleFavorite = () => {
    if (!id || !user) return
    if (!canFavorite) {
      toast.error("Assine um plano para favoritar perfis.")
      return
    }
    if (isFavorite) {
      removeFavorite(id)
    } else {
      addFavorite(id)
    }
  }

  const displayName = familyProfile?.profiles?.full_name ?? ""

  const getInitials = (name: string | null) => {
    if (!name) return "?"
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
  }

  const profissaoLabel = caregiver?.profissao_formacao
    ? PROFISSAO_LABELS[caregiver.profissao_formacao] ?? caregiver.profissao_formacao
    : null

  const trustBadges = caregiver
    ? [
        caregiver.has_rg_cnh && { icon: FileText, label: "Documentos enviados", cls: "bg-emerald-50 text-emerald-700" },
        caregiver.has_antecedentes && { icon: Shield, label: "Certidão de antecedentes", cls: "bg-violet-50 text-violet-700" },
        caregiver.has_references && { icon: User, label: "Referências profissionais", cls: "bg-amber-50 text-amber-700" },
        caregiver.has_certificado && { icon: BadgeCheck, label: "Certificados informados", cls: "bg-blue-50 text-blue-700" },
        caregiver.possui_cnh && { icon: Car, label: "Possui CNH", cls: "bg-indigo-50 text-indigo-700" },
        caregiver.has_insurance && { icon: Award, label: "Seguro profissional", cls: "bg-teal-50 text-teal-700" },
        caregiver.professional_reg_number && { icon: FileCheck, label: "Registro profissional", cls: "bg-accent/10 text-accent" },
        caregiver.emergency_available && { icon: Zap, label: "Disponível p/ emergências", cls: "bg-rose-50 text-rose-700" },
      ].filter(Boolean) as { icon: React.ElementType; label: string; cls: string }[]
    : []

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar
          role="family"
          userName={displayName}
          userPhoto={familyProfile?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture}
        />
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-3xl space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    )
  }

  if (!caregiver) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar
          role="family"
          userName={displayName}
          userPhoto={familyProfile?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture}
        />
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-3xl text-center py-20">
            <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Cuidador não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              Este perfil pode não estar mais disponível.
            </p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const hasAvailabilityInfo = caregiver.journey_types?.length > 0 || caregiver.area_type || caregiver.availability_notes
  const hasRegInfo = caregiver.professional_reg_type && caregiver.professional_reg_number

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="family"
        userName={displayName}
        userPhoto={familyProfile?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture}
      />

      <main className="flex-1 p-4 lg:p-6">
        <div className="max-w-3xl space-y-4">
          {/* Botão voltar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>

          {/* Header: Foto + Info básica */}
          <Card className="mb-4">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="flex-shrink-0 flex justify-center sm:justify-start">
                  <Avatar className="w-28 h-28 sm:w-32 sm:h-32">
                    <AvatarImage src={caregiver.photo_url ?? undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getInitials(caregiver.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                    {caregiver.full_name ?? "Nome não informado"}
                  </h1>

                  {profissaoLabel && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-muted-foreground mb-2">
                      <Briefcase className="w-4 h-4" />
                      {profissaoLabel}
                      {caregiver.experience_years > 0 && (
                        <span>
                          · {caregiver.experience_years} {caregiver.experience_years === 1 ? "ano" : "anos"} de experiência
                        </span>
                      )}
                    </div>
                  )}

                  {(caregiver.neighborhood || caregiver.city) && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      {[caregiver.neighborhood, caregiver.city, caregiver.state].filter(Boolean).join(", ")}
                    </div>
                  )}

                  {/* Preços + Avaliação */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm mb-3">
                    {caregiver.price_per_hour && (
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        R$ {caregiver.price_per_hour}/h
                      </span>
                    )}
                    {caregiver.price_per_day && (
                      <span className="flex items-center gap-1.5 font-semibold">
                        <CalendarClock className="w-4 h-4 text-muted-foreground" />
                        R$ {caregiver.price_per_day}/plantão
                      </span>
                    )}
                    {caregiver.review_count > 0 ? (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{Number(caregiver.average_rating).toFixed(1)}</span>
                        <span className="text-muted-foreground">({caregiver.review_count} avaliações)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Star className="w-4 h-4 text-muted-foreground/40" />
                        Sem avaliações
                      </span>
                    )}
                  </div>

                  {/* Trust badges */}
                  {trustBadges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {trustBadges.map(({ icon: Icon, label, cls }) => (
                        <span
                          key={label}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            cls,
                          )}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleRequestAppointment}
                      className="gap-2"
                    >
                      {canRequestAppointment ? <Send className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {canRequestAppointment ? "Solicitar Atendimento" : appointmentCtaLabel}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleFavorite}
                      aria-disabled={!canFavorite}
                      title={!canFavorite ? "Assine um plano para favoritar perfis." : undefined}
                      className={cn("gap-2", !canFavorite && "opacity-70")}
                    >
                      <Heart className={cn("w-4 h-4", isFavorite && canFavorite && "fill-red-500 text-red-500")} />
                      {isFavorite ? "Favoritado" : "Favoritar"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sobre + Formação complementar */}
          {(caregiver.bio || caregiver.formacao_complementar) && (
            <Card className="mb-4">
              <CardContent className="p-4 sm:p-6 space-y-4">
                {caregiver.bio && (
                  <div>
                    <h2 className="text-base font-semibold mb-2">Sobre</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line break-all">
                      {caregiver.bio}
                    </p>
                  </div>
                )}

                {caregiver.bio && caregiver.formacao_complementar && <Separator />}

                {caregiver.formacao_complementar && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      Formação complementar
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {caregiver.formacao_complementar}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Especialidades + Formatos + Idiomas */}
          <Card className="mb-4">
            <CardContent className="p-4 sm:p-6 space-y-4">
              {caregiver.specialties?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Especialidades</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {caregiver.specialties.map((s) => (
                      <Chip key={s} label={s} color="blue" />
                    ))}
                  </div>
                </div>
              )}

              {caregiver.modalities?.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Formatos de atendimento</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {caregiver.modalities.map((m) => (
                        <Chip key={m} label={m} color="emerald" />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {caregiver.idiomas?.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      Idiomas
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {caregiver.idiomas.map((i) => (
                        <Chip key={i} label={i} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Registro Profissional */}
          {hasRegInfo && (
            <Card className="mb-4">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-base font-semibold mb-3 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4" />
                  Registro Profissional
                </h2>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">
                      {caregiver.professional_reg_type === 'outros'
                        ? caregiver.professional_reg_other_desc || 'Outro'
                        : REG_TYPE_LABELS[caregiver.professional_reg_type!] ?? caregiver.professional_reg_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Número:</span>
                    <span className="font-medium">{caregiver.professional_reg_number}</span>
                  </div>
                  {caregiver.professional_reg_uf && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">UF:</span>
                      <span className="font-medium">{caregiver.professional_reg_uf}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disponibilidade */}
          {hasAvailabilityInfo && (
            <Card className="mb-4">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-base font-semibold mb-3 flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4" />
                  Disponibilidade
                </h2>
                <div className="space-y-3">
                  {caregiver.journey_types?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Tipos de jornada aceitos</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {caregiver.journey_types.map((j) => (
                          <Chip key={j} label={JOURNEY_TYPE_LABELS[j] ?? j} color="emerald" />
                        ))}
                      </div>
                    </div>
                  )}

                  {caregiver.area_type && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Área de atendimento</h4>
                      <p className="text-sm flex items-center gap-1.5">
                        <MapPinned className="w-3.5 h-3.5 text-muted-foreground" />
                        {AREA_TYPE_LABELS[caregiver.area_type] ?? caregiver.area_type}
                        {caregiver.area_type === 'proximas' && caregiver.area_radius && (
                          <span className="text-muted-foreground">({caregiver.area_radius} km)</span>
                        )}
                      </p>
                    </div>
                  )}

                  {caregiver.availability_notes && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Observações</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {caregiver.availability_notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Valores — Observação */}
          {caregiver.pricing_note && (
            <Card className="mb-4">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-base font-semibold mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  Observações sobre valores
                </h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {caregiver.pricing_note}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Documentos */}
          {caregiver.documents?.length > 0 && (
            <Card className="mb-4">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-base font-semibold mb-3 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" />
                  Documentos
                </h2>
                <div className="space-y-2">
                  {caregiver.documents.map((doc) => {
                    const statusInfo = DOC_STATUS_LABELS[doc.status] ?? DOC_STATUS_LABELS.pending
                    return (
                      <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-sm min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{DOC_TYPE_LABELS[doc.type] ?? doc.type}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusInfo.cls)}>
                            {statusInfo.label}
                          </span>
                          {isSubscriber && doc.file_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
                              onClick={() => handleViewDocument(doc.id, doc.file_url, doc.file_name)}
                              disabled={!!loadingDocId}
                            >
                              {loadingDocId === doc.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                              Visualizar
                            </Button>
                          )}
                          {!isSubscriber && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
                              onClick={() => navigate('/family/billing')}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Assine para visualizar
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Referências Profissionais */}
          {(caregiver.references?.length > 0 || (!isSubscriber && caregiver.reference_count > 0)) && (
            <Card className="mb-4">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-base font-semibold mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Referências Profissionais
                </h2>
                <div className="space-y-3">
                  {isSubscriber
                    ? caregiver.references.map((ref) => (
                        <div key={ref.id} className="rounded-lg border p-3 space-y-1">
                          <p className="text-sm font-medium">{ref.name}</p>
                          {ref.position && (
                            <p className="text-xs text-muted-foreground">{ref.position}</p>
                          )}
                          {ref.workplace && (
                            <p className="text-xs text-muted-foreground">
                              Local: {ref.workplace}
                            </p>
                          )}
                          {ref.work_duration && (
                            <p className="text-xs text-muted-foreground">
                              Tempo de trabalho: {ref.work_duration}
                            </p>
                          )}
                          {ref.phone && (
                            <p className="text-xs text-muted-foreground">
                              Telefone: {ref.phone}
                            </p>
                          )}
                          {ref.notes && (
                            <p className="text-xs text-muted-foreground italic mt-1">
                              {ref.notes}
                            </p>
                          )}
                        </div>
                      ))
                    : Array.from({ length: caregiver.reference_count }).map((_, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border p-3 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="h-3 w-32 rounded bg-muted" />
                            <div className="h-2.5 w-24 rounded bg-muted/70" />
                            <div className="h-2.5 w-40 rounded bg-muted/70" />
                            <div className="h-2.5 w-28 rounded bg-muted/70" />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 shrink-0"
                            onClick={() => navigate('/family/billing')}
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Assine para visualizar
                          </Button>
                        </div>
                      ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Avaliações */}
          {caregiver.reviews?.length > 0 && (
            <Card className="mb-4">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-base font-semibold mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  Avaliações ({caregiver.reviews.length})
                </h2>
                <div className="space-y-5">
                  {caregiver.reviews.map((review, idx) => {
                    const criteria = [
                      { key: "rating_pontualidade", label: "Pontualidade" },
                      { key: "rating_competencia",  label: "Competência" },
                      { key: "rating_comunicacao",  label: "Comunicação" },
                      { key: "rating_trato",        label: "Trato com o idoso" },
                      { key: "rating_confianca",    label: "Confiança" },
                    ] as const
                    const hasCriteria = criteria.some(
                      (c) => (review[c.key] ?? 0) > 0
                    )
                    return (
                      <div key={review.id}>
                        {idx > 0 && <Separator className="mb-5" />}
                        {/* Header: avatar + nome + nota geral + data */}
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="w-8 h-8">
                            {review.family_photo ? (
                              <AvatarImage src={review.family_photo} />
                            ) : null}
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(review.family_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{review.family_name ?? "Família"}</p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "w-3.5 h-3.5",
                                    i < Math.round(review.rating)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground/30"
                                  )}
                                />
                              ))}
                              <span className="text-xs font-semibold ml-0.5">{Number(review.rating).toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                {new Date(review.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Critérios detalhados */}
                        {hasCriteria && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 pl-11 mb-2">
                            {criteria.map((c) => {
                              const val = review[c.key] ?? 0
                              if (!val) return null
                              return (
                                <div key={c.key} className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-muted-foreground truncate">{c.label}</span>
                                  <span className="flex items-center gap-0.5 shrink-0">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <Star
                                        key={i}
                                        className={cn(
                                          "w-2.5 h-2.5",
                                          i < Math.round(val)
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-muted-foreground/30"
                                        )}
                                      />
                                    ))}
                                    <span className="text-xs text-muted-foreground ml-0.5">{Number(val).toFixed(1)}</span>
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {/* Comentário */}
                        {review.comment && (
                          <p className="text-sm text-muted-foreground pl-11 whitespace-pre-line">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA fixo mobile */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-50">
            <Button
              onClick={handleRequestAppointment}
              className="w-full gap-2"
              size="lg"
            >
              {canRequestAppointment ? <Send className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {canRequestAppointment ? "Solicitar Atendimento" : appointmentCtaLabel}
            </Button>
          </div>

          {/* Spacer for mobile fixed CTA */}
          <div className="sm:hidden h-20" />
        </div>
      </main>

      {/* Dialog de visualização de documento */}
      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && handleCloseDoc()}>
        <DialogContent className="max-w-3xl w-[95vw] h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
            <DialogTitle className="text-sm font-medium truncate pr-8">
              {viewingDoc?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-4 pb-4">
            {viewingDoc?.isPdf ? (
              <iframe
                src={`${viewingDoc.url}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full rounded-lg border"
                title={viewingDoc.name}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center overflow-auto">
                <img
                  src={viewingDoc?.url}
                  alt={viewingDoc?.name}
                  className="max-w-full max-h-full object-contain select-none pointer-events-none"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de solicitação */}
      <RequestAppointmentDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        caregiverId={caregiver.id}
        caregiverName={caregiver.full_name ?? "Cuidador"}
      />
    </div>
  )
}

export default CaregiverPublicProfile
