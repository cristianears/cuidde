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
      <CardContent className={cn(compact ? "p-2.5 sm:p-3" : "p-6")}>
        <div className={cn("min-w-0", compact ? "space-y-1" : "flex items-center justify-between gap-2")}>
          <div className="min-w-0 flex-1">
            <div className={cn(compact && "flex min-w-0 items-start justify-between gap-1")}>
              <p className={cn("font-medium text-muted-foreground leading-tight", compact ? "text-[10px] sm:text-xs" : "text-sm")}>{title}</p>
              {icon && compact && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg]:h-3.5 [&_svg]:w-3.5">
                  {icon}
                </div>
              )}
            </div>
            <p className={cn("font-bold text-foreground whitespace-nowrap", compact ? "text-base leading-none" : "text-lg mt-1")}>{value}</p>
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
          {icon && !compact && (
            <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
