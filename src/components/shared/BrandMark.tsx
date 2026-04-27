import { cn } from "@/lib/utils"

interface BrandMarkProps {
  /** Tamanho do logo em px (default 40). O wordmark escala proporcionalmente. */
  size?: number
  /** Exibir a palavra "ditti" ao lado do logo. */
  showWordmark?: boolean
  /** Classe do container. */
  className?: string
  /** Classe do wordmark (para trocar cor em fundos escuros, por ex.). */
  wordmarkClassName?: string
}

export default function BrandMark({
  size = 40,
  showWordmark = true,
  className,
  wordmarkClassName,
}: BrandMarkProps) {
  const fontSize = Math.round(size * 0.5)

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src="/logo.png"
        alt="ditti"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span
          className={cn(
            "font-dm-sans font-bold lowercase text-foreground",
            wordmarkClassName,
          )}
          style={{ fontSize, letterSpacing: "0" }}
        >
          ditti
        </span>
      )}
    </div>
  )
}
