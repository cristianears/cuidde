import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const StarRating = ({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = true,
  className,
}: StarRatingProps) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }).map((_, index) => {
          const filled = index < Math.floor(rating);
          const partial = !filled && index < rating;

          return (
            <Star
              key={index}
              className={cn(
                sizeClasses[size],
                "transition-colors",
                filled
                  ? "text-amber-400 fill-amber-400"
                  : partial
                  ? "text-amber-400 fill-amber-200"
                  : "text-muted-foreground/30"
              )}
            />
          );
        })}
      </div>
      {showValue && (
        <span className={cn("font-medium text-foreground ml-1", textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
