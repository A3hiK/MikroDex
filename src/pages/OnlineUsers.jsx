import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Loader, Wifi, Power } from 'lucide-react';
import { useStore } from '../store/store';
import MikroTikService from '../services/MikroTikService';

const OnlineUsers = () => {
  const { onlineUsers, setOnlineUsers, router } = useStore();
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);

  const fetchOnlineUsers = useCallback(async () => {
    if (!router.connected) return;

    setLoading(true);
    try {
      const result = await MikroTikService.getOnlineUsers();
      if (result.success) {
        setOnlineUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    } finally {
      setLoading(false);
    }
  }, [router.connected, setOnlineUsers]);

  const handleDisconnect = async (id) => {
    if (!window.confirm('Are you sure you want to disconnect this user?')) return;
    
    setLoading(true);
    const result = await MikroTikService.disconnectActiveUser(id);
    if (result.success) {
      await fetchOnlineUsers();
    } else {
      alert(result.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.connected) {
      fetchOnlineUsers();
    }
  }, [router.connected, fetchOnlineUsers]);

  useEffect(() => {
    if (!autoRefresh || !router.connected) return;

    const interval = setInterval(fetchOnlineUsers, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, router.connected, fetchOnlineUsers]);

  if (!router.connected) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="card-glass p-10 max-w-sm text-center">
          <div className="w-20 h-20 mx-auto bg-surfaceHover rounded-full flex items-center justify-center mb-6">
            <Activity size={40} className="text-textMuted" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Router Disconnected</h2>
          <p className="text-sm text-textMuted mb-6">Connect your MikroTik router to view online users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Active Sessions</h1>
          <p className="text-textMuted text-sm">Real-time view of currently connected hotspot users</p>
        </div>
      </div>

      <div className="card-glass p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOnlineUsers}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {loading ? 'Refreshing' : 'Refresh'}
          </button>
          
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <label className="text-sm flex items-center gap-2 cursor-pointer text-white">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-primary"
                />
              </div>
              Auto Sync
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="input-custom py-1 px-2 text-xs w-28 bg-surface border-white/10"
              >
                <option value={3}>Every 3s</option>
                <option value={5}>Every 5s</option>
                <option value={10}>Every 10s</option>
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary font-medium">
          <Wifi size={18} />
          <span>{onlineUsers.length} Users Online</span>
        </div>
      </div>

      <div className="card-glass">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-16 text-textMuted flex flex-col items-center">
            <Activity size={48} className="opacity-20 mb-4" />
            <p className="text-lg font-medium text-white mb-1">No Active Users</p>
            <p className="text-sm">There are currently no users logged into the hotspot.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scroll-custom">
            <table className="table-custom w-full">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>IP Address</th>
                  <th>MAC Address</th>
                  <th>Data Out</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {onlineUsers.map((user) => (
                  <tr key={user.id} className="group">
                    <td className="font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/5 text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td className="font-mono text-xs text-textMuted group-hover:text-primary transition-colors">{user.address}</td>
                    <td className="font-mono text-xs text-textMuted">{user.macAddress}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${Math.min((parseInt(user.bytesOut) || 0) / 1000000, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-16">{user.bytesOut}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Active
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDisconnect(user.id)}
                        className="p-2 text-textMuted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Disconnect User"
                      >
                        <Power size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {autoRefresh && (
        <div className="flex items-center justify-end gap-2 text-xs text-textMuted">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></div>
          Live Sync Active ({refreshInterval}s)
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;
