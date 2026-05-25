import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Activity,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  Ticket,
} from 'lucide-react';
import { useStore } from '../store/store';
import MikroTikService from '../services/MikroTikService';
import iconUrl from '../assets/icon.png';

const THEMES = [
  { id: 'dark',         dot: '#22d3ee', label: 'Dark'   },
  { id: 'theme-ocean',  dot: '#60a5fa', label: 'Ocean'  },
  { id: 'theme-forest', dot: '#34d399', label: 'Forest' },
  { id: 'theme-purple', dot: '#a78bfa', label: 'Purple' },
  { id: 'theme-sunset', dot: '#fb7185', label: 'Sunset' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, setSidebar, router, setRouter, theme, setTheme } = useStore();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard' },
    { id: 'users',     label: 'Hotspot',         icon: Users,           path: '/users'     },
    { id: 'vouchers',  label: 'Vouchers',        icon: Ticket,          path: '/vouchers'  },
    { id: 'online',    label: 'Online',          icon: Activity,        path: '/online'    },
    { id: 'history',   label: 'Usage',           icon: History,         path: '/history'   },
    { id: 'settings',  label: 'Settings',        icon: Settings,        path: '/settings'  },
  ];

  const isActive = (path) => location.pathname === path;

  const handleDisconnect = () => {
    MikroTikService.disconnect();
    setRouter({
      ip: '',
      username: '',
      password: '',
      connected: false,
      connecting: false,
      error: null,
    });
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setSidebar(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 btn-icon bg-surface border border-white/10 shadow-glass"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Container */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 absolute md:relative left-0 top-0 h-screen w-48 bg-surface/40 backdrop-blur-2xl border-r border-white/5 z-40 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[4px_0_24px_rgba(0,0,0,0.2)]`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
              <img src={iconUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">MikroDex</h1>
              <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">Hotspot OS</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto scroll-custom">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    active
                      ? 'bg-primary/10 text-primary shadow-[inset_0_0_12px_rgba(6,182,212,0.1)]'
                      : 'text-textMuted hover:bg-white/5 hover:text-text'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_8px_rgba(6,182,212,0.8)] rounded-r-full" />
                  )}
                  <Icon size={18} className={active ? 'text-primary' : 'group-hover:text-text transition-colors'} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          {/* Theme Switcher */}
          <div className="mb-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] font-semibold text-textMuted uppercase tracking-wider mb-2">Theme</p>
            <div className="flex items-center justify-between gap-1">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.label}
                  className={`relative w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                    theme === t.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: t.dot }}
                >
                  {theme === t.id && (
                    <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: t.dot }}></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all duration-200"
          >
            <LogOut size={16} />
            <span>Disconnect</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setSidebar(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
