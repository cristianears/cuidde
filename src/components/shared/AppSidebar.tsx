import { useEffect, useRef, useState } from "react";
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
import BrandMark from "@/components/shared/BrandMark";
import { getFirstName, getInitials } from "@/lib/display-name";

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
    { icon: ClipboardCheck, label: 'Solicitações/Chat', href: '/caregiver/solicitations' },
    { icon: Briefcase, label: 'Atendimentos', href: '/caregiver/appointments' },
    { icon: Star, label: 'Avaliações', href: '/caregiver/reviews' },
    { icon: Headphones, label: 'Suporte', href: '/caregiver/support' },
  ],
  family: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/family' },
    { icon: Search, label: 'Buscar Cuidadores', href: '/family/search' },
    { icon: Heart, label: 'Favoritos', href: '/family/favorites' },
    { icon: UserCheck, label: 'Solicitações/Chat', href: '/family/matches' },
    { icon: Briefcase, label: 'Atendimentos', href: '/family/appointments' },
    { icon: CreditCard, label: 'Plano & Assinatura', href: '/family/billing' },
    { icon: Users, label: 'Meu Perfil', href: '/family/profile' },
    { icon: Headphones, label: 'Suporte', href: '/family/support' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: Users, label: 'Cuidadores', href: '/admin/caregivers' },
    { icon: ClipboardCheck, label: 'Revisões', href: '/admin/approvals' },
    { icon: DollarSign, label: 'Financeiro', href: '/admin/finance' },
  ],
};

interface AppSidebarProps {
  role: UserRole;
  userName?: string;
  userPhoto?: string;
}

const AppSidebar = ({ role, userName = 'Usuário', userPhoto }: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const mobileNavRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const items = sidebarItems[role];
  const compactUserName = getFirstName(userName, 'Usuário');
  const fallbackInitial = getInitials(userName);

  useEffect(() => {
    setPhotoFailed(false);
  }, [userPhoto]);

  useEffect(() => {
    const nav = mobileNavRef.current;
    if (!nav || (typeof window.matchMedia === "function" && window.matchMedia("(min-width: 768px)").matches)) return;

    const frame = window.requestAnimationFrame(() => {
      const activeItem = nav.querySelector<HTMLElement>('[data-active="true"]');
      if (typeof activeItem?.scrollIntoView === "function") {
        activeItem.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, role]);

  // Notificações — apenas caregiver/family (admin não precisa)
  const enableNotifications = role === 'caregiver' || role === 'family';
  const { data: unread } = useUnreadCounts(enableNotifications ? role : undefined);
  useUnreadRealtime();

  // Mapa href → contagem de badge
  const badgeCounts: Record<string, number> = {};
  if (unread) {
    if (role === 'caregiver') {
      const solicitationBadge = unread.newSolicitations + unread.pendingUnreadMessages;
      if (solicitationBadge > 0)
        badgeCounts['/caregiver/solicitations'] = solicitationBadge;
      if (unread.appointmentUnreadMessages > 0)
        badgeCounts['/caregiver/appointments'] = unread.appointmentUnreadMessages;
    }
    if (role === 'family') {
      const solicitationBadge = unread.updatedSolicitations + unread.pendingUnreadMessages;
      if (solicitationBadge > 0)
        badgeCounts['/family/matches'] = solicitationBadge;
      if (unread.appointmentUnreadMessages > 0)
        badgeCounts['/family/appointments'] = unread.appointmentUnreadMessages;
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
        "app-shell-sidebar fixed inset-x-0 bottom-0 z-40 h-[calc(4.5rem+env(safe-area-inset-bottom))] bg-card border-t border-border flex transition-all duration-300 md:sticky md:inset-auto md:top-0 md:h-screen md:flex-col md:border-r md:border-t-0",
        collapsed ? "md:w-16" : "md:w-64"
      )}
    >
      {/* Logo */}
      <div className="hidden p-4 border-b border-border md:block">
        <Link to="/" className="flex items-center">
          <BrandMark size={36} showWordmark={!collapsed} />
        </Link>
      </div>

      {/* User Info Card */}
      {!collapsed && (
        <div className="hidden p-4 border-b border-border md:block">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-muted overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
              {userPhoto && !photoFailed ? (
                <img
                  src={userPhoto}
                  alt={userName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => setPhotoFailed(true)}
                />
              ) : fallbackInitial ? (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-sm font-semibold text-primary">{fallbackInitial}</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{compactUserName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav ref={mobileNavRef} className="flex-1 overflow-x-auto overflow-y-hidden px-2 pb-[env(safe-area-inset-bottom)] pt-2 md:p-3 md:space-y-1 md:overflow-y-auto md:overflow-x-hidden">
        <div className="flex min-w-max items-stretch gap-1 md:block md:min-w-0 md:space-y-1">
        {items.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== `/${role}` && location.pathname.startsWith(`${item.href}/`));
          const badgeCount = badgeCounts[item.href] ?? 0;
          return (
            <Link
              key={item.href}
              to={item.href}
              data-active={isActive ? "true" : undefined}
              className={cn(
                "relative flex w-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center transition-colors md:w-auto md:flex-row md:justify-start md:gap-3 md:px-3 md:py-2.5 md:text-left",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="relative flex-shrink-0">
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                {badgeCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-destructive ring-2 ring-card md:hidden",
                      collapsed && "md:block",
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "w-full truncate text-[10px] leading-tight md:w-auto md:text-sm md:leading-normal",
                  collapsed ? "md:hidden" : "md:flex-1",
                )}
              >
                {item.label}
              </span>
              {!collapsed && badgeCount > 0 && (
                <span className="ml-auto hidden h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground md:flex">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sair"
          className="relative flex w-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <LogOut className="w-5 h-5" />
        </button>
        </div>
      </nav>

      {/* Logout Section */}
      <div className="hidden p-3 border-t border-border md:block">
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
        className="absolute -right-3 top-20 hidden w-8 h-8 rounded-full bg-card border border-border items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm md:flex"
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
