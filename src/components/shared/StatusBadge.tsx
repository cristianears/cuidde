import { cn } from "@/lib/utils";
import { Check, Clock, AlertCircle, X, Loader2 } from "lucide-react";

type StatusType = 'pending' | 'analyzing' | 'sent' | 'approved' | 'verified' | 'rejected' | 'open' | 'investigating' | 'resolved' | 'dismissed' | 'active' | 'finished';

type SizeType = 'sm' | 'md';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  showIcon?: boolean;
  size?: SizeType;
}

const statusConfig: Record<StatusType, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  analyzing: {
    label: 'Em análise',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  sent: {
    label: 'Enviado',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  approved: {
    label: 'Aprovado',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <Check className="w-3.5 h-3.5" />,
  },
  verified: {
    label: 'Verificado',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <Check className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: 'Rejeitado',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <X className="w-3.5 h-3.5" />,
  },
  open: {
    label: 'Aberta',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  investigating: {
    label: 'Investigando',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  resolved: {
    label: 'Resolvida',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <Check className="w-3.5 h-3.5" />,
  },
  dismissed: {
    label: 'Arquivada',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: <X className="w-3.5 h-3.5" />,
  },
  active: {
    label: 'Ativo',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <Check className="w-3.5 h-3.5" />,
  },
  finished: {
    label: 'Finalizado',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: <Check className="w-3.5 h-3.5" />,
  },
};

const sizeClasses: Record<SizeType, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

const StatusBadge = ({ status, className, showIcon = true, size = "md" }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        sizeClasses[size],
        config.className,
        className
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
};

export default StatusBadge;
