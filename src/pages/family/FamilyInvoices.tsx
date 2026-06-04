import { FileText, Eye, Receipt, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { useInvoices } from "@/hooks/useInvoices";
import { useSubscription } from "@/hooks/useSubscription";
import { getInvoicePlanLabel } from "@/lib/invoice-plan";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft:         { label: "Cancelada",  className: "bg-red-100 text-red-700" },
  open:          { label: "Pendente",   className: "bg-amber-100 text-amber-700" },
  paid:          { label: "Paga",       className: "bg-emerald-100 text-emerald-700" },
  void:          { label: "Cancelada",  className: "bg-red-100 text-red-700" },
  uncollectible: { label: "Cancelada",  className: "bg-red-100 text-red-700" },
  pending:       { label: "Pendente",   className: "bg-amber-100 text-amber-700" },
  overdue:       { label: "Vencida",    className: "bg-red-100 text-red-700" },
};

const fallbackStatus = { label: "—", className: "bg-gray-100 text-gray-500" };

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

const FamilyInvoices = () => {
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();
  const { data: invoices, isLoading } = useInvoices();
  const { subscriptionStatus, cancelAtPeriodEnd, currentPeriodEnd } = useSubscription();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="family"
        userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""}
        userPhoto={familyProfileData?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture}
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PageHeader title="Faturas" description="Histórico de cobranças da sua assinatura na icuide">
          <Button variant="outline" asChild>
            <Link to="/family/billing">Ver planos</Link>
          </Button>
        </PageHeader>

        <div className="max-w-5xl space-y-4">
          {subscriptionStatus === "canceled" && (
            <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                Sua assinatura foi cancelada. Você não receberá novas faturas.{" "}
                <Link to="/family/billing" className="font-medium underline">
                  Ver planos
                </Link>
              </div>
            </div>
          )}

          {subscriptionStatus === "active" && cancelAtPeriodEnd && (
            <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                Sua assinatura será cancelada
                {currentPeriodEnd && (
                  <> em <strong>{new Date(currentPeriodEnd).toLocaleDateString("pt-BR")}</strong></>
                )}
                . Nenhuma nova fatura será gerada após essa data.{" "}
                <Link to="/family/billing" className="font-medium underline">
                  Reativar
                </Link>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : invoices && invoices.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {invoices.map((invoice) => {
                  const status = statusConfig[invoice.status] ?? fallbackStatus;

                  return (
                    <Card key={invoice.id}>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">Fatura</p>
                            <p className="break-all font-mono text-sm text-foreground">
                              {invoice.invoice_ref ?? "—"}
                            </p>
                          </div>
                          <Badge className={`${status.className} shrink-0`}>
                            {status.label}
                          </Badge>
                        </div>

                        <div className="flex items-end justify-between gap-3 rounded-lg bg-muted/40 p-3">
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Plano</p>
                            <p className="font-medium text-foreground">
                              {getInvoicePlanLabel(invoice.plan, invoice.amount)}
                            </p>
                          </div>
                          <p className="shrink-0 text-lg font-bold text-primary">
                            {formatCurrency(invoice.amount)}
                          </p>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Período</p>
                            <p className="font-medium text-foreground">{invoice.period ?? "—"}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Vencimento</p>
                              <p className="font-medium text-foreground">
                                {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Pagamento</p>
                              <p className="font-medium text-foreground">
                                {invoice.paid_at ? formatDate(invoice.paid_at) : "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
                          <Link to={`/family/invoices/${invoice.id}`}>
                            <Eye className="w-4 h-4" />
                            Ver detalhes
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referência</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {invoice.invoice_ref ?? "—"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {invoice.period ?? "—"}
                          </TableCell>
                          <TableCell>{getInvoicePlanLabel(invoice.plan, invoice.amount)}</TableCell>
                          <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>
                            {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                          </TableCell>
                          <TableCell>
                            {invoice.paid_at ? formatDate(invoice.paid_at) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge className={(statusConfig[invoice.status] ?? fallbackStatus).className}>
                              {(statusConfig[invoice.status] ?? fallbackStatus).label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/family/invoices/${invoice.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                Detalhes
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Receipt className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhuma fatura disponível
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Suas faturas da assinatura aparecerão aqui após o primeiro pagamento.
                </p>
                <Button asChild>
                  <Link to="/family/billing">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver planos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default FamilyInvoices;
