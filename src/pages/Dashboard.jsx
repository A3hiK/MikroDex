import React, { useEffect, useState } from 'react';
import { Users, Router, Zap, Activity, ArrowUpRight, ArrowDownRight, Cpu, Banknote, Network, Wifi, Cable } from 'lucide-react';
import { useStore } from '../store/store';
import MikroTikService from '../services/MikroTikService';
import DatabaseService from '../services/DatabaseService';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon: Icon, label, value, change, subtext, colorClass, chartData, chartColor, loading }) => {
  return (
    <div className="card-glass group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
      {/* Sparkline Background */}
      {chartData && !loading && (
        <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-300">
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
      <div className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-textMuted mb-2">{label}</p>
            {loading ? (
              <div className="h-8 w-24 skeleton mb-2 rounded-md" />
            ) : (
              <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
            )}
            {loading ? (
              <div className="h-4 w-32 skeleton rounded-md" />
            ) : (
              <>
                {change && (
                  <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${change.positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {change.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {change.value}% <span className="opacity-80 ml-1">{change.text}</span>
                  </div>
                )}
                {subtext && (
                  <div className="text-xs font-medium text-textMuted mt-1">
                    {subtext}
                  </div>
                )}
              </>
            )}
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${colorClass}`}>
            <Icon size={24} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { stats, router, setStats, onlineUsers, users, setUsers } = useStore();
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState(null);
  const [interfaces, setInterfaces] = useState([]);
  const [logs, setLogs] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [usedSet, setUsedSet] = useState(new Set());
  const [salesData, setSalesData] = useState([]);

  // Mock data for sparklines
  const [cpuSpark, setCpuSpark] = useState([{value: 10}, {value: 15}, {value: 12}, {value: 20}, {value: 18}, {value: 25}]);
  const revenueSpark = [{value: 100}, {value: 300}, {value: 200}, {value: 500}, {value: 400}, {value: 800}, {value: 1200}];
  const usersSpark = [{value: 50}, {value: 55}, {value: 52}, {value: 60}, {value: 58}, {value: 70}];
  const onlineSpark = [{value: 10}, {value: 15}, {value: 12}, {value: 20}, {value: 18}, {value: 25}];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (router.connected && router.ip) {
      try {
        const stored = JSON.parse(localStorage.getItem(`used_vouchers_${router.ip}`) || '[]');
        setUsedSet(new Set(stored));
      } catch {
        setUsedSet(new Set());
      }
    }
    
    if (router.connected && router.ip) {
       const fetchSales = async () => {
         const sales = await DatabaseService.getSales(router.ip);
         setSalesData(sales);
       };
       fetchSales();
       const intId = setInterval(fetchSales, 10000);
       return () => clearInterval(intId);
    }
  }, [router.connected, router.ip]);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const totalVouchersCount = users.filter(v => v.comment?.includes('Generated Voucher')).length;
  const soldVouchersCount = salesData.length;
  const totalRevenue = salesData.reduce((sum, s) => sum + s.price, 0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!router.connected) return;

      try {
        const onlineResult = await MikroTikService.getOnlineUsers();
        if (onlineResult.success) {
          setStats({ onlineCount: onlineResult.data.length });
        }
        const usersResult = await MikroTikService.getHotspotUsers();
        if (usersResult.success) {
          setUsers(usersResult.data);
          setStats(prev => ({ ...prev, totalUsers: usersResult.data.length }));
        }
        const resourceResult = await MikroTikService.getSystemResource();
        if (resourceResult.success) {
          setResource(resourceResult.data);
          // Add to cpu spark
          setCpuSpark(prev => {
            const newArr = [...prev, {value: parseFloat(resourceResult.data['cpu-load'] || 0)}];
            if(newArr.length > 10) newArr.shift();
            return newArr;
          });
        }
        const interfacesResult = await MikroTikService.getInterfaces();
        if (interfacesResult.success) {
          setInterfaces(interfacesResult.data);
        }
        const logsResult = await MikroTikService.getLogs();
        if (logsResult.success) {
          setLogs(logsResult.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [router.connected, setStats]);

  if (!router.connected) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="card-glass p-10 max-w-sm text-center relative hover:shadow-[0_0_30px_rgba(244,63,94,0.1)] transition-all duration-500">
          <div className="absolute inset-0 bg-rose-500/5 blur-xl rounded-full -z-10"></div>
          <div className="w-20 h-20 mx-auto bg-surfaceHover rounded-full flex items-center justify-center mb-6">
            <Router size={40} className="text-textMuted transition-colors group-hover:text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Router Disconnected</h2>
          <p className="text-sm text-textMuted mb-6">Connect your MikroTik router to view the dashboard and statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-3">{router.name || 'Network Command Center'}</h1>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="skeleton h-8 w-32" />
              <div className="skeleton h-8 w-32" />
              <div className="skeleton h-8 w-32" />
            </div>
          ) : resource ? (
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-md border border-white/10 text-textMuted hover:bg-white/10 transition-colors">
                <Router size={14} className="text-primary" /> {resource['board-name'] || 'MikroTik Router'}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-md border border-white/10 text-textMuted hover:bg-white/10 transition-colors">
                <Cpu size={14} className="text-indigo-400" /> RouterOS v{resource.version || '7.x'}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all">
                <Activity size={14} /> Uptime: {resource.uptime || '--'}
              </span>
            </div>
          ) : (
            <p className="text-textMuted text-sm">Waiting for telemetry...</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-surface border border-white/5 px-4 py-2 rounded-xl shadow-glass hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-shadow">
            <div className="flex items-center gap-2 text-textMuted text-sm font-medium border-r border-white/10 pr-3">
              {formattedDate}
            </div>
            <div className="text-white font-mono font-bold tracking-wider">
              {formattedTime}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Banknote}
          label="Total Revenue"
          value={`৳ ${totalRevenue}`}
          subtext={`Sold: ${soldVouchersCount} | Total: ${totalVouchersCount}`}
          colorClass="bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20"
          chartData={revenueSpark}
          chartColor="#f59e0b"
          loading={loading && totalRevenue === 0}
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={users.length}
          change={{ positive: true, value: 12, text: 'vs last month' }}
          colorClass="bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20"
          chartData={usersSpark}
          chartColor="#6366f1"
          loading={loading && users.length === 0}
        />
        <StatCard
          icon={Activity}
          label="Online Users"
          value={onlineUsers.length}
          change={{ positive: true, value: 5, text: 'active now' }}
          colorClass="bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-cyan-500/20"
          chartData={onlineSpark}
          chartColor="#06b6d4"
          loading={loading && onlineUsers.length === 0}
        />
        <StatCard
          icon={Cpu}
          label="CPU Load"
          value={resource ? `${resource['cpu-load']}%` : '0%'}
          colorClass="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20"
          chartData={cpuSpark}
          chartColor="#10b981"
          loading={loading && !resource}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Interface Status */}
        <div className="card-glass xl:col-span-2 flex flex-col h-[400px]">
          <div className="card-glass-header flex flex-wrap items-center justify-between gap-4">
            <h3 className="flex items-center gap-2 text-white">
              <Network size={18} className="text-primary" /> Interface Status
            </h3>
            <span className="text-xs text-textMuted px-2 py-1 bg-white/5 rounded-md">Live Update</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto scroll-custom grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
            {loading && interfaces.length === 0 ? (
              Array.from({length: 4}).map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 h-28 flex flex-col justify-between">
                  <div className="flex justify-between"><div className="skeleton h-8 w-8 rounded-lg"/><div className="skeleton h-4 w-16 rounded-md"/></div>
                  <div className="grid grid-cols-2 gap-2"><div className="skeleton h-6 w-16"/><div className="skeleton h-6 w-16"/></div>
                </div>
              ))
            ) : interfaces.filter(iface => ['PORT-1-ISP', 'PORT-2-PC', 'PORT-4-PPOE', 'PORT-5-HOTSPOT'].includes(iface.name)).map((iface, i) => {
              const isRunning = iface.running === 'true';
              const isWlan = iface.type === 'wlan';
              return (
                <div key={i} className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl -z-10 transition-colors duration-500 ${isRunning ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-rose-500/10'}`}></div>
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-all duration-300 ${isRunning ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-surface text-textMuted'}`}>
                        {isWlan ? <Wifi size={20} /> : <Cable size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{iface.name}</h4>
                        <p className="text-[10px] text-textMuted uppercase tracking-wider">{iface.type}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-colors ${isRunning ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                      {isRunning ? 'Running' : 'Down'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[10px] text-textMuted uppercase mb-1">TX (Sent)</p>
                      <p className="font-mono text-sm text-indigo-400">{formatBytes(iface['tx-byte'] || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-textMuted uppercase mb-1">RX (Received)</p>
                      <p className="font-mono text-sm text-emerald-400">{formatBytes(iface['rx-byte'] || 0)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card-glass flex flex-col h-[400px]">
          <div className="card-glass-header">
            <h3 className="flex items-center gap-2 text-white">
              <Zap size={18} className="text-amber-400" /> Live Logs
            </h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto scroll-custom space-y-3">
            {loading && logs.length === 0 ? (
              Array.from({length: 6}).map((_, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-xl bg-white/5"><div className="skeleton h-2 w-2 rounded-full mt-1 shrink-0"/><div className="w-full space-y-2"><div className="skeleton h-4 w-full"/><div className="skeleton h-3 w-2/3"/></div></div>
              ))
            ) : logs.length > 0 ? logs.map((activity, i) => {
              const isError = activity.topics?.includes('error') || activity.message?.toLowerCase().includes('fail');
              const isSuccess = activity.topics?.includes('info') && activity.message?.toLowerCase().includes('logged in');
              return (
              <div
                key={i}
                className="group flex items-start gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 transition-all duration-200"
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 transition-shadow ${
                  isSuccess ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] group-hover:shadow-[0_0_12px_rgba(16,185,129,0.8)]' :
                  isError ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] group-hover:shadow-[0_0_12px_rgba(244,63,94,0.8)]' :
                  'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white truncate">{activity.message}</p>
                    <span className="text-[10px] text-textMuted whitespace-nowrap">{activity.time}</span>
                  </div>
                  <p className="text-xs text-textMuted truncate">
                    {activity.topics}
                  </p>
                </div>
              </div>
            )}) : (
              <div className="text-center text-textMuted text-sm mt-10">No recent logs available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
