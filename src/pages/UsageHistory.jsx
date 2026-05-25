import React, { useState, useEffect } from 'react';
import { History, Download, Search, Activity, CalendarDays, ArrowDownToLine, ArrowUpFromLine, Clock } from 'lucide-react';
import { useStore } from '../store/store';
import DatabaseService from '../services/DatabaseService';
import MikroTikService from '../services/MikroTikService';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const LogStatCard = ({ icon: Icon, label, value, colorClass, borderClass, loading, chartData, chartColor }) => (
  <div className={`relative overflow-hidden card-glass group hover:-translate-y-1 transition-all duration-300 border-l-4 ${borderClass}`}>
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${colorClass.split(' ')[2] || 'bg-white'}`}></div>
    
    {/* Sparkline Background */}
    {chartData && !loading && (
      <div className="absolute bottom-0 left-0 right-0 h-20 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-300">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={chartColor} fillOpacity={1} fill={`url(#gradient-${label.replace(/\s/g, '')})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}

    <div className="p-4 relative z-10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-1 truncate">{label}</p>
          {loading ? (
            <div className="h-8 w-24 skeleton rounded-md" />
          ) : (
            <h3 className="text-2xl font-black text-white font-mono tracking-tight truncate">{value}</h3>
          )}
        </div>
        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${colorClass}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  </div>
);

const UsageHistory = () => {
  const { router, savedRouters } = useStore();
  const [selectedRouter, setSelectedRouter] = useState(null);
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  // Mock data for sparklines
  const sessionsSpark = [{value: 5}, {value: 12}, {value: 8}, {value: 20}, {value: 15}, {value: 25}];
  const downloadSpark = [{value: 100}, {value: 300}, {value: 200}, {value: 500}, {value: 400}, {value: 800}];
  const uploadSpark = [{value: 50}, {value: 150}, {value: 100}, {value: 250}, {value: 200}, {value: 400}];
  const activeSpark = [{value: 2}, {value: 5}, {value: 3}, {value: 8}, {value: 6}, {value: 10}];

  useEffect(() => {
    if (savedRouters.length > 0 && !selectedRouter) {
      setSelectedRouter(savedRouters[0].id);
    }
  }, [savedRouters, selectedRouter]);

  useEffect(() => {
    if (selectedRouter && router.connected) {
      fetchLiveUsage();
    }
  }, [selectedRouter, router.connected]);

  const fetchLiveUsage = async () => {
    setLoading(true);
    try {
      const [usersResult, activeResult] = await Promise.all([
        MikroTikService.getHotspotUsers(),
        MikroTikService.getOnlineUsers()
      ]);
      
      if (usersResult.success) {
        const activeSessions = activeResult.success ? activeResult.data : [];
        
        let currentUsedSet = new Set();
        if (router.ip) {
          try {
            currentUsedSet = new Set(JSON.parse(localStorage.getItem(`used_vouchers_${router.ip}`) || '[]'));
          } catch {}
        }
        
        // Map all users to show their usage (even if 0)
        const usageData = usersResult.data.map(u => {
           const active = activeSessions.find(a => a.name === u.name);
           const hasUsage = currentUsedSet.has(u.name) || (u.uptime && u.uptime !== '0s' && u.uptime !== '0') || (u['bytes-out'] && parseInt(u['bytes-out']) > 0);
           
           let status = 'unused';
           if (active) status = 'active';
           else if (hasUsage) status = 'offline';
           
           return {
             id: u['.id'],
             userName: u.name,
             loginTime: active ? active.loginTime : '-',
             logoutTime: '-',
             rawUptime: u.uptime || '0s',
             bytesOut: parseInt(u['bytes-out'] || 0),
             bytesIn: parseInt(u['bytes-in'] || 0),
             status: status
           };
        });
          
        // Sort by download bytes descending
        usageData.sort((a, b) => b.bytesOut - a.bytesOut);
        setHistory(usageData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = history;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((item) => item.status === filterType);
    }

    setFilteredHistory(filtered);
  }, [history, searchTerm, filterType]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const totalDownload = filteredHistory.reduce((sum, item) => sum + (item.bytesOut || 0), 0);
  const totalUpload = filteredHistory.reduce((sum, item) => sum + (item.bytesIn || 0), 0);
  const totalSessions = filteredHistory.length;

  const handleExport = () => {
    const csv = [
      ['Username', 'Login Time', 'Logout Time', 'Duration (s)', 'Download', 'Upload', 'Total Data'],
      ...filteredHistory.map((entry) => [
        entry.userName,
        entry.loginTime,
        entry.logoutTime,
        entry.rawUptime,
        entry.bytesOut,
        entry.bytesIn,
        entry.bytesIn + entry.bytesOut,
      ]),
    ].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!router.connected) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="card-glass p-10 max-w-sm text-center relative hover:shadow-[0_0_30px_rgba(244,63,94,0.1)] transition-all duration-500">
          <div className="absolute inset-0 bg-rose-500/5 blur-xl rounded-full -z-10"></div>
          <div className="w-20 h-20 mx-auto bg-surfaceHover rounded-full flex items-center justify-center mb-6">
            <History size={40} className="text-textMuted transition-colors group-hover:text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Router Disconnected</h2>
          <p className="text-sm text-textMuted mb-6">Connect your MikroTik router to view usage history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Usage Logs</h1>
          <p className="text-textMuted text-sm">Detailed session tracking and bandwidth usage</p>
        </div>
        <button onClick={handleExport} className="btn-secondary border-primary/30 hover:border-primary text-primary transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <LogStatCard
          icon={Activity}
          label="Total Sessions"
          value={totalSessions}
          borderClass="border-l-cyan-500"
          colorClass="bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20"
          loading={loading}
          chartData={sessionsSpark}
          chartColor="#06b6d4"
        />
        <LogStatCard
          icon={ArrowDownToLine}
          label="Total Download"
          value={formatBytes(totalDownload)}
          borderClass="border-l-emerald-500"
          colorClass="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"
          loading={loading}
          chartData={downloadSpark}
          chartColor="#10b981"
        />
        <LogStatCard
          icon={ArrowUpFromLine}
          label="Total Upload"
          value={formatBytes(totalUpload)}
          borderClass="border-l-indigo-500"
          colorClass="bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20"
          loading={loading}
          chartData={uploadSpark}
          chartColor="#6366f1"
        />
        <LogStatCard
          icon={Activity}
          label="Active Now"
          value={filteredHistory.filter(h => h.status === 'active').length}
          borderClass="border-l-amber-500"
          colorClass="bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20"
          loading={loading}
          chartData={activeSpark}
          chartColor="#f59e0b"
        />
      </div>

      {/* Filters */}
      <div className="card-glass p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label-custom">Target Router</label>
            <select
              value={selectedRouter || ''}
              onChange={(e) => setSelectedRouter(parseInt(e.target.value))}
              className="input-custom bg-white/5 border-transparent"
            >
              {savedRouters.map((r) => (
                <option key={r.id} value={r.id} className="bg-surface">
                  {r.name} ({r.ip})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-custom">Filter by Status</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-custom bg-white/5 border-transparent"
            >
              <option value="all" className="bg-surface">All Records</option>
              <option value="active" className="bg-surface">Currently Active</option>
              <option value="offline" className="bg-surface">Offline (Used)</option>
              <option value="unused" className="bg-surface">Unused Vouchers</option>
            </select>
          </div>

          <div>
            <label className="label-custom">Search Logs</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type="text"
                placeholder="Search username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-custom pl-10 bg-white/5 border-transparent focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="card-glass overflow-hidden">
        {loading ? (
           <div className="p-4 space-y-4">
             <div className="skeleton h-10 w-full" />
             <div className="skeleton h-10 w-full" />
             <div className="skeleton h-10 w-full" />
             <div className="skeleton h-10 w-full" />
             <div className="skeleton h-10 w-full" />
           </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16 text-textMuted flex flex-col items-center">
            <CalendarDays size={48} className="opacity-20 mb-4" />
            <p className="text-lg font-medium text-white mb-1">No Records Found</p>
            <p className="text-sm">No usage history matches your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scroll-custom">
            <table className="table-custom w-full">
              <thead>
                <tr>
                  <th>Session Details</th>
                  <th>Timestamps</th>
                  <th>Duration</th>
                  <th>Download (Tx)</th>
                  <th>Upload (Rx)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((entry) => (
                  <tr key={entry.id} className="group hover:bg-white/5">
                    <td className="font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-surfaceHover flex items-center justify-center border border-white/5 text-primary">
                          {entry.userName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        {entry.userName || 'Unknown'}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs space-y-1">
                        <p className="text-textMuted">In: <span className="text-white">{entry.loginTime || '-'}</span></p>
                        <p className="text-textMuted">Out: <span className="text-white">{entry.logoutTime || '-'}</span></p>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs px-2 py-1 bg-white/5 rounded-md text-textMuted">
                        {entry.rawUptime}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-sm">
                        <Download size={14} className="rotate-180" />
                        {formatBytes(entry.bytesOut)}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-indigo-400 font-mono text-sm">
                        <Download size={14} />
                        {formatBytes(entry.bytesIn)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        entry.status === 'active' ? 'badge-success' : 
                        entry.status === 'offline' ? 'badge-info' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {entry.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageHistory;
