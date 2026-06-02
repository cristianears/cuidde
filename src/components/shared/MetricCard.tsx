import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

const MetricCard = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
  compact = false,
}: MetricCardProps) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className={cn("min-w-0 overflow-hidden", className)}>
      <CardContent className={cn(compact ? "relative min-h-[72px] p-2.5 pr-9 sm:p-3 sm:pr-10" : "p-6")}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className={cn("font-medium text-muted-foreground leading-tight", compact ? "text-[11px] sm:text-xs" : "text-sm")}>{title}</p>
            <p className={cn("font-bold text-foreground whitespace-nowrap", compact ? "text-base mt-0.5" : "text-lg mt-1")}>{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                {isNegative && <TrendingDown className="w-4 h-4 text-red-600" />}
                <span
                  className={cn(
                    "text-sm font-medium",
                    isPositive && "text-emerald-600",
                    isNegative && "text-red-600",
                    !isPositive && !isNegative && "text-muted-foreground"
                  )}
                >
                  {isPositive && '+'}
                  {change}%
                </span>
                {changeLabel && (
                  <span className="text-sm text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className={cn("shrink-0 rounded-xl bg-primary/10 text-primary", compact ? "absolute right-2 top-2 p-1.5 sm:right-3 sm:top-3 sm:p-2" : "p-3")}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
