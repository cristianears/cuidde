import { ArrowLeft, Download, Calendar, CreditCard, User, FileText } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { mockFamilies } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import type { Invoice } from "./FamilyInvoices";

// Mock invoices data (same as FamilyInvoices)
const mockInvoices: Invoice[] = [
  {
    id: 'INV-2026-003',
    period: 'Março 2026',
    plan: 'Essencial',
    amount: 129.00,
    dueDate: '2026-03-10',
    paidDate: null,
    status: 'pending',
  },
  {
    id: 'INV-2026-002',
    period: 'Fevereiro 2026',
    plan: 'Essencial',
    amount: 129.00,
    dueDate: '2026-02-10',
    paidDate: '2026-02-08',
    status: 'paid',
  },
  {
    id: 'INV-2026-001',
    period: 'Janeiro 2026',
    plan: 'Essencial',
    amount: 129.00,
    dueDate: '2026-01-10',
    paidDate: '2026-01-09',
    status: 'paid',
  },
  {
    id: 'INV-2025-012',
    period: 'Dezembro 2025',
    plan: 'Match',
    amount: 397.00,
    dueDate: '2025-12-15',
    paidDate: '2025-12-14',
    status: 'paid',
  },
];

const statusConfig: Record<Invoice['status'], { label: string; className: string }> = {
  paid: { label: 'Paga', className: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-700' },
  open: { label: 'Em aberto', className: 'bg-muted text-muted-foreground' },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const FamilyInvoiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();
  const currentUser = mockFamilies[0];

  const invoice = mockInvoices.find(inv => inv.id === id);

  const handleDownloadReceipt = () => {
    toast.success("Recibo baixado com sucesso (mock)");
  };

  if (!invoice) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} />
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

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="family"
        userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""}
      />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/family/invoices')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Faturas
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Fatura {invoice.id}
              </h1>
              <p className="text-muted-foreground mt-1">
                Detalhes da cobrança referente a {invoice.period}
              </p>
            </div>
            <Badge className={`${statusConfig[invoice.status].className} text-sm px-3 py-1`}>
              {statusConfig[invoice.status].label}
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Plano contratado</p>
                  <p className="font-medium">{invoice.plan}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="font-medium">{invoice.period}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(invoice.amount)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusConfig[invoice.status].className}>
                    {statusConfig[invoice.status].label}
                  </Badge>
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
                  <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Data de pagamento</p>
                  <p className="font-medium">
                    {invoice.paidDate ? formatDate(invoice.paidDate) : 'Aguardando pagamento'}
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
                  <p className="font-medium">{currentUser.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium">{currentUser.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ação: Baixar Recibo */}
          {invoice.status === 'paid' && (
            <Card className="bg-emerald-50/50 border-emerald-200">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Recibo disponível</h3>
                    <p className="text-sm text-muted-foreground">
                      Esta fatura foi paga. Você pode baixar o comprovante.
                    </p>
                  </div>
                  <Button onClick={handleDownloadReceipt}>
                    <Download className="w-4 h-4 mr-2" />
                    Baixar recibo
                  </Button>
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
