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
  const id = useId().replace(/:/g, "");
  const goldId = `identity-seal-gold-${id}`;
  const ribbonId = `identity-seal-ribbon-${id}`;

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
              size === "sm" ? "h-[68px] w-14" : "h-[82px] w-[68px]",
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
                <radialGradient id={goldId} cx="40%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#fff2bb" />
                  <stop offset="32%" stopColor="#f3c45e" />
                  <stop offset="68%" stopColor="#c47a14" />
                  <stop offset="100%" stopColor="#8b4b08" />
                </radialGradient>
                <linearGradient id={ribbonId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f0b23d" />
                  <stop offset="100%" stopColor="#b65c08" />
                </linearGradient>
              </defs>

              <path
                d="M31 73 L47 73 L40 116 L31 101 L17 109 Z"
                fill={`url(#${ribbonId})`}
              />
              <path
                d="M53 73 L69 73 L83 109 L69 101 L60 116 Z"
                fill={`url(#${ribbonId})`}
              />
              <polygon points={SEAL_POINTS} fill={`url(#${goldId})`} />
              <circle cx="50" cy="48" r="34" fill="#fff7db" stroke="#fffdf4" strokeWidth="3" />
              <circle cx="50" cy="48" r="29" fill="none" stroke="#9b5a0d" strokeWidth="1.7" />
              <circle cx="50" cy="48" r="25" fill="none" stroke="#d79a31" strokeWidth="0.8" />

              <text
                x="50"
                y="43"
                textAnchor="middle"
                fontFamily="Arial, sans-serif"
                fontSize="10"
                fontWeight="800"
                fill="#3d2a12"
              >
                Identidade
              </text>
              <text
                x="50"
                y="56"
                textAnchor="middle"
                fontFamily="Arial, sans-serif"
                fontSize="10"
                fontWeight="800"
                fill="#3d2a12"
              >
                Verificada
              </text>
              <path d="M38 63 L42 66 L50 59 L58 66 L62 63" fill="none" stroke="#9b5a0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Selo {label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
