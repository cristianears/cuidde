import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = ["Dados", "Biografia", "Especialidades", "Referências", "Disponibilidade", "Documentos"]

interface CaregiverSetupProgressProps {
  currentStep: number
}

export default function CaregiverSetupProgress({ currentStep }: CaregiverSetupProgressProps) {
  const progress = Math.round((Math.max(1, currentStep) / steps.length) * 100)

  return (
    <section className="mb-4 border-b border-border bg-card pb-4 md:mb-6 md:pb-5" aria-label="Progresso do cadastro inicial">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-primary">Cadastro inicial</p>
          <h2 className="mt-1 text-base font-semibold text-foreground md:text-lg">
            {steps[currentStep - 1]}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            Etapa {currentStep} de {steps.length}. Você poderá alterar tudo depois no seu perfil.
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-primary">{progress}%</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>

      <ol className="mt-3 hidden grid-cols-6 gap-2 md:grid">
        {steps.map((label, index) => {
          const stepNumber = index + 1
          const complete = stepNumber < currentStep
          const active = stepNumber === currentStep
          return (
            <li key={label} className={cn("min-w-0 text-center text-xs", active ? "font-medium text-primary" : "text-muted-foreground")}>
              <span className={cn(
                "mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border",
                complete && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
              )}>
                {complete ? <Check className="h-3.5 w-3.5" /> : stepNumber}
              </span>
              <span className="block truncate">{label}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
