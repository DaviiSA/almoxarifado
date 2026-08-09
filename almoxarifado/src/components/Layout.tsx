import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Boxes, Package, HardHat, ArrowDownToLine, ArrowUpFromLine,
  MapPin, Users, LogOut, Menu, X, Warehouse,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, roles: ['ADMIN', 'EQUIPE'] },
  { to: '/estoque', label: 'Estoque', icon: Boxes, roles: ['ADMIN', 'EQUIPE'] },
  { to: '/materiais', label: 'Materiais', icon: Package, roles: ['ADMIN', 'EQUIPE'] },
  { to: '/obras', label: 'Obras', icon: HardHat, roles: ['ADMIN', 'EQUIPE'] },
  { to: '/entradas', label: 'Entradas', icon: ArrowDownToLine, roles: ['ADMIN'] },
  { to: '/saidas', label: 'Saídas', icon: ArrowUpFromLine, roles: ['ADMIN', 'EQUIPE'] },
  { to: '/aplicacoes', label: 'Aplicações em campo', icon: MapPin, roles: ['ADMIN', 'EQUIPE'] },
  { to: '/usuarios', label: 'Usuários', icon: Users, roles: ['ADMIN'] },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!user) return null;

  const items = NAV.filter((n) => n.roles.includes(user.perfil));

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="rounded-lg bg-amber-500 p-1.5">
          <Warehouse size={20} className="text-graphite-950" strokeWidth={2.4} />
        </div>
        <div>
          <p className="font-display text-lg font-bold text-white leading-none">ALMOXARIFADO</p>
          <p className="code-tag text-graphite-600 mt-0.5">controle de materiais</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-500 text-graphite-950 font-semibold'
                  : 'text-graphite-600 hover:bg-graphite-800 hover:text-white',
              )
            }
          >
            <Icon size={17} strokeWidth={2.2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-graphite-800">
        <div className="px-3 mb-2">
          <p className="text-sm font-semibold text-white truncate">{user.nome}</p>
          <p className="code-tag text-graphite-600 truncate">
            {user.perfil === 'ADMIN' ? 'Administrador' : `Equipe · ${user.equipeVinculada ?? '—'}`}
          </p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-graphite-600 hover:bg-graphite-800 hover:text-white transition-colors"
        >
          <LogOut size={17} strokeWidth={2.2} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 bg-graphite-900 min-h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-graphite-950/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-graphite-900">{sidebarContent}</aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-graphite-900 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-amber-500 p-1">
              <Warehouse size={16} className="text-graphite-950" />
            </div>
            <span className="font-display font-bold text-white">ALMOXARIFADO</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="text-white p-1">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
