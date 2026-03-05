import { Users, DollarSign, ClipboardCheck, TrendingUp, Star, Calendar } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import MetricCard from "@/components/shared/MetricCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockAdminMetrics, mockCaregivers, mockSystemLogs } from "@/data/mockData";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const pendingApprovals = mockCaregivers.filter((c) => c.status === "pending" || c.status === "analyzing");

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="admin" userName="Administrador" />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader title="Painel Administrativo" description="Visão geral da plataforma CuidaBem" />

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total de Cuidadores"
            value={mockAdminMetrics.totalCaregivers}
            change={8}
            changeLabel="este mês"
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Cuidadores Verificados"
            value={mockAdminMetrics.verifiedCaregivers}
            change={12}
            changeLabel="este mês"
            icon={<ClipboardCheck className="w-5 h-5" />}
          />
          <MetricCard
            title="Famílias Ativas"
            value={mockAdminMetrics.activeFamilies}
            change={15}
            changeLabel="este mês"
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Faturamento Mensal"
            value={`R$ ${mockAdminMetrics.monthlyRevenue.toLocaleString("pt-BR")}`}
            change={23}
            changeLabel="vs. mês anterior"
            icon={<DollarSign className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                Aprovações Pendentes
              </CardTitle>
              <Link to="/admin/approvals" className="text-sm text-primary hover:underline">
                Ver todas
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.slice(0, 4).map((caregiver) => (
                  <div key={caregiver.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <img src={caregiver.photo} alt={caregiver.name} className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{caregiver.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {caregiver.address.city}, {caregiver.address.state}
                      </p>
                    </div>
                    <StatusBadge status={caregiver.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Assinaturas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Match</span>
                <span className="font-semibold">{mockAdminMetrics.subscriptions.basic}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                <span className="text-primary font-medium">Essencial</span>
                <span className="font-semibold text-primary">{mockAdminMetrics.subscriptions.essential}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                <span className="text-accent font-medium">Daily</span>
                <span className="font-semibold text-accent">{mockAdminMetrics.subscriptions.premium}</span>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Matches este mês</span>
                  <span className="font-semibold">{mockAdminMetrics.matchesThisMonth}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avaliação média</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-semibold">{mockAdminMetrics.averageRating}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Atividade Recente
            </CardTitle>
            <Link to="/admin/security" className="text-sm text-primary hover:underline">
              Ver logs
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSystemLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      log.userRole === "admin"
                        ? "bg-primary"
                        : log.userRole === "caregiver"
                          ? "bg-accent"
                          : "bg-amber-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{log.action}</p>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">{log.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
