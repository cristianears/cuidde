import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { toast } from "sonner";
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
import { useUnreadCounts, useUnreadRealtime } from "@/hooks/useUnreadCounts";

import type { UserRole } from '@/types/database';

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
    { icon: ClipboardCheck, label: 'Solicitações', href: '/caregiver/solicitations' },
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
    { icon: Shield, label: 'Log do sistema', href: '/admin/security' },
  ],
};

interface AppSidebarProps {
  role: UserRole;
  userName?: string;
  userPhoto?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AppSidebar = ({ role, userName = 'Usuário', userPhoto }: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const items = sidebarItems[role];

  // Notificações — apenas caregiver/family (admin não precisa)
  const enableNotifications = role === 'caregiver' || role === 'family';
  const { data: unread } = useUnreadCounts(enableNotifications ? role : undefined);
  useUnreadRealtime();

  // Mapa href → contagem de badge
  const badgeCounts: Record<string, number> = {};
  if (unread) {
    if (role === 'caregiver') {
      if (unread.newSolicitations > 0)
        badgeCounts['/caregiver/solicitations'] = unread.newSolicitations;
      if (unread.totalUnreadMessages > 0)
        badgeCounts['/caregiver/appointments'] = unread.totalUnreadMessages;
    }
    if (role === 'family') {
      if (unread.updatedSolicitations > 0)
        badgeCounts['/family/matches'] = unread.updatedSolicitations;
      if (unread.totalUnreadMessages > 0)
        badgeCounts['/family/appointments'] = unread.totalUnreadMessages;
    }
  }

  async function handleLogout() {
    const { error } = await signOut()

    if (error) {
      // Global sign-out failed (network/server). Fall back to local-only sign-out so
      // the session token is cleared from localStorage even if the server could not be reached.
      await supabase.auth.signOut({ scope: 'local' })
      toast.warning('Erro ao encerrar sessão no servidor. Sessão local removida.')
    }

    queryClient.clear()
    localStorage.removeItem('cuidde_pending_signup')
    localStorage.removeItem('cuidde_pending_address')
    sessionStorage.clear()
    navigate('/login', { replace: true })
  }

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
                <img src={userPhoto} alt={userName} className="w-full h-full object-cover" loading="lazy" />
              ) : getInitials(userName) ? (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-sm font-semibold text-primary">{getInitials(userName)}</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          const badgeCount = badgeCounts[item.href] ?? 0;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="relative flex-shrink-0">
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                {badgeCount > 0 && collapsed && (
                  <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-destructive ring-2 ring-card" />
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="text-sm flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
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
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        className="absolute -right-3 top-20 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
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
