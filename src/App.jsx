import React, { useEffect, useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import HotspotUsers from './pages/HotspotUsers';
import OnlineUsers from './pages/OnlineUsers';
import UsageHistory from './pages/UsageHistory';
import Vouchers from './pages/Vouchers';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import Revenue from './pages/Revenue';
import LoginEditor from './pages/LoginEditor';
import { useStore } from './store/store';

const THEMES = [
  { id: 'dark',         dot: '#22d3ee', label: 'Dark'   },
  { id: 'theme-ocean',  dot: '#60a5fa', label: 'Ocean'  },
  { id: 'theme-forest', dot: '#34d399', label: 'Forest' },
  { id: 'theme-purple', dot: '#a78bfa', label: 'Purple' },
  { id: 'theme-sunset', dot: '#fb7185', label: 'Sunset' },
];

const App = () => {
  const { router, settings, theme, setTheme } = useStore();
  const [zoom, setZoom] = useState(() => parseFloat(localStorage.getItem('mikrodesk_zoom') || '1'));
  const [showZoom, setShowZoom] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    // Remove all theme classes first
    el.classList.remove('dark', 'theme-ocean', 'theme-forest', 'theme-purple', 'theme-sunset');
    
    // Apply dark mode if enabled in settings, OR if the legacy 'dark' theme string is set
    if (settings.darkMode || theme === 'dark') {
      el.classList.add('dark');
    }

    // Apply color theme if selected
    if (theme && theme !== 'dark') {
      el.classList.add(theme);
    }
  }, [theme, settings.darkMode]);

  const handleWheel = useCallback((e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom((prev) => {
      const next = Math.min(2, Math.max(0.5, prev - e.deltaY * 0.002));
      localStorage.setItem('mikrodesk_zoom', next.toString());
      return next;
    });
    setShowZoom(true);
    clearTimeout(window.zoomTimer);
    window.zoomTimer = setTimeout(() => setShowZoom(false), 1500);
  }, []);

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <HashRouter>
      {/* Ambient Orbs */}
      <div className="ambient-orb ambient-orb-1"></div>
      <div className="ambient-orb ambient-orb-2"></div>
      <div className="ambient-orb ambient-orb-3"></div>

      {!router.connected ? (
        <div
          className="min-h-screen bg-background text-text flex items-center justify-center transition-transform duration-200"
          style={{ zoom: zoom }}
        >
          <Routes>
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />

          <div className="flex-1 flex flex-col relative z-0 min-w-0">
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden scroll-custom p-4 md:p-8 relative"
              style={{ zoom: zoom }}
            >
              <div className="max-w-7xl mx-auto w-full">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={<HotspotUsers />} />
                  <Route path="/online" element={<OnlineUsers />} />
                  <Route path="/vouchers" element={<Vouchers />} />
                  <Route path="/revenue" element={<Revenue />} />
                  <Route path="/history" element={<UsageHistory />} />
                  <Route path="/editor" element={<LoginEditor />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </div>

            {/* Premium Glass Status Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-surface/60 backdrop-blur-xl border-t border-white/5 px-6 flex items-center justify-between text-xs text-textMuted z-10">
              <div className="flex items-center gap-6">
                <span className="font-semibold text-text tracking-wide hidden sm:inline">MikroDex <span className="text-primary/80 font-normal">v1.0</span></span>
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span>Connected to <span className="font-mono text-primary ml-1">{router.ip}</span></span>
                </div>
                
                {/* Theme Switcher in Footer */}
                <div className="hidden sm:flex items-center gap-2 ml-4 border-l border-white/10 pl-6">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      title={t.label}
                      className={`relative w-4 h-4 rounded-full transition-all duration-300 hover:scale-125 ${
                        theme === t.id ? 'ring-2 ring-white ring-offset-1 ring-offset-surface scale-110 shadow-lg' : 'opacity-40 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: t.dot }}
                    >
                      {theme === t.id && (
                        <span className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ backgroundColor: t.dot }}></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span>System Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoom indicator popup */}
      <div
        className={`fixed bottom-16 right-6 z-50 px-4 py-2 bg-surface/90 backdrop-blur-xl text-white text-sm border border-white/10 rounded-xl shadow-glow-primary font-medium transition-all duration-300 ${showZoom ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}
      >
        Zoom: {Math.round(zoom * 100)}%
      </div>
    </HashRouter>
  );
};

export default App;
