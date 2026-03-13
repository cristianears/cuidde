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
    <Card className={cn("", className)}>
      <CardContent className={cn(compact ? "p-3" : "p-6")}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={cn("font-medium text-muted-foreground", compact ? "text-xs" : "text-sm")}>{title}</p>
            <p className={cn("font-bold text-foreground", compact ? "text-xl mt-0.5" : "text-2xl mt-1")}>{value}</p>
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
            <div className={cn("rounded-xl bg-primary/10 text-primary", compact ? "p-2" : "p-3")}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
