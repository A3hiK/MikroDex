import React, { useEffect, useState } from 'react';
import { Banknote, BarChart3, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useStore } from '../store/store';
import DatabaseService from '../services/DatabaseService';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const Revenue = () => {
  const { router } = useStore();
  const [salesData, setSalesData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.connected && router.ip) {
       const fetchSales = async () => {
         const sales = await DatabaseService.getSales(router.ip);
         setSalesData(sales);
         
         const last7Days = [];
         for(let i=6; i>=0; i--) {
           const d = new Date();
           d.setDate(d.getDate() - i);
           const dateStr = d.toISOString().split('T')[0];
           
           const daySales = sales.filter(s => s.soldAt.startsWith(dateStr));
           const revenue = daySales.reduce((sum, s) => sum + s.price, 0);
           
           last7Days.push({
             name: d.toLocaleDateString('en-US', { weekday: 'short' }),
             fullDate: dateStr,
             revenue: revenue,
             count: daySales.length
           });
         }
         setChartData(last7Days);
         setRecentSales([...sales].reverse().slice(0, 10));
         setLoading(false);
       };
       fetchSales();
       const intId = setInterval(fetchSales, 10000);
       return () => clearInterval(intId);
    }
  }, [router.connected, router.ip]);

  const totalRevenue = salesData.reduce((sum, s) => sum + s.price, 0);
  const totalSales = salesData.length;

  if (!router.connected) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="card-glass p-10 max-w-sm text-center relative hover:shadow-[0_0_30px_rgba(244,63,94,0.1)] transition-all duration-500">
          <div className="absolute inset-0 bg-rose-500/5 blur-xl rounded-full -z-10"></div>
          <div className="w-20 h-20 mx-auto bg-surfaceHover rounded-full flex items-center justify-center mb-6">
            <Banknote size={40} className="text-textMuted transition-colors group-hover:text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Router Disconnected</h2>
          <p className="text-sm text-textMuted mb-6">Connect your MikroTik router to view revenue analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Revenue Analytics</h1>
          <p className="text-textMuted text-sm">Track your voucher sales and daily income.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-glass p-8 relative overflow-hidden group hover:-translate-y-1 border-l-4 border-l-emerald-500 transition-all duration-300">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 blur-[50px] -z-10 rounded-full transition-all duration-500 group-hover:bg-emerald-500/20 group-hover:scale-150"></div>
          
          {/* Sparkline Background */}
          {!loading && chartData.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-300">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradient-revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#gradient-revenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <Banknote size={32} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-textMuted mb-2">Total Earned</p>
              <div className="flex items-end gap-3">
                {loading ? (
                  <div className="skeleton h-12 w-32 rounded-md" />
                ) : (
                  <h3 className="text-5xl font-black text-white font-mono tracking-tight">৳{totalRevenue}</h3>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card-glass p-8 relative overflow-hidden group hover:-translate-y-1 border-l-4 border-l-indigo-500 transition-all duration-300">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 blur-[50px] -z-10 rounded-full transition-all duration-500 group-hover:bg-indigo-500/20 group-hover:scale-150"></div>
          
          {/* Sparkline Background */}
          {!loading && chartData.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-300">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradient-sales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#gradient-sales)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/5 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <TrendingUp size={32} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-textMuted mb-2">Vouchers Sold</p>
              <div className="flex items-end gap-3">
                {loading ? (
                  <div className="skeleton h-12 w-24 rounded-md" />
                ) : (
                  <>
                    <h3 className="text-5xl font-black text-white font-mono tracking-tight">{totalSales}</h3>
                    <span className="text-sm font-medium text-textMuted mb-2">tickets</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glass flex flex-col h-[400px]">
          <div className="card-glass-header">
            <h3 className="flex items-center gap-2 text-white">
              <Banknote size={18} className="text-emerald-400" /> Recent Sales
            </h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto scroll-custom space-y-3">
            {loading ? (
              Array.from({length: 5}).map((_, i) => (
                <div key={i} className="flex justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="space-y-2"><div className="skeleton h-4 w-24 rounded"/><div className="skeleton h-3 w-32 rounded"/></div>
                  <div className="skeleton h-6 w-16 rounded" />
                </div>
              ))
            ) : recentSales.length > 0 ? recentSales.map((sale, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all group">
                <div>
                  <div className="font-mono text-sm font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{sale.voucherName}</div>
                  <div className="text-[11px] text-textMuted uppercase tracking-wider font-semibold">{new Date(sale.soldAt).toLocaleString()} • {sale.profile}</div>
                </div>
                <div className="text-emerald-400 font-bold font-mono text-lg">৳{sale.price}</div>
              </div>
            )) : (
              <div className="text-center py-12 text-textMuted flex flex-col items-center">
                <Banknote size={48} className="opacity-20 mb-4" />
                <p className="text-lg font-medium text-white mb-1">No Recent Sales</p>
                <p className="text-sm">Wait for users to purchase vouchers.</p>
              </div>
            )}
          </div>
        </div>

        <div className="card-glass flex flex-col h-[400px]">
          <div className="card-glass-header">
            <h3 className="flex items-center gap-2 text-white">
              <BarChart3 size={18} className="text-primary" /> Daily Breakdown
            </h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto scroll-custom space-y-3">
            {loading ? (
              Array.from({length: 5}).map((_, i) => (
                <div key={i} className="flex justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex gap-4"><div className="skeleton h-12 w-12 rounded-xl"/><div className="space-y-2 mt-1"><div className="skeleton h-4 w-20 rounded"/><div className="skeleton h-3 w-28 rounded"/></div></div>
                  <div className="skeleton h-6 w-16 rounded mt-3" />
                </div>
              ))
            ) : [...chartData].reverse().map((day, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-primary/5 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-sm font-bold text-textMuted border border-white/10 shadow-inner group-hover:border-primary/30 group-hover:text-primary transition-colors">
                    {day.name}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white mb-1 group-hover:text-primary transition-colors">{day.fullDate}</div>
                    <div className="text-[11px] text-textMuted uppercase tracking-wider font-semibold">{day.count} vouchers sold</div>
                  </div>
                </div>
                <div className="text-amber-400 font-bold font-mono text-lg">৳{day.revenue}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenue;
