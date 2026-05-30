import { Search, Heart, UserCheck, MessageSquareHeart } from "lucide-react";
const steps = [
  {
    icon: Search,
    step: "01",
    title: "Explore os perfis",
    description:
      "Navegue por perfis e avaliações. Salve seus favoritos e compare com calma antes de avançar.",
  },
  {
    icon: Heart,
    step: "02",
    title: "Demonstre interesse",
    description:
      "Você envia uma solicitação de contato pelo portal para os profissionais que deseja conhecer melhor.",
  },
  {
    icon: UserCheck,
    step: "03",
    title: "O profissional responde",
    description:
      "O profissional recebe sua solicitação e decide se aceita o contato. Sem pressão para nenhum dos lados.",
  },
  {
    icon: MessageSquareHeart,
    step: "04",
    title: "Converse e decida",
    description:
      "Após o aceite, o chat é liberado. Converse, tire dúvidas e combine os detalhes diretamente com o profissional.",
  },
];
const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-16 md:py-20 relative overflow-hidden">
      {/* Echo gradient background */}
      <div className="absolute inset-0 bg-echo-blue opacity-50" />
      <div className="container mx-auto px-6 md:px-10 relative">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3 tracking-tight">
            Como funciona
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Em poucos passos, você encontra o profissional certo para cuidar de quem você ama.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((item, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-6 h-6" />
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
                )}
              </div>
              <span className="inline-block text-xs font-bold text-primary mb-2 tracking-wider">
                PASSO {item.step}
              </span>
              <h3 className="text-sm font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-xs md:text-sm leading-relaxed max-w-xs mx-auto">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="max-w-3xl mx-auto mt-10 text-center">
          <p className="text-muted-foreground leading-relaxed text-xs md:text-sm">
            A icuide facilita a conexão entre famílias e profissionais de cuidado. A negociação de valores, modelo de
            contratação e vínculo profissional acontece diretamente entre as partes — sem intermediação da plataforma.
          </p>
        </div>
      </div>
    </section>
  );
};
export default HowItWorks;
