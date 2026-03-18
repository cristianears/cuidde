import { FileText, Download, Eye, Receipt } from "lucide-react";
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
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";

export interface Invoice {
  id: string;
  period: string;
  plan: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: 'paid' | 'pending' | 'open';
}

// Mock invoices data
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

const FamilyInvoices = () => {
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();
  const hasInvoices = mockInvoices.length > 0;

  const handleDownloadReceipt = (invoiceId: string) => {
    toast.success("Recibo baixado com sucesso (mock)");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="family"
        userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""}
      />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Faturas"
          description="Histórico de cobranças da sua assinatura na CuidaBem"
        >
          <Button variant="outline" asChild>
            <Link to="/family/billing">
              Ver planos
            </Link>
          </Button>
        </PageHeader>

        <div className="max-w-5xl">
          {hasInvoices ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                    {mockInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.period}
                        </TableCell>
                        <TableCell>{invoice.plan}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>
                          {invoice.paidDate ? formatDate(invoice.paidDate) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[invoice.status].className}>
                            {statusConfig[invoice.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link to={`/family/invoices/${invoice.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                Detalhes
                              </Link>
                            </Button>
                            {invoice.status === 'paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadReceipt(invoice.id)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Recibo
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="py-16">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Receipt className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhuma fatura disponível
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Suas faturas da assinatura da plataforma aparecerão aqui.
                </p>
                <Button asChild>
                  <Link to="/family/billing">
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
