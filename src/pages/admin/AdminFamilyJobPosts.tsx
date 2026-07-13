import { useEffect, useMemo, useState } from "react";
import { Briefcase, CheckCircle2, Copy, MapPin, Phone, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminFamilyJobPosts,
  useAdminMarkFamilyJobPostPosted,
  type AdminFamilyJobPostRow,
} from "@/hooks/useAdmin";
import {
  buildFamilyJobOutreachText,
  buildFamilyJobSummary,
  familyJobCareTypeLabel,
} from "@/lib/family-job-post";

const AdminFamilyJobPosts = () => {
  const { data: rows = [], isLoading } = useAdminFamilyJobPosts();
  const postedCount = rows.filter((row) => row.admin_posted_at).length;
  const pendingCount = rows.length - postedCount;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="admin" userName="Administrador" />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Vagas"
          description="Necessidades informadas pelas famílias para apoiar a divulgação e atrair cuidadores."
        />

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total de vagas</p>
              <p className="mt-1 text-2xl font-semibold">{isLoading ? "..." : rows.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Aguardando divulgação</p>
              <p className="mt-1 text-2xl font-semibold">{isLoading ? "..." : pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Postadas</p>
              <p className="mt-1 text-2xl font-semibold">{isLoading ? "..." : postedCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Vagas para divulgação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <p className="text-sm text-muted-foreground">Carregando vagas...</p>}

            {!isLoading && rows.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma família cadastrou uma necessidade de cuidado ainda.
              </p>
            )}

            {rows.map((row) => (
              <AdminFamilyJobPostItem key={row.family_id} row={row} />
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

function AdminFamilyJobPostItem({ row }: { row: AdminFamilyJobPostRow }) {
  const generatedText = useMemo(() => buildFamilyJobOutreachText(row), [row]);
  const [text, setText] = useState(generatedText);
  const markPosted = useAdminMarkFamilyJobPostPosted();
  const location = [row.neighborhood, row.city, row.state].filter(Boolean).join(", ");
  const careType = familyJobCareTypeLabel(row.care_type);
  const summary = buildFamilyJobSummary(row);
  const posted = Boolean(row.admin_posted_at);

  useEffect(() => {
    setText(generatedText);
  }, [generatedText]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    toast.success("Texto copiado.");
  };

  const handlePostedToggle = () => {
    markPosted.mutate({ familyId: row.family_id, posted: !posted });
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {row.family_name ?? "Família sem nome"}
            </h3>
            <Badge variant={row.is_active ? "default" : "outline"}>
              {row.is_active ? "Ativa" : "Inativa"}
            </Badge>
            {posted && <Badge variant="secondary">Postada</Badge>}
            {careType && <Badge variant="outline">{careType}</Badge>}
          </div>
          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-3">
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location}
              </span>
            )}
            {row.family_phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {row.family_phone}
              </span>
            )}
            <span>Atualizado em {new Date(row.updated_at).toLocaleDateString("pt-BR")}</span>
            {row.admin_posted_at && (
              <span>Postado em {new Date(row.admin_posted_at).toLocaleDateString("pt-BR")}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
          <Button
            type="button"
            variant={posted ? "secondary" : "default"}
            size="sm"
            onClick={handlePostedToggle}
            disabled={markPosted.isPending}
            className="gap-2"
          >
            {posted ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {posted ? "Desmarcar" : "Postado"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            Copiar
          </Button>
        </div>
      </div>

      {summary && <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{summary}</p>}

      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="min-h-28 text-sm"
        aria-label="Texto de divulgação editável"
      />
    </div>
  );
}

export default AdminFamilyJobPosts;
