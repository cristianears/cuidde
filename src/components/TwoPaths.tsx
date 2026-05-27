import { Users, Briefcase, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import familiesImage from "@/assets/families-card-image.jpg";
import caregiversImage from "@/assets/caregivers-card-image.jpg";
import { useNavigate } from "react-router-dom";

const familyFeatures = [
  "Veja certificações, cursos e referências enviados pelo profissional",
  "Leia avaliações de famílias que já contrataram",
  "Compare perfis com calma, sem pressão",
  "Tenha acesso a registro de cuidados realizados e ocorrências em tempo real informados pelo cuidador",
];

const caregiverFeatures = [
  "Perfil completo com suas certificações, cursos e referências",
  "Avaliações de famílias que fortalecem sua reputação ao longo do tempo",
  "Atendimentos por plantão, diária, meio período ou contrato contínuo",
  "Você define sua disponibilidade, região e forma de trabalho",
];

const TwoPaths = () => {
  const navigate = useNavigate();
  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-echo-blue opacity-60" />
      <div className="container mx-auto px-6 md:px-10 relative">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3 tracking-tight">
            Para quem é a ditti?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Famílias que buscam tranquilidade. Profissionais que buscam reconhecimento.
          </p>
        </div>
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
          {/* Families Card */}
          <div className="bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-500 border border-border/50 overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6 lg:p-8 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Para Famílias</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-3">
                  Encontre o profissional certo com informações organizadas para tomar a melhor decisão.
                </p>
                <ul className="space-y-2 flex-grow text-xs md:text-sm">
                  {familyFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs md:text-sm text-muted-foreground mt-3 leading-relaxed">
                  A contratação e o pagamento do serviço são combinados diretamente entre você e o profissional escolhido.
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => navigate("/onboarding?type=family")}
                    className="bg-primary hover:bg-primary/90 rounded-xl py-2.5 px-5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                  >
                    Buscar Profissional
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </div>
              </div>
              <div className="hidden md:block md:w-1/3 lg:w-2/5 relative min-h-[200px]">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-card/80 z-10" />
                <img
                  src={familiesImage}
                  alt="Cuidadora acolhendo idoso em ambiente familiar"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
              </div>
            </div>
          </div>
          {/* Caregivers Card */}
          <div className="bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-500 border border-border/50 overflow-hidden">
            <div className="flex flex-col md:flex-row-reverse">
              <div className="flex-1 p-6 lg:p-8 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Para Profissionais de Cuidado
                </h3>
                <p className="text-xs text-muted-foreground/80 mb-2">
                  Cuidadores de idosos, enfermeiros, técnicos de enfermagem, fisioterapeutas, nutricionistas e mais.
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mb-3">
                  Mostre seu valor, construa sua reputação e seja encontrado por quem precisa de você.
                </p>
                <ul className="space-y-2 flex-grow text-xs md:text-sm">
                  {caregiverFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs md:text-sm text-muted-foreground mt-3 leading-relaxed">
                  Cadastro gratuito. Você negocia diretamente com a família — sem intermediação e sem comissão sobre seus ganhos.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <Button
                    onClick={() => navigate("/para-cuidadores")}
                    variant="outline"
                    className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground rounded-xl py-2.5 px-5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                  >
                    Criar Perfil Grátis
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                  <span className="text-xs md:text-sm text-muted-foreground">Sem comissão sobre seus atendimentos</span>
                </div>
              </div>
              <div className="hidden md:block md:w-1/3 lg:w-2/5 relative min-h-[200px]">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card/80 z-10" />
                <img
                  src={caregiversImage}
                  alt="Profissional de saúde sorridente"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-accent/10 mix-blend-multiply" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default TwoPaths;
