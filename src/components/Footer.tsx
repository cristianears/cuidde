import { Heart, Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
const Footer = () => {
  const navigate = useNavigate();
  const goTo = (hash: string) => {
    window.location.hash = hash;
  };
  return (
    <footer className="bg-footer text-footer-foreground py-14">
      <div className="container mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 mb-4"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
              </div>
              <span className="text-base font-semibold text-footer-foreground">cuidde</span>
            </button>
            <p className="text-footer-foreground/70 mb-5 leading-relaxed text-xs md:text-sm">
              Conectando famílias a profissionais de cuidado com transparência, informação e segurança para decidir melhor.
            </p>
            <div className="flex gap-2.5">
              <a
                href="#"
                aria-label="Facebook"
                className="w-8 h-8 rounded-lg bg-footer-foreground/10 hover:bg-footer-foreground/20 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-8 h-8 rounded-lg bg-footer-foreground/10 hover:bg-footer-foreground/20 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-lg bg-footer-foreground/10 hover:bg-footer-foreground/20 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
          {/* For Families */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Para Famílias</h4>
            <ul className="space-y-3">
              <li>
                <button
                  type="button"
                  onClick={() => goTo("#como-funciona")}
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Como Funciona
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/onboarding?type=family")}
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Buscar profissionais
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goTo("#planos")}
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Planos e preços
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goTo("#faq")}
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Perguntas frequentes
                </button>
              </li>
            </ul>
          </div>
          {/* For Professionals */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Para Profissionais</h4>
            <ul className="space-y-3">
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/onboarding?type=caregiver")}
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Criar perfil grátis
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goTo("#como-funciona")}
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Como funciona
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goTo("#beneficios")}
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Dicas para seu perfil
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goTo("#faq")}
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Perguntas frequentes
                </button>
              </li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-xs text-footer-foreground/70">
                <Mail className="w-4 h-4 flex-shrink-0" />
                contato@cuidde.com.br
              </li>
              <li className="flex items-center gap-2.5 text-xs text-footer-foreground/70">
                <Phone className="w-4 h-4 flex-shrink-0" />
                (11) 99999-9999
              </li>
              <li className="flex items-center gap-2.5 text-xs text-footer-foreground/70">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                São Paulo, SP — Brasil
              </li>
            </ul>
          </div>
        </div>
        {/* Bottom */}
        <div className="pt-6 border-t border-footer-foreground/10 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-footer-foreground/60 text-center md:text-left">© 2026 cuidde. Todos os direitos reservados.</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="text-xs text-footer-foreground/60 hover:text-footer-foreground transition-colors"
            >
              Termos de uso
            </button>
            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="text-xs text-footer-foreground/60 hover:text-footer-foreground transition-colors"
            >
              Política de privacidade
            </button>
            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="text-xs text-footer-foreground/60 hover:text-footer-foreground transition-colors"
            >
              Política de cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
