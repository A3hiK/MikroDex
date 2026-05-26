import React, { useState, useEffect } from 'react';
import { Router, Eye, EyeOff, Plus, Trash2, Loader, Wifi, ArrowRight, Palette } from 'lucide-react';
import { useStore } from '../store/store';
import MikroTikService from '../services/MikroTikService';
import DatabaseService from '../services/DatabaseService';
import { useNavigate } from 'react-router-dom';

const RouterConnection = () => {
  const navigate = useNavigate();
  const { router, setRouter, savedRouters, setSavedRouters, setStats, theme, setTheme } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchRouters = async () => {
      const routers = await DatabaseService.getRouters();
      setSavedRouters(routers);
    };
    fetchRouters();

    // Auto-reconnect if a previous connection was persisted
    if (router.connected && router.ip && router.username) {
      MikroTikService.connect(router.ip, router.username, router.password).then((result) => {
        if (!result.success) {
          // Connection failed (router offline), clear persisted state
          setRouter({ connected: false, error: 'Auto-reconnect failed. Please connect manually.' });
        }
      });
    }
  }, [setSavedRouters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConnect = async () => {
    if (!formData.ip || !formData.username || !formData.password) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await MikroTikService.connect(
        formData.ip,
        formData.username,
        formData.password
      );

      if (result.success) {
        setRouter({
          ip: formData.ip,
          username: formData.username,
          password: formData.password,
          connected: true,
          error: null,
        });

        // Always save/update in Recent Connections (deduplication handled by DatabaseService)
        await DatabaseService.saveRouter(
          formData.name || formData.ip,
          formData.ip,
          formData.username,
          formData.password
        );
        const updatedRouters = await DatabaseService.getRouters();
        setSavedRouters(updatedRouters);

        setMessage({ type: 'success', text: 'Connected successfully! Initializing...' });

        const usersResult = await MikroTikService.getHotspotUsers();
        if (usersResult.success) {
          setStats({ totalUsers: usersResult.data.length });
        }

        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setMessage({ type: 'error', text: result.message });
        setRouter({ ...router, connected: false, error: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Connection failed: ${error.message}` });
      setRouter({ ...router, connected: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    MikroTikService.disconnect();
    setRouter({ ip: '', username: '', password: '', connected: false, connecting: false, error: null });
    setMessage({ type: 'success', text: 'Disconnected successfully' });
  };

  const handleSaveRouter = async () => {
    if (!formData.name || !formData.ip) {
      setMessage({ type: 'error', text: 'Please fill router name and IP' });
      return;
    }

    const result = await DatabaseService.saveRouter(
      formData.name,
      formData.ip,
      formData.username,
      formData.password
    );

    if (result.success) {
      const routers = await DatabaseService.getRouters();
      setSavedRouters(routers);
      setMessage({ type: 'success', text: 'Router profile saved successfully' });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleLoadRouter = (savedRouter) => {
    setFormData({
      name: savedRouter.name,
      ip: savedRouter.ip,
      username: savedRouter.username,
      password: savedRouter.password,
    });
  };

  const handleDeleteRouter = async (id) => {
    await DatabaseService.deleteRouter(id);
    const routers = await DatabaseService.getRouters();
    setSavedRouters(routers);
    setMessage({ type: 'success', text: 'Router profile deleted' });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Router Connection</h1>
          <p className="text-textMuted text-sm">Manage MikroTik devices and profiles</p>
        </div>
      </div>

      {/* Status */}
      {router.connected && (
        <div className="card-glass border-l-4 border-l-emerald-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Wifi size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Active Connection</h3>
              <p className="text-sm text-textMuted">Connected to <span className="font-mono text-emerald-400">{router.ip}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <div className="mt-0.5">
            {message.type === 'success' ? <Wifi size={18} /> : <Router size={18} />}
          </div>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Form */}
        <div className="lg:col-span-2">
          <div className="card-glass h-full">
            <div className="card-glass-header">
              <h2 className="flex items-center gap-2 text-white">
                <Router size={18} className="text-primary" /> Connection Details
              </h2>
            </div>
            <div className="card-glass-body space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="label-custom">Profile Name <span className="lowercase text-[10px] opacity-60">(optional)</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Main Office Router"
                    className="input-custom"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="label-custom">IP Address <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="ip"
                    value={formData.ip}
                    onChange={handleInputChange}
                    placeholder="192.168.88.1"
                    className="input-custom font-mono"
                    disabled={loading || router.connected}
                  />
                </div>

                <div>
                  <label className="label-custom">Username <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="admin"
                    className="input-custom"
                    disabled={loading || router.connected}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label-custom">Password <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="input-custom pr-10"
                      disabled={loading || router.connected}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-white/5">
                {!router.connected ? (
                  <>
                    <button
                      onClick={handleConnect}
                      disabled={loading}
                      className="flex-1 btn-primary"
                    >
                      {loading ? (
                        <><Loader size={18} className="animate-spin" /> Connecting...</>
                      ) : (
                        <>Connect to Router <ArrowRight size={18} /></>
                      )}
                    </button>
                    <button
                      onClick={handleSaveRouter}
                      disabled={loading}
                      className="btn-secondary"
                    >
                      <Plus size={18} /> Save Profile
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all font-medium"
                  >
                    Disconnect Active Session
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Saved Routers */}
        <div className="card-glass flex flex-col h-[500px]">
          <div className="card-glass-header">
            <h2 className="text-white">Recent Connections</h2>
            <span className="badge bg-white/5 text-textMuted">{savedRouters.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto scroll-custom p-4 space-y-3">
            {savedRouters.length === 0 ? (
              <div className="text-center py-10">
                <Router size={32} className="mx-auto text-textMuted opacity-50 mb-3" />
                <p className="text-sm text-textMuted">No saved routers found.</p>
              </div>
            ) : (
              savedRouters.map((savedRouter) => (
                <div
                  key={savedRouter.id}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer transition-all duration-200"
                  onClick={() => handleLoadRouter(savedRouter)}
                >
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center group-hover:text-primary transition-colors">
                    <Router size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">
                      {savedRouter.name || 'Unnamed Router'}
                    </p>
                    <p className="text-xs text-textMuted font-mono truncate">{savedRouter.ip}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteRouter(savedRouter.id); }}
                    className="p-2 text-textMuted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete Profile"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Theme Selector */}
      <div className="card-glass">
        <div className="card-glass-header">
          <h2 className="flex items-center gap-2 text-white">
            <Palette size={18} className="text-primary" /> App Theme
          </h2>
          <span className="text-xs text-textMuted px-3 py-1 bg-white/5 rounded-full border border-white/5 capitalize">{theme}</span>
        </div>
        <div className="card-glass-body">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { id: 'dark',         label: 'Dark',         bg: 'from-zinc-900 to-zinc-800',      dot: 'bg-cyan-400',    border: 'border-cyan-500/50' },
              { id: 'theme-ocean',  label: 'Ocean Blue',   bg: 'from-blue-950 to-blue-900',      dot: 'bg-blue-400',    border: 'border-blue-500/50' },
              { id: 'theme-forest', label: 'Forest Green', bg: 'from-green-950 to-green-900',    dot: 'bg-emerald-400', border: 'border-emerald-500/50' },
              { id: 'theme-purple', label: 'Purple Haze',  bg: 'from-purple-950 to-purple-900',  dot: 'bg-purple-400',  border: 'border-purple-500/50' },
              { id: 'theme-sunset', label: 'Sunset Red',   bg: 'from-red-950 to-red-900',        dot: 'bg-rose-400',    border: 'border-rose-500/50' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative group flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 ${
                  theme === t.id
                    ? `${t.border} bg-white/5 shadow-lg`
                    : 'border-white/5 hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                {/* Color Preview */}
                <div className={`w-full h-14 rounded-xl bg-gradient-to-br ${t.bg} flex items-center justify-center shadow-inner border border-white/10`}>
                  <div className="flex gap-1.5">
                    <span className={`w-3 h-3 rounded-full ${t.dot} shadow-lg`}></span>
                    <span className={`w-3 h-3 rounded-full ${t.dot} opacity-60`}></span>
                    <span className={`w-3 h-3 rounded-full ${t.dot} opacity-30`}></span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-white text-center">{t.label}</span>
                {theme === t.id && (
                  <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${t.dot} animate-pulse shadow-lg`}></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouterConnection;
