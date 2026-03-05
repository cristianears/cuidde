import { useState, useMemo } from "react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import ApprovalCaregiverList from "@/components/admin/ApprovalCaregiverList";
import ApprovalDetailPanel, {
  DetailPanelSkeleton,
} from "@/components/admin/ApprovalDetailPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { mockCaregivers as initialCaregivers, mockDocuments } from "@/data/mockData";
import type { Caregiver } from "@/data/mockData";

type ApprovalTab = "pending" | "analyzing" | "verified" | "rejected";

const TAB_CONFIG: { value: ApprovalTab; label: string; readOnly: boolean }[] = [
  { value: "pending", label: "Pendentes", readOnly: false },
  { value: "analyzing", label: "Em análise", readOnly: false },
  { value: "verified", label: "Verificados", readOnly: true },
  { value: "rejected", label: "Reprovados", readOnly: true },
];

const ApprovalQueue = () => {
  const { toast } = useToast();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([...initialCaregivers]);
  const [activeTab, setActiveTab] = useState<ApprovalTab>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredCaregivers = useMemo(
    () => caregivers.filter((c) => c.status === activeTab),
    [caregivers, activeTab]
  );

  const selectedCaregiver = useMemo(
    () => caregivers.find((c) => c.id === selectedId) || null,
    [caregivers, selectedId]
  );

  const selectedDocuments = useMemo(
    () => (selectedId ? mockDocuments.filter((d) => d.caregiverId === selectedId) : []),
    [selectedId]
  );

  const currentTabConfig = TAB_CONFIG.find((t) => t.value === activeTab)!;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ApprovalTab);
    setSelectedId(null);
  };

  const handleApprove = (caregiverId: string) => {
    setCaregivers((prev) =>
      prev.map((c) =>
        c.id === caregiverId ? { ...c, status: "verified" as const } : c
      )
    );
    setSelectedId(null);
    toast({
      title: "Cuidador aprovado",
      description: `${selectedCaregiver?.name} foi verificado com sucesso.`,
    });
  };

  const handleReject = (caregiverId: string, reason: string) => {
    setCaregivers((prev) =>
      prev.map((c) =>
        c.id === caregiverId ? { ...c, status: "rejected" as const } : c
      )
    );
    setSelectedId(null);
    toast({
      title: "Cuidador reprovado",
      description: `${selectedCaregiver?.name} foi reprovado. Motivo: ${reason}`,
      variant: "destructive",
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="admin" userName="Administrador" />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Aprovações"
          description="Revisão de documentos e verificação de cuidadores"
        />

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="mt-6"
        >
          <TabsList className="mb-6">
            {TAB_CONFIG.map((tab) => {
              const count = caregivers.filter(
                (c) => c.status === tab.value
              ).length;
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 text-[11px] bg-muted px-1.5 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TAB_CONFIG.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List */}
                <ApprovalCaregiverList
                  caregivers={filteredCaregivers}
                  selectedId={selectedId}
                  onSelect={(c) => setSelectedId(c.id)}
                  tabLabel={tab.label}
                />

                {/* Detail Panel */}
                {selectedCaregiver &&
                selectedCaregiver.status === tab.value ? (
                  <ApprovalDetailPanel
                    caregiver={selectedCaregiver}
                    documents={selectedDocuments}
                    readOnly={tab.readOnly}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ) : (
                  <Card className="lg:col-span-2 flex items-center justify-center min-h-[400px]">
                    <p className="text-sm text-muted-foreground">
                      Selecione um cuidador para ver detalhes
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default ApprovalQueue;
