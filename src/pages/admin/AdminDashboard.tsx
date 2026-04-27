import { Users, DollarSign, TrendingUp } from "lucide-react";
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
        <PageHeader title="Painel Administrativo" description="Visão geral da plataforma ditti" />

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
