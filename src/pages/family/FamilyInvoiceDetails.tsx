import { ArrowLeft, Calendar, CreditCard, User, FileText, Loader2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import AppSidebar from "@/components/shared/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { useInvoice } from "@/hooks/useInvoices";
import type { InvoiceStatus } from "@/types/database";

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  paid:    { label: "Paga",       className: "bg-emerald-100 text-emerald-700" },
  pending: { label: "Pendente",   className: "bg-amber-100 text-amber-700" },
  open:    { label: "Em aberto",  className: "bg-muted text-muted-foreground" },
  overdue: { label: "Vencida",    className: "bg-red-100 text-red-700" },
};

const planNames: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  annual: "Anual",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateString: string) => {
  // date-only (YYYY-MM-DD) — evita shift de timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split("-");
    return `${d}/${m}/${y}`;
  }
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const FamilyInvoiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();
  const { data: invoice, isLoading } = useInvoice(id ?? "");

  const sidebarProps = {
    role: "family" as const,
    userName: familyProfileData?.profiles?.full_name ?? user?.email ?? "",
    userPhoto: familyProfileData?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture,
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar {...sidebarProps} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar {...sidebarProps} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Fatura não encontrada</h2>
            <p className="text-muted-foreground mb-4">
              A fatura que você está procurando não existe.
            </p>
            <Button asChild>
              <Link to="/family/invoices">Voltar para Faturas</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const status = statusConfig[invoice.status];

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar {...sidebarProps} />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/family/invoices")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Faturas
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Fatura {invoice.invoice_ref ?? invoice.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-muted-foreground mt-1">
                {invoice.period ? `Detalhes da cobrança referente a ${invoice.period}` : "Detalhes da fatura"}
              </p>
            </div>
            <Badge className={`${status.className} text-sm px-3 py-1`}>
              {status.label}
            </Badge>
          </div>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* Detalhes da Fatura */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Detalhes da Fatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Plano contratado</p>
                  <p className="font-medium">{invoice.plan ? (planNames[invoice.plan] ?? invoice.plan) : "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="font-medium">{invoice.period ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(invoice.amount)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={status.className}>{status.label}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Datas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Data de vencimento</p>
                  <p className="font-medium">
                    {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Data de pagamento</p>
                  <p className="font-medium">
                    {invoice.paid_at ? formatDate(invoice.paid_at) : "Aguardando pagamento"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Pagador */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Dados do Pagador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">
                    {familyProfileData?.profiles?.full_name ?? "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium">{user?.email ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Link Stripe */}
          {invoice.stripe_invoice_id && (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  <span>ID Stripe: <span className="font-mono">{invoice.stripe_invoice_id}</span></span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default FamilyInvoiceDetails;
