import { Utensils, Pill, Droplets, HeartPulse, ClipboardList, ArrowDown } from "lucide-react";
import { Button } from "./ui/button";

const items = [
  {
    icon: Utensils,
    title: "Alimentação",
    description: "Veja se cada refeição foi aceita ou recusada.",
  },
  {
    icon: Pill,
    title: "Administração de medicamentos",
    description: "Registro de cada medicamento dado, horário e observações do cuidador.",
  },
  {
    icon: Droplets,
    title: "Hidratação",
    description: "Acompanhe a ingestão de líquidos ao longo do dia.",
  },
  {
    icon: HeartPulse,
    title: "Sinais vitais",
    description: "Pressão, temperatura e frequência cardíaca — com data e hora.",
  },
  {
    icon: ClipboardList,
    title: "Registro de ocorrências",
    description: "Qualquer evento relevante do dia documentado pelo cuidador.",
  },
];

const CareRoutinePreview = () => {
  const scrollToPlans = () => {
    document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section className="py-12 md:py-14 relative overflow-hidden">
      <div className="absolute inset-0 bg-echo-primary-soft" />
      <div className="absolute top-0 left-0 right-0 h-px bg-section-divider" />
      <div className="container mx-auto px-6 md:px-10 relative">
        <div className="text-center mb-8">
          <span className="inline-block text-xs font-semibold text-primary tracking-widest uppercase mb-3">
            Exclusivo nos planos pagos
          </span>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2 tracking-tight">
            A família acompanha. O cuidador registra. Você tem paz.
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Com a Rotina de Cuidados, cada turno gera um relatório pelo cuidador, que só você e sua família podem ver.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 max-w-5xl mx-auto mb-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="group bg-card p-4 rounded-xl shadow-card border border-border/30 hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:from-primary/20 transition-all duration-300">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 max-w-2xl mx-auto mb-6">
          Os medicamentos são informados pela família. Todos os demais registros são fornecidos pelo profissional. A responsabilidade pela veracidade das informações é de quem as envia.
        </p>

        <div className="text-center">
          <Button
            onClick={scrollToPlans}
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold px-6 py-2.5 text-sm rounded-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            Confira nossos planos abaixo
            <ArrowDown className="w-3.5 h-3.5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CareRoutinePreview;
