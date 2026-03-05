import { useState } from "react";
import {
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Document } from "@/data/mockData";

const REQUIRED_DOCS = [
  { type: "rg_cnh", label: "RG ou CNH" },
  { type: "comprovante_endereco", label: "Comprovante de Endereço" },
  { type: "curriculo", label: "Currículo" },
  { type: "certificacao", label: "Certificações" },
  { type: "antecedentes", label: "Antecedentes Criminais" },
];

type DisplayStatus = "enviado" | "ausente" | "ilegível" | "aprovado" | "reprovado";

function getDisplayStatus(doc: Document | undefined): DisplayStatus {
  if (!doc || !doc.uploadedAt) return "ausente";
  if (doc.status === "approved") return "aprovado";
  if (doc.status === "sent") return "enviado";
  if (doc.status === "rejected") {
    if (doc.rejectionReason?.toLowerCase().includes("ilegível") || doc.rejectionReason?.toLowerCase().includes("borrada")) {
      return "ilegível";
    }
    return "reprovado";
  }
  return "ausente";
}

const statusDisplay: Record<DisplayStatus, { label: string; className: string; icon: React.ReactNode }> = {
  enviado: {
    label: "Enviado",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  ausente: {
    label: "Ausente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  "ilegível": {
    label: "Ilegível",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  aprovado: {
    label: "Aprovado",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  reprovado: {
    label: "Reprovado",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

interface DocumentChecklistProps {
  documents: Document[];
}

const DocumentChecklist = ({ documents }: DocumentChecklistProps) => {
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-2">
        {REQUIRED_DOCS.map((req) => {
          const doc = documents.find(
            (d) => d.type === req.type || (req.type === "rg_cnh" && d.type === "rg")
          );
          const displayStatus = getDisplayStatus(doc);
          const config = statusDisplay[displayStatus];

          return (
            <div
              key={req.type}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4.5 h-4.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {req.label}
                  </p>
                  {doc?.uploadedAt && (
                    <p className="text-[11px] text-muted-foreground">
                      Enviado em{" "}
                      {new Date(doc.uploadedAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  {doc?.rejectionReason && (
                    <p className="text-[11px] text-destructive mt-0.5">
                      {doc.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${config.className}`}
                >
                  {config.icon}
                  {config.label}
                </span>
                {doc?.uploadedAt && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => setPreviewDoc(req.label)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewDoc}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64 rounded-xl bg-muted/50 border-2 border-dashed border-border">
            <div className="text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Pré-visualização do documento</p>
              <p className="text-xs mt-1">
                Arquivo mockado — integração futura com storage
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentChecklist;
