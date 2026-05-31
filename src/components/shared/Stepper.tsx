import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  onStepClick?: (stepId: number) => void;
}

const Stepper = ({ steps, currentStep, className, onStepClick }: StepperProps) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-start justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                disabled={!onStepClick}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-300",
                  onStepClick ? "cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" : "cursor-default",
                  currentStep > step.id
                    ? "bg-accent text-accent-foreground"
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </button>
              <div className="mt-2 flex min-h-9 items-center justify-center text-center">
                <p
                  className={cn(
                    "text-xs sm:text-sm font-medium leading-tight",
                    currentStep >= step.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
              </div>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block text-center">
                  {step.description}
                </p>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4 transition-all duration-300",
                  currentStep > step.id ? "bg-accent" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;
