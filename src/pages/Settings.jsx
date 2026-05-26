import React, { useState } from 'react';
import { Save, RotateCcw, Moon, Sun, Bell, Zap, Database, TerminalSquare } from 'lucide-react';
import { useStore } from '../store/store';
import DatabaseService from '../services/DatabaseService';
import MikroTikService from '../services/MikroTikService';

const Settings = () => {
  const { settings, updateSettings, theme, setTheme } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [profiles, setProfiles] = useState([]);

  React.useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const result = await MikroTikService.getHotspotProfiles();
        if (result.success) setProfiles(result.data);
      } catch {}
    };
    fetchProfiles();
  }, []);

  const COLOR_THEMES = ['theme-ocean', 'theme-forest', 'theme-purple', 'theme-sunset'];

  const handleSettingChange = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);

    if (key === 'darkMode') {
      if (value) {
        setTheme('dark');
      } else {
        setTheme('');
      }
      updateSettings({ darkMode: value });
      DatabaseService.setSetting('appSettings', { ...settings, darkMode: value });
    }
  };

  const handleSave = () => {
    updateSettings(localSettings);
    DatabaseService.setSetting('appSettings', localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const defaultSettings = {
      autoConnect: true,
      notifications: true,
      refreshInterval: 5,
      darkMode: false,
      hotspotDns: 'hotspot.local',
      profilePrices: {},
    };
    setLocalSettings(defaultSettings);
    setTheme('');
    setSaved(false);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">System Settings</h1>
          <p className="text-textMuted text-sm">Customize your MikroDex experience</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleReset} className="btn-secondary">
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={handleSave} className="btn-primary">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <Save size={18} />
          <span className="text-sm font-medium">Settings saved successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Settings */}
        <div className="card-glass">
          <div className="card-glass-header">
            <h2 className="flex items-center gap-2 text-white">
              <Zap size={18} className="text-primary" /> Connection & Sync
            </h2>
          </div>
          <div className="card-glass-body space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-transparent hover:border-white/5 transition-colors">
              <div>
                <p className="font-semibold text-white">Auto Connect</p>
                <p className="text-xs text-textMuted mt-1">Automatically connect to the last used router on startup</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.autoConnect}
                  onChange={(e) => handleSettingChange('autoConnect', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:border-primary"></div>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-transparent hover:border-white/5 transition-colors">
              <p className="font-semibold text-white mb-1">Live Sync Interval</p>
              <p className="text-xs text-textMuted mb-4">How often should background data update (seconds)</p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="3"
                  max="60"
                  value={localSettings.refreshInterval}
                  onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-primary font-mono bg-primary/10 px-3 py-1 rounded-md text-sm min-w-[3rem] text-center">
                  {localSettings.refreshInterval}s
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-transparent hover:border-white/5 transition-colors">
              <p className="font-semibold text-white mb-1">Hotspot DNS Name</p>
              <p className="text-xs text-textMuted mb-4">The domain name used for your Hotspot login page (e.g., hotspot.local)</p>
              <input
                type="text"
                value={localSettings.hotspotDns || ''}
                onChange={(e) => handleSettingChange('hotspotDns', e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                placeholder="hotspot.local"
              />
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="card-glass">
          <div className="card-glass-header">
            <h2 className="flex items-center gap-2 text-white">
              {localSettings.darkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-400" />} 
              Appearance & Alerts
            </h2>
          </div>
          <div className="card-glass-body space-y-6">
            <div className="flex flex-col gap-4 p-4 rounded-xl bg-white/5 border border-transparent hover:border-white/5 transition-colors">
              <div>
                <p className="font-semibold text-white">App Theme Mode</p>
                <p className="text-xs text-textMuted mt-1">Choose between light and premium dark design</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSettingChange('darkMode', false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border ${!localSettings.darkMode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-surface text-textMuted border-white/5 hover:text-white hover:bg-white/10'}`}
                >
                  <Sun size={16} /> Light Mode
                </button>
                <button
                  onClick={() => handleSettingChange('darkMode', true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border ${localSettings.darkMode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-surface text-textMuted border-white/5 hover:text-white hover:bg-white/10'}`}
                >
                  <Moon size={16} /> Dark Mode
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-transparent hover:border-white/5 transition-colors">
              <div>
                <p className="font-semibold text-white flex items-center gap-2">
                  <Bell size={16} /> Desktop Notifications
                </p>
                <p className="text-xs text-textMuted mt-1">Show alerts for critical system events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:border-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Package Prices */}
        <div className="card-glass lg:col-span-2 border-emerald-500/20">
          <div className="card-glass-header bg-emerald-500/5">
            <h2 className="flex items-center gap-2 text-white">
              <Zap size={18} className="text-emerald-400" /> Package Pricing (Revenue Analytics)
            </h2>
          </div>
          <div className="card-glass-body">
            <p className="text-sm text-textMuted mb-4">Set prices for your hotspot profiles to enable automatic revenue calculation in the dashboard.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {profiles.map(p => (
                <div key={p.name} className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors">
                  <span className="text-sm font-semibold text-white mb-2">{p.name}</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted font-medium">৳</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={localSettings.profilePrices?.[p.name] || ''}
                      onChange={(e) => {
                        const newPrices = { ...(localSettings.profilePrices || {}) };
                        const val = parseInt(e.target.value);
                        if (isNaN(val)) delete newPrices[p.name];
                        else newPrices[p.name] = val;
                        handleSettingChange('profilePrices', newPrices);
                      }}
                      className="w-full bg-surface border border-white/10 rounded-lg pl-8 pr-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              ))}
              {profiles.length === 0 && (
                 <div className="col-span-full text-center py-4 text-textMuted bg-surface rounded-xl">
                   No profiles found. Connect to a router first.
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="card-glass lg:col-span-2">
          <div className="card-glass-header">
            <h2 className="flex items-center gap-2 text-white">
              <Database size={18} className="text-textMuted" /> System Information
            </h2>
          </div>
          <div className="card-glass-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-background/50 border border-white/5">
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Database size={14} /> Database Storage
                </p>
                <code className="text-xs text-primary font-mono break-all select-all">
                  %USERPROFILE%\.mikrodesk\database.db
                </code>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-white/5">
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <TerminalSquare size={14} /> Application Logs
                </p>
                <code className="text-xs text-primary font-mono break-all select-all">
                  %USERPROFILE%\.mikrodesk\logs
                </code>
              </div>
            </div>
          </div>
        </div>


        {/* Automated Backups */}
        <div className="card-glass lg:col-span-2 border-primary/20">
          <div className="card-glass-header bg-primary/5">
            <h2 className="flex items-center gap-2 text-white">
              <Database size={18} className="text-primary" /> Automated Backups
            </h2>
          </div>
          <div className="card-glass-body">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 hover:border-white/10 border border-transparent transition-colors">
              <div>
                <p className="text-sm font-semibold text-white">Auto Backup Router Config</p>
                <p className="text-xs text-textMuted mt-1">Automatically backup router config and hotspot DB to your local PC.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.autoBackup || false}
                  onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:border-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* SMS Integration */}
        <div className="card-glass lg:col-span-2 border-indigo-500/20">
          <div className="card-glass-header bg-indigo-500/5">
            <h2 className="flex items-center gap-2 text-white">
              <Bell size={18} className="text-indigo-400" /> SMS / WhatsApp Gateway
            </h2>
          </div>
          <div className="card-glass-body">
            <p className="text-sm text-textMuted mb-4">Configure your API to send voucher codes directly to users.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-custom">API URL Endpoint</label>
                <input
                  type="text"
                  placeholder="https://api.sms-provider.com/send"
                  value={localSettings.smsApiUrl || ''}
                  onChange={(e) => handleSettingChange('smsApiUrl', e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="label-custom">API Key / Token</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={localSettings.smsApiKey || ''}
                  onChange={(e) => handleSettingChange('smsApiKey', e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
