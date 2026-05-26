import React, { useState, useEffect } from 'react';
import {
  Zap, Eye, EyeOff, Wifi, Loader, Router,
  Clock, Trash2, Shield, Star, FlaskConical,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store/store';
import MikroTikService from '../services/MikroTikService';
import DatabaseService from '../services/DatabaseService';
import { useNavigate } from 'react-router-dom';
import iconUrl from '../assets/icon.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setRouter, setSavedRouters, savedRouters, setStats } = useStore();

  const [formData, setFormData] = useState({ name: '', ip: '', username: 'admin', password: '', port: '80' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('idle');
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    const fetchRouters = async () => {
      const routers = await DatabaseService.getRouters();
      setSavedRouters(routers);
    };
    fetchRouters();
  }, [setSavedRouters]);

  const handleInput = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleConnect = async () => {
    if (!formData.ip || !formData.username || !formData.password) {
      setError('Please fill in all required fields (IP, Username, Password).');
      return;
    }

    setLoading(true);
    setStep('connecting');
    setError(null);

    try {
      const result = await MikroTikService.connect(
        formData.ip, formData.username, formData.password, parseInt(formData.port) || 80
      );

      if (result.success) {
        setStep('success');
        setRouter({
          ip: formData.ip,
          username: formData.username,
          password: formData.password,
          name: formData.name || 'Network Command Center',
          connected: true,
          error: null,
        });

        if (formData.name) {
          await DatabaseService.saveRouter(formData.name, formData.ip, formData.username, formData.password);
          const updatedRouters = await DatabaseService.getRouters();
          setSavedRouters(updatedRouters);
        }

        const usersResult = await MikroTikService.getHotspotUsers();
        if (usersResult.success) {
          setStats({ totalUsers: usersResult.data.length });
        }

        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        setStep('idle');
        setError(result.message || 'Connection failed. Check credentials.');
      }
    } catch (err) {
      setStep('idle');
      setError(`Connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConnect = (saved) => {
    setFormData({
      name: saved.name,
      ip: saved.ip,
      username: saved.username,
      password: saved.password,
      port: String(saved.port || 80),
    });
    setError(null);
  };

  const handleDemoMode = () => {
    MikroTikService.setMockMode(true);
    setRouter({
      ip: '192.168.88.1 (Demo)',
      username: 'admin',
      password: '',
      name: 'Demo Command Center',
      connected: true,
      error: null,
    });
    setTimeout(() => navigate('/dashboard'), 300);
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    setError(null);
    const result = await MikroTikService.discoverRouters();
    setDiscovering(false);
    if (result.success && result.data.length > 0) {
      setFormData(prev => ({ ...prev, ip: result.data[0].ip }));
      setError(`Discovered ${result.data.length} router(s). IP updated.`);
    } else {
      setError('No routers discovered on port 5678.');
    }
  };

  const handleDeleteSaved = async (id, e) => {
    e.stopPropagation();
    await DatabaseService.deleteRouter(id);
    const updatedRouters = await DatabaseService.getRouters();
    setSavedRouters(updatedRouters);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) handleConnect();
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 sm:p-8 overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
        
        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-col justify-center px-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-glow-primary mb-8 animate-float">
            <img src={iconUrl} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-6">
            MikroDex <br /> Hotspot OS.
          </h1>
          <p className="text-lg text-textMuted mb-8 max-w-md leading-relaxed">
            The ultimate desktop experience for managing your MikroTik Hotspot network. Real-time monitoring, sleek user management, and instant analytics.
          </p>
          <div className="flex flex-wrap gap-3">
            {['Real-time Monitor', 'Client Management', 'Analytics'].map((f) => (
              <span key={f} className="badge bg-white/5 border-white/10 text-textMuted backdrop-blur-md">
                <Star size={12} className="text-primary" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="card-glass border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="p-8 sm:p-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold">Connect Router</h2>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                <Shield size={14} />
                <span>REST API</span>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="label-custom">Router Name <span className="lowercase text-[10px] opacity-60">(optional)</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Main Office Router"
                  className="input-custom"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="label-custom mb-0">IP Address <span className="text-rose-500">*</span></label>
                    <button type="button" onClick={handleDiscover} disabled={discovering || loading} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                      {discovering ? <><Loader size={12} className="animate-spin" /> Scanning...</> : <><Wifi size={12} /> Auto Discover</>}
                    </button>
                  </div>
                  <input
                    type="text"
                    name="ip"
                    value={formData.ip}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="192.168.88.1"
                    className="input-custom font-mono"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <div className="col-span-1">
                  <label className="label-custom">Port</label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="80"
                    className="input-custom font-mono text-center"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="label-custom">Username <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="admin"
                  className="input-custom"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label-custom">Password <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="••••••••"
                    className="input-custom pr-12"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-textMuted hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-sm animate-in fade-in slide-in-from-top-2">
                  <div className="mt-0.5"><Zap size={16} /></div>
                  <div className="flex-1 leading-relaxed whitespace-pre-wrap">{error}</div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="btn-primary w-full py-3.5 text-lg"
                >
                  {step === 'connecting' ? (
                    <><Loader size={20} className="animate-spin" /> Connecting...</>
                  ) : step === 'success' ? (
                    <><Wifi size={20} /> Connected!</>
                  ) : (
                    <>Connect to Router <ChevronRight size={20} /></>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={handleDemoMode}
                  disabled={loading}
                  className="text-sm text-textMuted hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <FlaskConical size={14} /> Try Demo Mode (No Router)
                </button>
              </div>
            </div>

            {savedRouters.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="label-custom flex items-center gap-2 mb-3">
                  <Clock size={12} /> Recent Connections
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto scroll-custom pr-2">
                  {savedRouters.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => !loading && handleQuickConnect(r)}
                      className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 cursor-pointer transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center group-hover:text-primary transition-colors">
                        <Router size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{r.name || 'Unnamed Router'}</p>
                        <p className="text-xs text-textMuted font-mono">{r.ip}:{r.port || 80}</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSaved(r.id, e)}
                        className="p-2 text-textMuted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
