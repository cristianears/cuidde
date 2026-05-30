import { FileCheck, ShieldCheck, UserCheck, Lock } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
const checks = [
  {
    icon: FileCheck,
    title: "Documentos e certificações",
    description:
      "O profissional envia documentos de identificação, formação e cursos. Essas informações ficam disponíveis no perfil para consulta da família.",
  },
  {
    icon: ShieldCheck,
    title: "Certidão de antecedentes (opcional)",
    description:
      "O profissional pode anexar sua certidão de antecedentes para análise da família. O documento é enviado pelo próprio profissional.",
  },
  {
    icon: UserCheck,
    title: "Referências profissionais",
    description:
      "Referências podem ser informadas pelo profissional em seu perfil, permitindo que a família avalie antes de decidir.",
  },
  {
    icon: Lock,
    title: "Proteção de dados",
    description:
      "A icuide adota medidas de segurança e boas práticas no tratamento de dados, com foco em conformidade com a LGPD.",
  },
];
const Trust = () => {
  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-echo-blue opacity-70" />
      <div className="container mx-auto px-6 md:px-10 relative">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-4 tracking-tight leading-tight">
              Informação organizada para você decidir com confiança
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-4 leading-relaxed">
              A icuide reúne em cada perfil informações enviadas pelo próprio profissional,
              facilitando a comparação e a tomada de decisão.
            </p>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              A análise, o contato e a contratação são realizados diretamente entre família e profissional.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-4 leading-relaxed">
              *Os documentos e informações exibidos são fornecidos pelo profissional.
              A responsabilidade pela veracidade é de quem os envia.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 relative">
            {checks.map((item, index) => (
              <div
                key={index}
                className="bg-card p-4 rounded-xl shadow-card border border-border/30 hover:shadow-card-hover transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
export default Trust;
