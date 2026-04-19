import { Upload, FileText, Check, X, AlertCircle, Clock, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CaregiverDocument } from "@/types/database";

interface DocumentUploadProps {
  document: CaregiverDocument;
  label: string;
  hint?: string;
  onUpload?: (docType: CaregiverDocument["type"], file: File) => void;
  onRemove?: (doc: CaregiverDocument) => void;
  className?: string;
}

const DocumentUpload = ({ document, label, hint, onUpload, onRemove, className }: DocumentUploadProps) => {
  const statusConfig = {
    pending: {
      icon: <Upload className="w-5 h-5" />,
      bgColor: 'bg-muted/50',
      borderColor: 'border-dashed border-muted-foreground/30',
      textColor: 'text-muted-foreground',
    },
    sent: {
      icon: <Clock className="w-5 h-5" />,
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

  const isRgCnh = document.type === 'rg_cnh';
  const config = statusConfig[document.status];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload?.(document.type, file);
      // Reset input so same file can be re-selected
      e.target.value = "";
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
            <h4 className="font-medium text-foreground">{label}</h4>
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium",
                document.required
                  ? "bg-orange-50 text-orange-700 border border-orange-200"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {document.required ? "Obrigatório" : "Opcional"}
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
              {document.status === 'sent' && 'Enviado'}
              {document.status === 'approved' && (isRgCnh ? 'Legível' : 'Aprovado')}
              {document.status === 'rejected' && 'Rejeitado'}
            </span>
          </div>

          {hint && document.status === 'pending' && (
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
          )}

          {document.file_name && document.status !== 'pending' && (
            <p className="text-sm text-muted-foreground mt-1">{document.file_name}</p>
          )}

          {document.uploaded_at && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Enviado em {new Date(document.uploaded_at).toLocaleDateString('pt-BR')}
            </p>
          )}

          {document.status === 'rejected' && document.rejection_reason && (
            <div className="flex items-start gap-2 mt-2 p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{document.rejection_reason}</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex flex-col gap-1.5">
          {(document.status === 'pending' || document.status === 'rejected') && (() => {
            const isRejected = document.status === 'rejected';
            const btnClass = isRejected
              ? "cursor-pointer border-red-200 text-red-700 hover:bg-red-50"
              : "cursor-pointer";
            return (
              <>
                {/* Escolher arquivo */}
                <label>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                  />
                  <Button variant="outline" size="sm" className={btnClass} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {isRejected ? "Reenviar" : "Arquivo"}
                    </span>
                  </Button>
                </label>
                {/* Tirar foto — abre câmera traseira em mobile */}
                <label>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png"
                    capture="environment"
                    onChange={handleFileSelect}
                  />
                  <Button variant="outline" size="sm" className={btnClass} asChild>
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      Câmera
                    </span>
                  </Button>
                </label>
              </>
            );
          })()}

          {(document.status === 'sent' || document.status === 'approved') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove?.(document)}
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
