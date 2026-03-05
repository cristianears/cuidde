import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Heart,
  User,
  FileText,
  Calendar,
  Star,
  Search,
  Users,
  LayoutDashboard,
  ClipboardCheck,
  DollarSign,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Eye,
  Headphones,
  Briefcase,
  UserCheck,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type UserRole = 'caregiver' | 'family' | 'admin';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const sidebarItems: Record<UserRole, SidebarItem[]> = {
  caregiver: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/caregiver' },
    { icon: User, label: 'Perfil', href: '/caregiver/profile' },
    { icon: FileText, label: 'Documentos', href: '/caregiver/documents' },
    { icon: Calendar, label: 'Disponibilidade', href: '/caregiver/availability' },
    { icon: DollarSign, label: 'Valores', href: '/caregiver/pricing' },
    { icon: Briefcase, label: 'Atendimentos', href: '/caregiver/appointments' },
    { icon: Star, label: 'Avaliações', href: '/caregiver/reviews' },
    
    { icon: Headphones, label: 'Suporte', href: '/caregiver/support' },
  ],
  family: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/family' },
    { icon: Search, label: 'Buscar Cuidadores', href: '/family/search' },
    { icon: Heart, label: 'Favoritos', href: '/family/favorites' },
    { icon: UserCheck, label: 'Solicitações', href: '/family/matches' },
    { icon: Briefcase, label: 'Atendimentos', href: '/family/appointments' },
    { icon: CreditCard, label: 'Plano & Assinatura', href: '/family/billing' },
    { icon: Users, label: 'Meu Perfil', href: '/family/profile' },
    { icon: Headphones, label: 'Suporte', href: '/family/support' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: ClipboardCheck, label: 'Aprovações', href: '/admin/approvals' },
    { icon: DollarSign, label: 'Financeiro', href: '/admin/finance' },
    { icon: Shield, label: 'Segurança', href: '/admin/security' },
  ],
};

interface AppSidebarProps {
  role: UserRole;
  userName?: string;
  userPhoto?: string;
  verificationStatus?: 'pending' | 'analyzing' | 'verified' | 'rejected';
}

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-700' },
  analyzing: { label: 'Em verificação', className: 'bg-blue-100 text-blue-700' },
  verified: { label: 'Verificado', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejeitado', className: 'bg-red-100 text-red-700' },
};

const AppSidebar = ({ role, userName = 'Usuário', userPhoto, verificationStatus = 'pending' }: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const items = sidebarItems[role];

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-xl font-semibold text-foreground">CuidaBem</span>
          )}
        </Link>
      </div>

      {/* User Info Card */}
      {!collapsed && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-muted overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
              {userPhoto ? (
                <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
              {role === 'caregiver' && verificationStatus && (
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1",
                  statusLabels[verificationStatus].className
                )}>
                  {statusLabels[verificationStatus].label}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-3 border-t border-border">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="ml-3 text-sm">Sair</span>}
        </Button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
};

export default AppSidebar;
