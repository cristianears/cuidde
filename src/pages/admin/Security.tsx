import { Shield, AlertTriangle, FileText, Clock, Search } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockReports, mockSystemLogs } from "@/data/mockData";

const Security = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="admin"
        userName="Administrador"
      />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Segurança"
          description="Central de denúncias e logs do sistema"
        />

        <Tabs defaultValue="reports">
          <TabsList className="mb-6">
            <TabsTrigger value="reports" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Denúncias
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="w-4 h-4" />
              Logs do Sistema
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-100">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {mockReports.filter(r => r.status === 'open' || r.status === 'investigating').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Denúncias ativas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-100">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {mockReports.filter(r => r.status === 'investigating').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Em investigação</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-100">
                      <Shield className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {mockReports.filter(r => r.status === 'resolved').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Resolvidas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Todas as Denúncias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl bg-muted/50 border border-border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{report.reason}</span>
                            <StatusBadge status={report.status} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Reportado por: {report.reporterName} ({report.reporterType === 'family' ? 'Família' : 'Cuidador'})
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-3">{report.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          Denunciado: <span className="font-medium text-foreground">{report.reportedName}</span>
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Ver detalhes</Button>
                          {report.status !== 'resolved' && report.status !== 'dismissed' && (
                            <Button size="sm" className="bg-primary">Resolver</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Security;
