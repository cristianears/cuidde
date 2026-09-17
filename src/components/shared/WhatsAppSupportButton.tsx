import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

const WHATSAPP_NUMBER = "5512988527053";
const WHATSAPP_MESSAGE =
  "Olá! Conheci a iCuide pelo site e gostaria de entender como encontrar um cuidador de idosos.";

const PUBLIC_PATHS = new Set([
  "/",
  "/sobre",
  "/para-cuidadores",
  "/cuidador-de-idosos-sao-jose-dos-campos",
  "/cuidador-de-idosos-jacarei",
  "/cuidador-de-idosos-vale-do-paraiba",
  "/cuidador-noturno-sao-jose-dos-campos",
  "/cuidadores-sjc-jacarei",
  "/buscar-cuidadores",
  "/login",
  "/onboarding",
]);

function shouldShowWhatsAppButton(pathname: string) {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return PUBLIC_PATHS.has(normalizedPath) || normalizedPath === "/blog" || normalizedPath.startsWith("/blog/");
}

const WhatsAppSupportButton = () => {
  const { pathname } = useLocation();

  if (!shouldShowWhatsAppButton(pathname)) return null;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Tire suas dúvidas sobre a iCuide pelo WhatsApp"
      className="group fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-[#20bd5a] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6 sm:px-5 sm:py-3"
    >
      <MessageCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
      <span className="hidden text-sm font-semibold sm:inline">Tire suas dúvidas</span>
    </a>
  );
};

export default WhatsAppSupportButton;
