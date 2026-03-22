import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useCreateAppointment } from "@/hooks/useAppointments"
import type { Appointment } from "@/types/database"

interface RequestAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caregiverId: string
  caregiverName: string
}

const TYPE_OPTIONS: { value: Appointment["type"]; label: string; description: string }[] = [
  { value: "plantão", label: "Plantão", description: "Atendimento contínuo por período definido (12h, 24h)" },
  { value: "contínuo", label: "Contínuo", description: "Acompanhamento regular por período prolongado" },
  { value: "turno", label: "Turno", description: "Atendimento por turno (manhã, tarde ou noite)" },
]

const MODALITY_OPTIONS = [
  "Presencial - Residência da família",
  "Presencial - Hospital/Clínica",
  "Presencial - Casa de repouso",
]

export default function RequestAppointmentDialog({
  open,
  onOpenChange,
  caregiverId,
  caregiverName,
}: RequestAppointmentDialogProps) {
  const { mutate: createAppointment, isPending } = useCreateAppointment()

  const [type, setType] = useState<Appointment["type"] | "">("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [modality, setModality] = useState("")
  const [description, setDescription] = useState("")
  const [familyNotes, setFamilyNotes] = useState("")

  const isValid = type !== "" && startDate !== undefined

  const handleSubmit = () => {
    if (!isValid) return

    createAppointment(
      {
        caregiver_id: caregiverId,
        type: type as Appointment["type"],
        start_date: format(startDate!, "yyyy-MM-dd"),
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        description: description.trim() || undefined,
        family_notes: familyNotes.trim() || undefined,
        modality: modality || undefined,
      },
      {
        onSuccess: () => {
          resetForm()
          onOpenChange(false)
        },
      }
    )
  }

  const resetForm = () => {
    setType("")
    setStartDate(undefined)
    setEndDate(undefined)
    setModality("")
    setDescription("")
    setFamilyNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Atendimento</DialogTitle>
          <DialogDescription>
            Envie uma solicitação para <strong>{caregiverName}</strong>. O cuidador receberá sua
            solicitação e poderá aceitar ou recusar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tipo de atendimento */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de atendimento *</Label>
            <Select value={type} onValueChange={(v) => setType(v as Appointment["type"])}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data de início */}
          <div className="space-y-2">
            <Label>Data de início *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data de término (opcional) */}
          <div className="space-y-2">
            <Label>Data de término (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Sem data definida"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) =>
                    date < (startDate ?? new Date(new Date().setHours(0, 0, 0, 0)))
                  }
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Modalidade */}
          <div className="space-y-2">
            <Label htmlFor="modality">Modalidade</Label>
            <Select value={modality} onValueChange={setModality}>
              <SelectTrigger id="modality">
                <SelectValue placeholder="Selecione a modalidade" />
              </SelectTrigger>
              <SelectContent>
                {MODALITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição do atendimento</Label>
            <Textarea
              id="description"
              placeholder="Descreva o que você precisa: horários desejados, frequência, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={600}
            />
          </div>

          {/* Observações sobre o idoso */}
          <div className="space-y-2">
            <Label htmlFor="familyNotes">Observações sobre o idoso</Label>
            <Textarea
              id="familyNotes"
              placeholder="Informe necessidades especiais, preferências, rotina do idoso, etc."
              value={familyNotes}
              onChange={(e) => setFamilyNotes(e.target.value)}
              rows={3}
              maxLength={600}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending ? "Enviando..." : "Enviar Solicitação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
