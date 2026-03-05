import { useState } from "react";
import {
  DollarSign,
  Users,
  CreditCard,
  Receipt,
  Search,
  Download,
  Eye,
  X,
} from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import MetricCard from "@/components/shared/MetricCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  mockAdminSubscriptions,
  mockAdminInvoices,
  type AdminSubscription,
  type AdminInvoice,
} from "@/data/mockData";

// Subscription status mapping for StatusBadge
const subscriptionStatusMap: Record<string, 'active' | 'pending' | 'rejected' | 'finished'> = {
  active: 'active',
  pending: 'pending',
  cancelled: 'rejected',
  expired: 'finished',
};

const subscriptionStatusLabels: Record<string, string> = {
  active: 'Ativa',
  pending: 'Pendente',
  cancelled: 'Cancelada',
  expired: 'Expirada',
};

// Invoice status colors
const invoiceStatusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: 'Paga', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  overdue: { label: 'Vencida', className: 'bg-red-50 text-red-700 border-red-200' },
};

// Metrics
const metrics = {
  monthlyRevenue: 'R$ 4.230',
  activeSubscriptions: mockAdminSubscriptions.filter(s => s.status === 'active').length,
  averageTicket: 'R$ 176',
  invoicesThisMonth: mockAdminInvoices.filter(i => i.period.includes('Fevereiro 2026')).length,
};

const Finance = () => {
  // Subscriptions filters
  const [subSearch, setSubSearch] = useState("");
  const [subPlanFilter, setSubPlanFilter] = useState("all");
  const [subStatusFilter, setSubStatusFilter] = useState("all");

  // Invoices filters
  const [invSearch, setInvSearch] = useState("");
  const [invPlanFilter, setInvPlanFilter] = useState("all");
  const [invStatusFilter, setInvStatusFilter] = useState("all");
  const [invPeriodFilter, setInvPeriodFilter] = useState("all");

  // Detail views
  const [selectedSubscription, setSelectedSubscription] = useState<AdminSubscription | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null);

  // Filter subscriptions
  const filteredSubscriptions = mockAdminSubscriptions.filter((sub) => {
    const matchesSearch = sub.familyName.toLowerCase().includes(subSearch.toLowerCase());
    const matchesPlan = subPlanFilter === "all" || sub.plan === subPlanFilter;
    const matchesStatus = subStatusFilter === "all" || sub.status === subStatusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Filter invoices
  const filteredInvoices = mockAdminInvoices.filter((inv) => {
    const matchesSearch = inv.familyName.toLowerCase().includes(invSearch.toLowerCase());
    const matchesPlan = invPlanFilter === "all" || inv.plan === invPlanFilter;
    const matchesStatus = invStatusFilter === "all" || inv.status === invStatusFilter;
    const matchesPeriod = invPeriodFilter === "all" || inv.period === invPeriodFilter;
    return matchesSearch && matchesPlan && matchesStatus && matchesPeriod;
  });

  // Unique periods for filter
  const uniquePeriods = [...new Set(mockAdminInvoices.map(i => i.period))].sort().reverse();

  const handleDownloadReceipt = (invoiceId: string) => {
    toast({
      title: "Download iniciado",
      description: `Recibo da fatura ${invoiceId} será baixado em breve (mock).`,
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="admin" userName="Administrador" />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <PageHeader
          title="Financeiro"
          description="Assinaturas e faturas da plataforma"
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Receita Mensal"
            value={metrics.monthlyRevenue}
            change={12}
            changeLabel="vs. mês anterior"
            icon={<DollarSign className="w-5 h-5" />}
          />
          <MetricCard
            title="Assinaturas Ativas"
            value={metrics.activeSubscriptions}
            change={3}
            changeLabel="este mês"
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Ticket Médio"
            value={metrics.averageTicket}
            change={5}
            changeLabel="vs. mês anterior"
            icon={<CreditCard className="w-5 h-5" />}
          />
          <MetricCard
            title="Faturas do Mês"
            value={metrics.invoicesThisMonth}
            icon={<Receipt className="w-5 h-5" />}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subscriptions">
          <TabsList className="mb-6">
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
          </TabsList>

          {/* ──── Assinaturas Tab ──── */}
          <TabsContent value="subscriptions">
            {/* Filters */}
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
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="match">Match — Mensalista</SelectItem>
                  <SelectItem value="essencial">Essencial</SelectItem>
                  <SelectItem value="daily">Daily — Plantão & Diária</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subStatusFilter} onValueChange={setSubStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Família</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Plano</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Início</th>
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
                        filteredSubscriptions.map((sub) => (
                          <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-medium text-foreground">{sub.familyName}</span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary" className="font-normal">{sub.planLabel}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={subscriptionStatusMap[sub.status]} size="sm" />
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {new Date(sub.startDate).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {sub.nextRenewal
                                ? new Date(sub.nextRenewal).toLocaleDateString('pt-BR')
                                : '—'}
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ──── Faturas Tab ──── */}
          <TabsContent value="invoices">
            {/* Filters */}
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
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="match">Match — Mensalista</SelectItem>
                  <SelectItem value="essencial">Essencial</SelectItem>
                  <SelectItem value="daily">Daily — Plantão & Diária</SelectItem>
                </SelectContent>
              </Select>
              <Select value={invStatusFilter} onValueChange={setInvStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="paid">Paga</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                </SelectContent>
              </Select>
              <Select value={invPeriodFilter} onValueChange={setInvPeriodFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  {uniquePeriods.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
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
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
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
                        filteredInvoices.map((inv) => {
                          const statusConf = invoiceStatusConfig[inv.status];
                          return (
                            <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4 text-sm text-foreground">{inv.period}</td>
                              <td className="py-3 px-4">
                                <span className="font-medium text-foreground">{inv.familyName}</span>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="secondary" className="font-normal">{inv.planLabel}</Badge>
                              </td>
                              <td className="py-3 px-4 font-medium text-foreground">
                                R$ {inv.value.toFixed(2).replace('.', ',')}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground text-sm">
                                {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground text-sm">
                                {inv.paidAt
                                  ? new Date(inv.paidAt).toLocaleDateString('pt-BR')
                                  : '—'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${statusConf.className}`}>
                                  {statusConf.label}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedInvoice(inv)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {inv.status === 'paid' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDownloadReceipt(inv.id)}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ──── Subscription Detail Sheet ──── */}
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
                    <p className="font-medium text-foreground">{selectedSubscription.familyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plano</p>
                    <Badge variant="secondary" className="mt-1">{selectedSubscription.planLabel}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-lg font-bold text-foreground">
                      R$ {selectedSubscription.value.toFixed(2).replace('.', ',')}
                      {selectedSubscription.plan === 'essencial' && <span className="text-sm font-normal text-muted-foreground">/mês</span>}
                      {selectedSubscription.plan === 'daily' && <span className="text-sm font-normal text-muted-foreground">/agendamento</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">
                      <StatusBadge status={subscriptionStatusMap[selectedSubscription.status]} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Início do Plano</p>
                    <p className="font-medium text-foreground">
                      {new Date(selectedSubscription.startDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {selectedSubscription.nextRenewal && (
                    <div>
                      <p className="text-sm text-muted-foreground">Próxima Renovação</p>
                      <p className="font-medium text-foreground">
                        {new Date(selectedSubscription.nextRenewal).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* ──── Invoice Detail Sheet ──── */}
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ID da Fatura</span>
                      <span className="font-mono text-sm font-medium text-foreground">{selectedInvoice.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Período</span>
                      <span className="font-medium text-foreground">{selectedInvoice.period}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Família</span>
                      <span className="font-medium text-foreground">{selectedInvoice.familyName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plano</span>
                      <Badge variant="secondary">{selectedInvoice.planLabel}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Valor</span>
                      <span className="text-lg font-bold text-foreground">
                        R$ {selectedInvoice.value.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${invoiceStatusConfig[selectedInvoice.status].className}`}>
                        {invoiceStatusConfig[selectedInvoice.status].label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Vencimento</span>
                      <span className="font-medium text-foreground">
                        {new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Data de Pagamento</span>
                      <span className="font-medium text-foreground">
                        {selectedInvoice.paidAt
                          ? new Date(selectedInvoice.paidAt).toLocaleDateString('pt-BR')
                          : '—'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {selectedInvoice.status === 'paid' && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleDownloadReceipt(selectedInvoice.id)}
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
