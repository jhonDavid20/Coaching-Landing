'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useParams, useRouter } from 'next/navigation';
import {
  User, LogOut, X, Mail, ShieldCheck, LayoutDashboard, Users,
  Settings2, Dumbbell, Search, HeartHandshake, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/session-provider';

const clientItems = [
  { href: '/dashboard/profile',   icon: User,          label: 'profile' },
  { href: '/dashboard/my-coach',  icon: HeartHandshake, label: 'myCoach' },
  { href: '/dashboard/coaches',   icon: Search,         label: 'findCoach' },
];

const adminItems = [
  { href: '/dashboard/admin',         icon: LayoutDashboard, label: 'overview' },
  { href: '/dashboard/admin/invites', icon: Mail,            label: 'invites' },
  { href: '/dashboard/admin/users',   icon: Users,           label: 'users' },
];

const coachItems = [
  { href: '/dashboard/coach',         icon: LayoutDashboard, label: 'overview' },
  { href: '/dashboard/coach/clients', icon: Users,           label: 'myClients' },
  { href: '/dashboard/coach/profile', icon: Package,         label: 'profilePlans' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavItem({
  icon: Icon, label, isActive, onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left gap-3',
        isActive
          ? 'bg-[#243d27] text-white'
          : 'text-[#c8dcc9] hover:bg-[#1e3320] hover:text-white'
      )}
    >
      <Icon className={cn('w-4.5 h-4.5 flex-shrink-0', isActive ? 'text-[#52a85e]' : 'text-[#617061] group-hover:text-[#c8dcc9]')} />
      {label}
    </button>
  );
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const t = useTranslations('dashboard');
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const { user, avatarUrl } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === 'admin';
  const isCoach = user?.role === 'coach';

  const handleNavigate = (href: string) => {
    router.push(`/${locale}${href}`);
    onClose();
  };

  const handleLogout = async () => {
    try {
      const { logoutUserNoRedirect } = await import('@/actions/auth');
      await logoutUserNoRedirect();
      window.location.href = `/${locale}`;
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const initials = user
    ? `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'
    : 'U';

  return (
    <div className="flex flex-col h-full bg-[#162318]">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#243d27]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#3a7d44] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-white text-base tracking-tight">
            Steady<span className="text-[#52a85e]">Vitality</span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md text-[#617061] hover:text-white hover:bg-[#1e3320] transition-colors"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Client nav */}
        {!isAdmin && !isCoach && (
          <>
            <p className="text-[10px] font-bold text-[#617061] uppercase tracking-widest px-3 mb-2">
              {t('title')}
            </p>
            {clientItems.map((item) => (
              <NavItem
                key={item.href}
                icon={item.icon}
                label={t(item.label)}
                isActive={pathname === `/${locale}${item.href}`}
                onClick={() => handleNavigate(item.href)}
              />
            ))}
          </>
        )}

        {/* Coach nav */}
        {isCoach && (
          <>
            <div className="flex items-center gap-2 px-3 mb-2">
              <Dumbbell className="w-3 h-3 text-[#52a85e]" />
              <p className="text-[10px] font-bold text-[#52a85e] uppercase tracking-widest">
                {t('coachSection')}
              </p>
            </div>
            {coachItems.map((item) => (
              <NavItem
                key={item.href}
                icon={item.icon}
                label={t(item.label as Parameters<typeof t>[0])}
                isActive={pathname.startsWith(`/${locale}${item.href}`)}
                onClick={() => handleNavigate(item.href)}
              />
            ))}
          </>
        )}

        {/* Admin nav */}
        {isAdmin && (
          <>
            <div className="flex items-center gap-2 px-3 mb-2">
              <ShieldCheck className="w-3 h-3 text-[#52a85e]" />
              <p className="text-[10px] font-bold text-[#52a85e] uppercase tracking-widest">
                {t('adminSection')}
              </p>
            </div>
            {adminItems.map((item) => (
              <NavItem
                key={item.href}
                icon={item.icon}
                label={t(item.label)}
                isActive={pathname === `/${locale}${item.href}`}
                onClick={() => handleNavigate(item.href)}
              />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-[#243d27]">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
            <div className="w-8 h-8 rounded-full bg-[#3a7d44] flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-xs font-bold">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
              </p>
              <p className="text-xs text-[#617061] capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-[#617061] hover:text-red-400 hover:bg-[#1e3320] rounded-lg transition-colors gap-3"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {t('logout')}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed top-0 left-0 z-40 w-60 h-full shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent onClose={onClose} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col fixed top-0 left-0 w-60 h-full shadow-lg z-40">
        <SidebarContent onClose={() => {}} />
      </div>
    </>
  );
}
