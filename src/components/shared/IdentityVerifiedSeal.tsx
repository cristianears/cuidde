import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useId } from "react";

const SEAL_POINTS = Array.from({ length: 48 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 48 - Math.PI / 2;
  const radius = index % 2 === 0 ? 45 : 39;
  const x = 50 + Math.cos(angle) * radius;
  const y = 48 + Math.sin(angle) * radius;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}).join(" ");

interface IdentityVerifiedSealProps {
  className?: string;
  size?: "sm" | "md";
}

export function IdentityVerifiedSeal({
  className,
  size = "sm",
}: IdentityVerifiedSealProps) {
  const label = "Identidade Verificada";
  const gradientSuffix = useId().replace(/:/g, "");

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Selo ${label}`}
            title={`Selo ${label}`}
            className={cn(
              "absolute z-20 block shrink-0 rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2",
              size === "sm" ? "h-7 w-6" : "h-8 w-7",
              className,
            )}
          >
            <svg
              viewBox="0 0 100 118"
              role="img"
              aria-hidden="true"
              className="h-full w-full drop-shadow-[0_3px_5px_rgba(92,54,10,0.32)]"
            >
              <defs>
                <radialGradient id={`seal-gold-${gradientSuffix}`} cx="36%" cy="28%" r="76%">
                  <stop offset="0%" stopColor="#FFFACD" />
                  <stop offset="34%" stopColor="#DAA520" />
                  <stop offset="70%" stopColor="#B87916" />
                  <stop offset="100%" stopColor="#8B4513" />
                </radialGradient>
                <radialGradient id={`seal-face-${gradientSuffix}`} cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stopColor="#8B4513" />
                  <stop offset="22%" stopColor="#DAA520" />
                  <stop offset="55%" stopColor="#FFFACD" />
                  <stop offset="82%" stopColor="#DAA520" />
                  <stop offset="100%" stopColor="#8B4513" />
                </radialGradient>
                <linearGradient id={`seal-ribbon-${gradientSuffix}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFACD" />
                  <stop offset="42%" stopColor="#DAA520" />
                  <stop offset="100%" stopColor="#8B4513" />
                </linearGradient>
                <filter id={`seal-glow-${gradientSuffix}`} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="1.15" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path
                d="M31 73 L47 73 L40 116 L31 101 L17 109 Z"
                fill={`url(#seal-ribbon-${gradientSuffix})`}
                stroke="#8B4513"
                strokeWidth="1.6"
              />
              <path
                d="M53 73 L69 73 L83 109 L69 101 L60 116 Z"
                fill={`url(#seal-ribbon-${gradientSuffix})`}
                stroke="#8B4513"
                strokeWidth="1.6"
              />
              <polygon
                points={SEAL_POINTS}
                fill={`url(#seal-gold-${gradientSuffix})`}
                stroke="#8B4513"
                strokeLinejoin="round"
                strokeWidth="1.4"
              />
              <circle cx="50" cy="48" r="34" fill={`url(#seal-face-${gradientSuffix})`} stroke="#8B4513" strokeWidth="2.4" />
              <circle cx="50" cy="48" r="29" fill="none" stroke="#FFFACD" strokeWidth="2" opacity="0.85" />
              <circle cx="50" cy="48" r="22" fill="none" stroke="#8B4513" strokeWidth="1.2" opacity="0.8" />
              <path
                d="M23 45 C34 25 61 22 76 40"
                fill="none"
                stroke="#FFFACD"
                strokeLinecap="round"
                strokeWidth="2.4"
                opacity="0.75"
              />
              <g filter={`url(#seal-glow-${gradientSuffix})`}>
                <path d="M27 31 L29 37 L35 39 L29 41 L27 47 L25 41 L19 39 L25 37 Z" fill="#FFFFFF" opacity="0.95" />
                <path d="M72 34 L74 40 L80 42 L74 44 L72 50 L70 44 L64 42 L70 40 Z" fill="#FFFFFF" opacity="0.9" />
                <path d="M68 65 L70 70 L75 72 L70 74 L68 79 L66 74 L61 72 L66 70 Z" fill="#FFFFFF" opacity="0.82" />
              </g>
            </svg>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Selo {label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
