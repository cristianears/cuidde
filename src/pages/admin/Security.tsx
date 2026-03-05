import { FileText, Search } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockSystemLogs } from "@/data/mockData";

const Security = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="admin"
        userName="Administrador"
      />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Log do sistema"
          description="Registro de atividades e eventos da plataforma"
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Logs do Sistema</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar logs..." className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSystemLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    log.userRole === 'admin' ? 'bg-primary' :
                    log.userRole === 'caregiver' ? 'bg-accent' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{log.action}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        log.userRole === 'admin' ? 'bg-primary/10 text-primary' :
                        log.userRole === 'caregiver' ? 'bg-accent/10 text-accent' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {log.userRole === 'admin' ? 'Admin' :
                         log.userRole === 'caregiver' ? 'Cuidador' : 'Família'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.userName} • {log.timestamp}
                    </p>
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

export default Security;
