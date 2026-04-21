import { useState, useMemo, useRef, useCallback } from "react";
import {
  DollarSign,
  Users,
  CreditCard,
  Receipt,
  Search,
  Eye,
  Download,
  Loader2,
  CalendarIcon,
  Printer,
} from "lucide-react";
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import MetricCard from "@/components/shared/MetricCard";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import {
  useAdminMetrics,
  useAdminSubscriptions,
  useAdminInvoices,
} from "@/hooks/useAdmin";
import type { AdminSubscriptionRow, AdminInvoiceRow } from "@/hooks/useAdmin";

// ─── Mapeamentos de plano ──────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  annual: "Anual",
};

const PLAN_VALUES: Record<string, number> = {
  monthly: 127,
  quarterly: 297,
  annual: 997,
};

// ─── Status de assinatura — refletindo Stripe ──────────────────────────────────

const subscriptionStatusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Ativa", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  free: { label: "Gratuito", className: "bg-gray-50 text-gray-700 border-gray-200" },
  past_due: { label: "Ativa — pagamento pendente", className: "bg-orange-50 text-orange-700 border-orange-200" },
  canceled: { label: "Cancelada", className: "bg-red-50 text-red-700 border-red-200" },
  incomplete: { label: "Cancelada", className: "bg-red-50 text-red-700 border-red-200" },
};

// ─── Status de fatura — refletindo Stripe ───────────────────────────────────────

const invoiceStatusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: "Paga", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  void: { label: "Cancelada", className: "bg-red-50 text-red-700 border-red-200" },
};

// DECISÃO DE PRODUTO (não é bug): o admin vê apenas faturas `paid` ("Paga") e `void` ("Cancelada").
// Como toda cobrança é via cartão de crédito com auto-charge do Stripe, os estados
// `draft`/`open` são transitórios (milissegundos entre criação e cobrança) e
// `uncollectible` é raríssimo. Expor esses estados ao admin só gera ruído operacional.
// Se algum dia entrar boleto/pix, revisar este filtro junto com o invoiceStatusConfig.
const VISIBLE_INVOICE_STATUSES = new Set(["paid", "void"]);

// ─── Tipo do filtro de período ─────────────────────────────────────────────────

type PeriodPreset = "all" | "5d" | "30d" | "custom";

function fmtBRL(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatusInline({ config }: { config: { label: string; className: string } }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${config.className}`}>
      {config.label}
    </span>
  );
}

const Finance = () => {
  const { data: metrics, isLoading: loadingMetrics } = useAdminMetrics();
  const { data: subscriptions = [], isLoading: loadingSubs } = useAdminSubscriptions();
  const { data: invoices = [], isLoading: loadingInvs } = useAdminInvoices();

  // ─── Filtros — Assinaturas ─────────────────────────────────────────────────
  const [subSearch, setSubSearch] = useState("");
  const [subPlanFilter, setSubPlanFilter] = useState("all");
  const [subStatusFilter, setSubStatusFilter] = useState("all");

  // ─── Filtros — Faturas ────────────────────────────────────────────────────
  const [invSearch, setInvSearch] = useState("");
  const [invPlanFilter, setInvPlanFilter] = useState("all");
  const [invStatusFilter, setInvStatusFilter] = useState("all");
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);

  // ─── Detail sheets ────────────────────────────────────────────────────────
  const [selectedSubscription, setSelectedSubscription] = useState<AdminSubscriptionRow | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoiceRow | null>(null);

  // ─── Ref para impressão ──────────────────────────────────────────────────
  const invoicesPrintRef = useRef<HTMLDivElement>(null);

  const handleDownloadReceipt = (invoiceRef: string | null) => {
    toast({
      title: "Download iniciado",
      description: `Recibo ${invoiceRef ?? ""} será baixado em breve.`,
    });
  };

  // ─── Filtros aplicados — Assinaturas ─────────────────────────────────────
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesSearch = !subSearch || (sub.full_name ?? "").toLowerCase().includes(subSearch.toLowerCase());

      let matchesPlan = true;
      if (subPlanFilter === "free") {
        matchesPlan = sub.subscription_status === "free" || !sub.plan;
      } else if (subPlanFilter !== "all") {
        matchesPlan = sub.plan === subPlanFilter;
      }

      let matchesStatus = true;
      if (subStatusFilter === "ativa") {
        matchesStatus = sub.subscription_status === "active" || sub.subscription_status === "past_due";
      } else if (subStatusFilter === "cancelada") {
        matchesStatus = sub.subscription_status === "canceled" || sub.subscription_status === "incomplete";
      } else if (subStatusFilter !== "all") {
        matchesStatus = false;
      }

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [subscriptions, subSearch, subPlanFilter, subStatusFilter]);

  // ─── Filtros aplicados — Faturas (com período por data) ──────────────────
  const filteredInvoices = useMemo(() => {
    const now = new Date();

    return invoices.filter((inv) => {
      if (!VISIBLE_INVOICE_STATUSES.has(inv.status)) return false;

      const matchesSearch = !invSearch || (inv.family_name ?? "").toLowerCase().includes(invSearch.toLowerCase());
      const matchesPlan = invPlanFilter === "all" || inv.plan === invPlanFilter;
      let matchesStatus = true;
      if (invStatusFilter === "paid") {
        matchesStatus = inv.status === "paid";
      } else if (invStatusFilter === "canceled") {
        matchesStatus = inv.status === "void";
      }

      let matchesPeriod = true;
      const invDate = inv.paid_at ? new Date(inv.paid_at) : inv.created_at ? new Date(inv.created_at) : null;

      if (periodPreset === "5d" && invDate) {
        matchesPeriod = isAfter(invDate, startOfDay(subDays(now, 5)));
      } else if (periodPreset === "30d" && invDate) {
        matchesPeriod = isAfter(invDate, startOfDay(subDays(now, 30)));
      } else if (periodPreset === "custom" && invDate) {
        if (customDateFrom) matchesPeriod = isAfter(invDate, startOfDay(customDateFrom));
        if (customDateTo && matchesPeriod) matchesPeriod = isBefore(invDate, endOfDay(customDateTo));
      }

      return matchesSearch && matchesPlan && matchesStatus && matchesPeriod;
    });
  }, [invoices, invSearch, invPlanFilter, invStatusFilter, periodPreset, customDateFrom, customDateTo]);

  // ─── Somatório das faturas filtradas ───────────────────────────────────
  const filteredInvoicesTotal = useMemo(
    () => filteredInvoices.reduce((sum, i) => sum + i.amount, 0),
    [filteredInvoices],
  );

  // ─── Métricas: valor total das faturas pagas no mês corrente ─────────────
  const monthlyInvoiceTotal = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    return invoices
      .filter((i) => {
        if (i.status !== "paid" || !i.paid_at) return false;
        return isAfter(new Date(i.paid_at), monthStart);
      })
      .reduce((sum, i) => sum + i.amount, 0);
  }, [invoices]);

  // ─── Impressão do relatório de faturas ──────────────────────────────────
  const handlePrint = useCallback(() => {
    const el = invoicesPrintRef.current;
    if (!el) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const mRev = metrics?.monthlyRevenue ?? 0;
    const mSubs = metrics?.activeSubscriptions ?? 0;
    const mTicket = metrics?.averageTicket ?? 0;
    const sMonthly = metrics?.subscriptions?.monthly ?? 0;
    const sQuarterly = metrics?.subscriptions?.quarterly ?? 0;
    const sAnnual = metrics?.subscriptions?.annual ?? 0;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head>
        <title>Relatório Financeiro — ditti</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          p.sub { font-size: 13px; color: #666; margin-bottom: 20px; }
          .metrics { display: flex; gap: 16px; margin-bottom: 12px; flex-wrap: wrap; }
          .metric-card { flex: 1; min-width: 160px; border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px 16px; }
          .metric-card .label { font-size: 12px; color: #666; margin-bottom: 4px; }
          .metric-card .value { font-size: 14px; font-weight: 700; white-space: nowrap; }
          .plans { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
          .plan-card { flex: 1; min-width: 140px; border: 1px solid #e5e5e5; border-radius: 8px; padding: 10px 14px; }
          .plan-card .label { font-size: 11px; color: #666; margin-bottom: 2px; }
          .plan-card .value { font-size: 14px; font-weight: 600; }
          h2 { font-size: 15px; margin-bottom: 8px; color: #333; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e5e5; }
          th { font-weight: 600; color: #666; background: #fafafa; }
          td { white-space: nowrap; }
          .total-row td { font-weight: 700; font-size: 13px; border-top: 2px solid #333; background: #f9f9f9; }
          .print-hidden { display: none; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>
        <h1>Relatório Financeiro — ditti</h1>
        <p class="sub">Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>

        <div class="metrics">
          <div class="metric-card">
            <div class="label">Receita Mensal</div>
            <div class="value">R$ ${fmtBRL(mRev)}</div>
          </div>
          <div class="metric-card">
            <div class="label">Assinaturas Ativas</div>
            <div class="value">${mSubs}</div>
          </div>
          <div class="metric-card">
            <div class="label">Ticket Médio</div>
            <div class="value">${mTicket ? "R$ " + fmtBRL(mTicket) : "—"}</div>
          </div>
          <div class="metric-card">
            <div class="label">Faturas do Mês</div>
            <div class="value">R$ ${fmtBRL(monthlyInvoiceTotal)}</div>
          </div>
        </div>

        <div class="plans">
          <div class="plan-card">
            <div class="label">Mensal</div>
            <div class="value">${sMonthly} assin. — R$ ${fmtBRL(sMonthly * PLAN_VALUES.monthly)}</div>
          </div>
          <div class="plan-card">
            <div class="label">Trimestral</div>
            <div class="value">${sQuarterly} assin. — R$ ${fmtBRL(sQuarterly * PLAN_VALUES.quarterly)}</div>
          </div>
          <div class="plan-card">
            <div class="label">Anual</div>
            <div class="value">${sAnnual} assin. — R$ ${fmtBRL(sAnnual * PLAN_VALUES.annual)}</div>
          </div>
        </div>

        <h2>Faturas (${filteredInvoices.length})</h2>
        ${el.querySelector("table")?.outerHTML ?? ""}
      </body></html>
    `);
    printWindow.document.close();
    // Remove colunas "Ações" (print-hidden) da janela de impressão
    printWindow.document.querySelectorAll(".print-hidden").forEach((e) => e.remove());
    printWindow.print();
  }, [filteredInvoices, metrics, monthlyInvoiceTotal]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="admin" userName="Administrador" />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <PageHeader
          title="Financeiro"
          description="Assinaturas e faturas da plataforma"
        />

        {/* ─── Metric Cards — receita e subtotais por plano ────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <MetricCard
            title="Receita Mensal"
            value={
              loadingMetrics
                ? "..."
                : `R$ ${(metrics?.monthlyRevenue ?? 0).toLocaleString("pt-BR")}`
            }
            icon={<DollarSign className="w-5 h-5" />}
          />
          <MetricCard
            title="Assinaturas Ativas"
            value={loadingMetrics ? "..." : (metrics?.activeSubscriptions ?? 0)}
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Ticket Médio"
            value={
              loadingMetrics
                ? "..."
                : metrics?.averageTicket
                ? `R$ ${metrics.averageTicket.toLocaleString("pt-BR")}`
                : "—"
            }
            icon={<CreditCard className="w-5 h-5" />}
          />
          <MetricCard
            title="Faturas do Mês"
            value={
              loadingInvs
                ? "..."
                : `R$ ${fmtBRL(monthlyInvoiceTotal)}`
            }
            icon={<Receipt className="w-5 h-5" />}
          />
        </div>

        {/* ─── Subtotais por plano ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <MetricCard
            compact
            title="Mensal"
            value={
              loadingMetrics
                ? "..."
                : `${metrics?.subscriptions?.monthly ?? 0} assin. — R$ ${((metrics?.subscriptions?.monthly ?? 0) * PLAN_VALUES.monthly).toLocaleString("pt-BR")}`
            }
            icon={<Receipt className="w-4 h-4" />}
          />
          <MetricCard
            compact
            title="Trimestral"
            value={
              loadingMetrics
                ? "..."
                : `${metrics?.subscriptions?.quarterly ?? 0} assin. — R$ ${((metrics?.subscriptions?.quarterly ?? 0) * PLAN_VALUES.quarterly).toLocaleString("pt-BR")}`
            }
            icon={<Receipt className="w-4 h-4" />}
          />
          <MetricCard
            compact
            title="Anual"
            value={
              loadingMetrics
                ? "..."
                : `${metrics?.subscriptions?.annual ?? 0} assin. — R$ ${((metrics?.subscriptions?.annual ?? 0) * PLAN_VALUES.annual).toLocaleString("pt-BR")}`
            }
            icon={<Receipt className="w-4 h-4" />}
          />
        </div>

        {/* ─── Tabs ─────────────────────────────────────────────────────── */}
        <Tabs defaultValue="subscriptions">
          <TabsList className="mb-6">
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
          </TabsList>

          {/* ──── Assinaturas ──────────────────────────────────────────── */}
          <TabsContent value="subscriptions">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar família..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={subPlanFilter} onValueChange={setSubPlanFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subStatusFilter} onValueChange={setSubStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                {loadingSubs ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Família</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Plano</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Desde</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Próx. Renovação</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubscriptions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-muted-foreground">
                              Nenhuma assinatura encontrada.
                            </td>
                          </tr>
                        ) : (
                          filteredSubscriptions.map((sub) => {
                            const statusConf = subscriptionStatusConfig[sub.subscription_status] ?? subscriptionStatusConfig.incomplete;
                            return (
                              <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                <td className="py-3 px-4">
                                  <span className="font-medium text-foreground">{sub.full_name ?? "—"}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="secondary" className="font-normal">
                                    {sub.plan ? PLAN_LABELS[sub.plan] : "Gratuito"}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <StatusInline config={statusConf} />
                                </td>
                                <td className="py-3 px-4 text-muted-foreground text-sm">
                                  {new Date(sub.created_at).toLocaleDateString("pt-BR")}
                                </td>
                                <td className="py-3 px-4 text-muted-foreground text-sm">
                                  {sub.current_period_end
                                    ? new Date(sub.current_period_end).toLocaleDateString("pt-BR")
                                    : "—"}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedSubscription(sub)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver detalhes
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ──── Faturas ──────────────────────────────────────────────── */}
          <TabsContent value="invoices">
            <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar família..."
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={invPlanFilter} onValueChange={setInvPlanFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
              <Select value={invStatusFilter} onValueChange={setInvStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="paid">Paga</SelectItem>
                  <SelectItem value="canceled">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              {/* ─── Filtro de período por data ─────────────────────────── */}
              <Select
                value={periodPreset}
                onValueChange={(v) => {
                  setPeriodPreset(v as PeriodPreset);
                  if (v !== "custom") {
                    setCustomDateFrom(undefined);
                    setCustomDateTo(undefined);
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="5d">Últimos 5 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="custom">Período personalizado</SelectItem>
                </SelectContent>
              </Select>

              {periodPreset === "custom" && (
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[150px] justify-start text-left font-normal text-sm">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateFrom ? format(customDateFrom, "dd/MM/yyyy") : "Data início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDateFrom}
                        onSelect={setCustomDateFrom}
                        locale={ptBR}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-sm text-muted-foreground">até</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[150px] justify-start text-left font-normal text-sm">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateTo ? format(customDateTo, "dd/MM/yyyy") : "Data fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDateTo}
                        onSelect={setCustomDateTo}
                        locale={ptBR}
                        disabled={(date) => date > new Date() || (customDateFrom ? date < customDateFrom : false)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Botão imprimir */}
            {filteredInvoices.length > 0 && (
              <div className="flex justify-end mb-3">
                <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
                  <Printer className="w-4 h-4" />
                  Imprimir relatório
                </Button>
              </div>
            )}

            <Card>
              <CardContent className="p-0">
                {loadingInvs ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div ref={invoicesPrintRef} className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Período</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Família</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Plano</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vencimento</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pagamento</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground print-hidden">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-muted-foreground">
                              Nenhuma fatura encontrada.
                            </td>
                          </tr>
                        ) : (
                          <>
                            {filteredInvoices.map((inv) => {
                              const statusConf = invoiceStatusConfig[inv.status] ?? invoiceStatusConfig.void;
                              const isPaid = inv.status === "paid";
                              return (
                                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                  <td className="py-3 px-4 text-sm text-foreground">{inv.period ?? "—"}</td>
                                  <td className="py-3 px-4">
                                    <span className="font-medium text-foreground">{inv.family_name ?? "—"}</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge variant="secondary" className="font-normal">
                                      {inv.plan ? PLAN_LABELS[inv.plan] : "—"}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                                    R$ {fmtBRL(inv.amount)}
                                  </td>
                                  <td className="py-3 px-4 text-muted-foreground text-sm">
                                    {inv.due_date
                                      ? new Date(inv.due_date).toLocaleDateString("pt-BR")
                                      : "—"}
                                  </td>
                                  <td className="py-3 px-4 text-muted-foreground text-sm">
                                    {inv.paid_at
                                      ? new Date(inv.paid_at).toLocaleDateString("pt-BR")
                                      : "—"}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`badge ${isPaid ? "badge-paid" : "badge-canceled"}`}>
                                      <StatusInline config={statusConf} />
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right print-hidden">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedInvoice(inv)}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      {isPaid && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDownloadReceipt(inv.invoice_ref)}
                                        >
                                          <Download className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {/* ─── Linha de total ──────────────────────────── */}
                            <tr className="total-row bg-muted/60 border-t-2 border-foreground/20">
                              <td colSpan={3} className="py-3 px-4 text-sm font-bold text-foreground whitespace-nowrap">
                                Total ({filteredInvoices.length} fatura{filteredInvoices.length !== 1 ? "s" : ""})
                              </td>
                              <td className="py-3 px-4 font-bold text-foreground text-sm whitespace-nowrap">
                                R$ {fmtBRL(filteredInvoicesTotal)}
                              </td>
                              <td colSpan={4} />
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Subscription Detail Sheet ────────────────────────────────── */}
        <Sheet open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Detalhes da Assinatura</SheetTitle>
              <SheetDescription>Informações completas da assinatura</SheetDescription>
            </SheetHeader>
            {selectedSubscription && (
              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Família</p>
                    <p className="font-medium text-foreground">{selectedSubscription.full_name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plano</p>
                    <Badge variant="secondary" className="mt-1">
                      {selectedSubscription.plan ? PLAN_LABELS[selectedSubscription.plan] : "Gratuito"}
                    </Badge>
                  </div>
                  {selectedSubscription.plan && (
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="text-lg font-bold text-foreground">
                        R$ {fmtBRL(PLAN_VALUES[selectedSubscription.plan] ?? 0)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">
                      <StatusInline config={subscriptionStatusConfig[selectedSubscription.subscription_status] ?? subscriptionStatusConfig.incomplete} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cadastro</p>
                    <p className="font-medium text-foreground">
                      {new Date(selectedSubscription.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {selectedSubscription.current_period_end && (
                    <div>
                      <p className="text-sm text-muted-foreground">Próxima Renovação</p>
                      <p className="font-medium text-foreground">
                        {new Date(selectedSubscription.current_period_end).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* ─── Invoice Detail Sheet ─────────────────────────────────────── */}
        <Sheet open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Detalhes da Fatura</SheetTitle>
              <SheetDescription>Informações completas da fatura</SheetDescription>
            </SheetHeader>
            {selectedInvoice && (
              <div className="mt-6 space-y-6">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    {selectedInvoice.invoice_ref && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Referência</span>
                        <span className="font-mono text-sm font-medium text-foreground">{selectedInvoice.invoice_ref}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Período</span>
                      <span className="font-medium text-foreground">{selectedInvoice.period ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Família</span>
                      <span className="font-medium text-foreground">{selectedInvoice.family_name ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plano</span>
                      <Badge variant="secondary">
                        {selectedInvoice.plan ? PLAN_LABELS[selectedInvoice.plan] : "—"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Valor</span>
                      <span className="text-lg font-bold text-foreground">
                        R$ {selectedInvoice.amount.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <StatusInline config={invoiceStatusConfig[selectedInvoice.status] ?? invoiceStatusConfig.void} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Vencimento</span>
                      <span className="font-medium text-foreground">
                        {selectedInvoice.due_date
                          ? new Date(selectedInvoice.due_date).toLocaleDateString("pt-BR")
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Data de Pagamento</span>
                      <span className="font-medium text-foreground">
                        {selectedInvoice.paid_at
                          ? new Date(selectedInvoice.paid_at).toLocaleDateString("pt-BR")
                          : "—"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {selectedInvoice.status === "paid" && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleDownloadReceipt(selectedInvoice.invoice_ref)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar recibo
                  </Button>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
};

export default Finance;
