import { Instagram, Mail, Phone, MapPin } from "lucide-react";
import BrandMark from "@/components/shared/BrandMark";
const Footer = () => {
  return (
    <footer className="bg-footer text-footer-foreground py-14">
      <div className="container mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            <a
              href="/"
              className="mb-4 inline-block"
            >
              <BrandMark size={32} wordmarkClassName="text-footer-foreground" />
            </a>
            <p className="text-footer-foreground/70 mb-5 leading-relaxed text-xs md:text-sm">
              Conectando famílias a profissionais de cuidado com transparência, informação e segurança para decidir melhor.
            </p>
            <div className="flex gap-2.5">
              <span
                role="img"
                aria-label="Instagram"
                className="w-8 h-8 rounded-lg bg-footer-foreground/10 flex items-center justify-center"
              >
                <Instagram className="w-4 h-4" />
              </span>
            </div>
          </div>
          {/* For Families */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Para Famílias</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="/#como-funciona"
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Como Funciona
                </a>
              </li>
              <li>
                <a
                  href="/onboarding?type=family"
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Buscar profissionais
                </a>
              </li>
              <li>
                <a
                  href="/#planos"
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Planos e preços
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Guias e blog
                </a>
              </li>
              <li>
                <a
                  href="/#faq"
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Perguntas frequentes
                </a>
              </li>
            </ul>
          </div>
          {/* For Professionals */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Para Profissionais</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="/onboarding?type=caregiver"
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Criar perfil grátis
                </a>
              </li>
              <li>
                <a
                  href="/para-cuidadores#como-funciona-cuidador"
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Como funciona
                </a>
              </li>
              <li>
                <a
                  href="/blog/como-montar-perfil-de-cuidador"
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Dicas para seu perfil
                </a>
              </li>
              <li>
                <a
                  href="/para-cuidadores#duvidas-cuidadores"
                  className="text-xs text-footer-foreground/70 hover:text-footer-foreground transition-colors"
                >
                  Perguntas frequentes
                </a>
              </li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-xs text-footer-foreground/70">
                <Mail className="w-4 h-4 flex-shrink-0" />
                contato@icuide.com.br
              </li>
              <li className="flex items-center gap-2.5 text-xs text-footer-foreground/70">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:+5512988527053" className="hover:text-footer-foreground transition-colors">
                  (12) 98852-7053
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-xs text-footer-foreground/70">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                São José dos Campos, SP - Brasil
              </li>
            </ul>
          </div>
        </div>
        {/* Bottom */}
        <div className="pt-6 border-t border-footer-foreground/10 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-footer-foreground/60 text-center md:text-left">© 2026 icuide. Todos os direitos reservados.</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <a
              href="/terms/"
              className="text-xs text-footer-foreground/60 hover:text-footer-foreground transition-colors"
            >
              Termos de uso
            </a>
            <a
              href="/privacy/"
              className="text-xs text-footer-foreground/60 hover:text-footer-foreground transition-colors"
            >
              Política de privacidade
            </a>
            <a
              href="/cookies/"
              className="text-xs text-footer-foreground/60 hover:text-footer-foreground transition-colors"
            >
              Política de cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
