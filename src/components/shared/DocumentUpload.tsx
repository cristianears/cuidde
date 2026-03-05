import { Upload, FileText, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Document } from "@/data/mockData";

interface DocumentUploadProps {
  document: Document;
  onUpload?: (documentId: string, file: File) => void;
  onRemove?: (documentId: string) => void;
  className?: string;
  required?: boolean;
}

const DocumentUpload = ({ document, onUpload, onRemove, className, required = false }: DocumentUploadProps) => {
  const statusConfig = {
    pending: {
      icon: <Upload className="w-5 h-5" />,
      bgColor: 'bg-muted/50',
      borderColor: 'border-dashed border-muted-foreground/30',
      textColor: 'text-muted-foreground',
    },
    sent: {
      icon: <Loader2 className="w-5 h-5 animate-spin" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
    },
    approved: {
      icon: <Check className="w-5 h-5" />,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
    },
    rejected: {
      icon: <X className="w-5 h-5" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
    },
  };

  const config = statusConfig[document.status];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload?.(document.id, file);
    }
  };

  return (
    <div className={cn("rounded-xl border p-4", config.borderColor, config.bgColor, className)}>
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-lg", config.bgColor)}>
          <FileText className={cn("w-6 h-6", config.textColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h4 className="font-medium text-foreground">{document.name}</h4>
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium",
                required
                  ? "bg-orange-50 text-orange-700 border border-orange-200"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {required ? "Obrigatório" : "Opcional"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                config.bgColor,
                config.textColor
              )}
            >
              {config.icon}
              {document.status === 'pending' && 'Pendente'}
              {document.status === 'sent' && 'Em análise'}
              {document.status === 'approved' && 'Aprovado'}
              {document.status === 'rejected' && 'Rejeitado'}
            </span>
          </div>

          {document.uploadedAt && (
            <p className="text-sm text-muted-foreground mt-1">
              Enviado em {new Date(document.uploadedAt).toLocaleDateString('pt-BR')}
            </p>
          )}

          {document.status === 'rejected' && document.rejectionReason && (
            <div className="flex items-start gap-2 mt-2 p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{document.rejectionReason}</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          {document.status === 'pending' && (
            <label>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
              <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar
                </span>
              </Button>
            </label>
          )}

          {document.status === 'rejected' && (
            <label>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
              <Button variant="outline" size="sm" className="cursor-pointer border-red-200 text-red-700 hover:bg-red-50" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Reenviar
                </span>
              </Button>
            </label>
          )}

          {(document.status === 'sent' || document.status === 'approved') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove?.(document.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
