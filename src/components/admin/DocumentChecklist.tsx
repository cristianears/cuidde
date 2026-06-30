import { useEffect, useState } from "react";
import {
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
  ThumbsUp,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminDocumentUrl, useAdminApproveDocument, useAdminMarkDocumentIllegible } from "@/hooks/useAdmin";
import type { AdminDocumentRow } from "@/hooks/useAdmin";

const REVIEW_DOCS = [
  { type: "rg_cnh", label: "RG ou CNH" },
  { type: "curriculo", label: "Currículo" },
  { type: "certificacao", label: "Certificações" },
  { type: "antecedentes", label: "Antecedentes Criminais" },
];

type DisplayStatus = "enviado" | "ausente" | "ilegível" | "aprovado";

function getDisplayStatus(doc: AdminDocumentRow | undefined): DisplayStatus {
  if (!doc || !doc.uploaded_at) return "ausente";
  if (doc.status === "approved") return "aprovado";
  if (doc.status === "sent") return "enviado";
  if (doc.status === "rejected") return "ilegível";
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
};

interface DocumentChecklistProps {
  caregiverId: string;
  documents: AdminDocumentRow[];
}

const DocumentChecklist = ({ caregiverId, documents }: DocumentChecklistProps) => {
  const [previewLabel, setPreviewLabel] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const documentUrlMutation = useAdminDocumentUrl();
  const approveDoc = useAdminApproveDocument();
  const markIllegible = useAdminMarkDocumentIllegible();

  // Revoga blob URL quando troca ou desmonta
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleViewDocument = async (doc: AdminDocumentRow, label: string) => {
    if (!doc.file_url) return;
    setPreviewLabel(label);
    setPreviewUrl(null);
    setPreviewMime(null);
    try {
      const signedUrl = await documentUrlMutation.mutateAsync(doc.file_url);
      // Baixa como blob para contornar Content-Disposition: attachment do Storage
      const res = await fetch(signedUrl);
      if (!res.ok) throw new Error('Falha ao baixar documento');
      const blob = await res.blob();
      setPreviewMime(blob.type);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setPreviewUrl(null);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewLabel(null);
    setPreviewUrl(null);
    setPreviewMime(null);
  };

  return (
    <>
      <div className="space-y-2">
        {REVIEW_DOCS.map((req) => {
          const doc = documents.find(
            (d) => d.type === req.type || (req.type === "rg_cnh" && d.type === "rg")
          );
          const displayStatus = getDisplayStatus(doc);
          const config = statusDisplay[displayStatus];
          const isActionable = doc && displayStatus === "enviado";
          const isApproving = approveDoc.isPending && approveDoc.variables?.documentId === doc?.id;
          const isMarking = markIllegible.isPending && markIllegible.variables?.documentId === doc?.id;

          return (
            <div
              key={req.type}
              className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {req.label}
                  </p>
                  {doc?.uploaded_at && (
                    <p className="text-[11px] text-muted-foreground">
                      Enviado em{" "}
                      {new Date(doc.uploaded_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  {doc?.rejection_reason && (
                    <p className="text-[11px] text-destructive mt-0.5">
                      {doc.rejection_reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${config.className}`}
                >
                  {config.icon}
                  {config.label}
                </span>

                {/* Visualizar */}
                {doc?.file_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleViewDocument(doc, req.label)}
                    disabled={documentUrlMutation.isPending}
                    title="Visualizar documento"
                  >
                    {documentUrlMutation.isPending && previewLabel === req.label ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                )}

                {/* Aprovar documento */}
                {isActionable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={() => approveDoc.mutate({ documentId: doc.id, caregiverId })}
                    disabled={isApproving || isMarking}
                    title="Documento OK"
                  >
                    {isApproving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-4 h-4" />
                    )}
                  </Button>
                )}

                {/* Marcar ilegível */}
                {isActionable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => markIllegible.mutate({ documentId: doc.id, caregiverId })}
                    disabled={isApproving || isMarking}
                    title="Documento ilegível"
                  >
                    {isMarking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Preview Modal */}
      <Dialog open={!!previewLabel} onOpenChange={handleClosePreview}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{previewLabel}</DialogTitle>
          </DialogHeader>
          {previewUrl ? (
            <div className="flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-auto rounded-xl bg-muted/30">
              {previewMime?.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt={previewLabel ?? "Documento"}
                  className="max-w-full max-h-[65vh] object-contain rounded-lg"
                />
              ) : (
                <iframe
                  src={previewUrl}
                  title={previewLabel ?? "Documento"}
                  className="w-full h-[65vh] rounded-lg border-0"
                />
              )}
            </div>
          ) : documentUrlMutation.isPending ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : documentUrlMutation.isError ? (
            <div className="flex items-center justify-center h-64 rounded-xl bg-muted/50 border-2 border-dashed border-border">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Erro ao carregar documento</p>
                <p className="text-xs mt-1">{documentUrlMutation.error?.message}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentChecklist;
