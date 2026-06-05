import { Users, DollarSign, TrendingUp, CheckCircle2, ClipboardList, CalendarDays } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import MetricCard from "@/components/shared/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminMetrics } from "@/hooks/useAdmin";

const AdminDashboard = () => {
  const { data: metrics, isLoading: loadingMetrics } = useAdminMetrics();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="admin" userName="Administrador" />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader title="Painel Administrativo" description="Visão geral da plataforma icuide" />

        {/* ─── Métricas principais ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <MetricCard
            title="Total de Cuidadores"
            value={loadingMetrics ? "..." : (metrics?.totalCaregivers ?? 0)}
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Assinaturas Ativas"
            value={loadingMetrics ? "..." : (metrics?.activeSubscriptions ?? 0)}
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Faturamento Mensal"
            value={
              loadingMetrics
                ? "..."
                : `R$ ${(metrics?.monthlyRevenue ?? 0).toLocaleString("pt-BR")}`
            }
            icon={<DollarSign className="w-5 h-5" />}
          />
        </div>

        <div className="mb-8">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-foreground">Operação de cuidadores</h2>
            <p className="text-sm text-muted-foreground">
              Acompanhe completude de perfil e uso recente da rotina de cuidados.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Perfis completos"
              value={loadingMetrics ? "..." : (metrics?.profileCompleteCaregivers ?? 0)}
              icon={<CheckCircle2 className="w-5 h-5" />}
            />
            <MetricCard
              title="Rotina nos últimos 7 dias"
              value={loadingMetrics ? "..." : (metrics?.caregiversWithRoutineLast7Days ?? 0)}
              icon={<ClipboardList className="w-5 h-5" />}
            />
            <MetricCard
              title="Rotina nos últimos 30 dias"
              value={loadingMetrics ? "..." : (metrics?.caregiversWithRoutineLast30Days ?? 0)}
              icon={<CalendarDays className="w-5 h-5" />}
            />
            <MetricCard
              title="Rotina hoje"
              value={loadingMetrics ? "..." : (metrics?.caregiversWithRoutineToday ?? 0)}
              icon={<ClipboardList className="w-5 h-5" />}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* ─── Assinaturas por plano ────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Assinaturas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Mensal</span>
                <span className="font-semibold">
                  {loadingMetrics ? "..." : (metrics?.subscriptions.monthly ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                <span className="text-primary font-medium">Trimestral</span>
                <span className="font-semibold text-primary">
                  {loadingMetrics ? "..." : (metrics?.subscriptions.quarterly ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                <span className="text-accent font-medium">Anual</span>
                <span className="font-semibold text-accent">
                  {loadingMetrics ? "..." : (metrics?.subscriptions.annual ?? 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
