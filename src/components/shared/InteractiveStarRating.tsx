import { useState, useRef } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveStarRatingProps {
  value: number;       // 0 = não avaliado, 0.5–5.0
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-8 h-8",
};

const InteractiveStarRating = ({
  value,
  onChange,
  size = "md",
  className,
}: InteractiveStarRatingProps) => {
  const [hovered, setHovered] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detecta posição do mouse dentro de uma estrela para meia vs. inteira
  function getStarValue(starIndex: number, e: React.MouseEvent<HTMLSpanElement>): number {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = starIndex - 0.5;
    return x < rect.width / 2 ? Math.max(1, half) : starIndex;
  }

  const display = hovered > 0 ? hovered : value;

  return (
    <div
      ref={containerRef}
      className={cn("flex items-center gap-0.5", className)}
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const filled = display >= starIndex;
        const half = !filled && display >= starIndex - 0.5;

        return (
          <span
            key={starIndex}
            className="relative cursor-pointer select-none"
            onMouseMove={(e) => setHovered(getStarValue(starIndex, e))}
            onClick={(e) => onChange(getStarValue(starIndex, e))}
          >
            {/* Estrela base (vazia) */}
            <Star
              className={cn(
                sizeClasses[size],
                "text-muted-foreground/30 transition-colors"
              )}
            />
            {/* Preenchimento: inteiro ou metade */}
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: half ? "50%" : "100%" }}
              >
                <Star
                  className={cn(
                    sizeClasses[size],
                    "text-amber-400 fill-amber-400 transition-colors"
                  )}
                />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default InteractiveStarRating;
