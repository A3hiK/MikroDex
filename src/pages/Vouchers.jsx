import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Ticket, Search, Trash2, Loader, AlertCircle, Check, Printer } from 'lucide-react';
import VoucherPrintLayout from '../components/VoucherPrintLayout';
import { useStore } from '../store/store';
import MikroTikService from '../services/MikroTikService';
import DatabaseService from '../services/DatabaseService';

const Vouchers = () => {
  const { router, settings } = useStore();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [showVoucherGen, setShowVoucherGen] = useState(false);
  const [genMessage, setGenMessage] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [formData, setFormData] = useState({
    count: 10,
    prefix: 'user_',
    length: 5,
    profile: 'default',
  });
  const [usedSet, setUsedSet] = useState(new Set());
  const [selectedForPrint, setSelectedForPrint] = useState([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    if (router.connected && router.ip) {
      try {
        const stored = JSON.parse(localStorage.getItem(`used_vouchers_${router.ip}`) || '[]');
        setUsedSet(new Set(stored));
      } catch {
        setUsedSet(new Set());
      }
      fetchVouchers();
      fetchProfiles();
    }
  }, [router.connected, router.ip]);

  const fetchProfiles = async () => {
    try {
      const result = await MikroTikService.getHotspotProfiles();
      if (result.success && result.data.length > 0) {
        setProfiles(result.data);
        setFormData(prev => ({ ...prev, profile: result.data[0].name }));
      } else {
        setProfiles([{ id: 'default', name: 'default' }]);
      }
    } catch {
      setProfiles([{ id: 'default', name: 'default' }]);
    }
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const [usersResult, activeResult] = await Promise.all([
        MikroTikService.getHotspotUsers(),
        MikroTikService.getOnlineUsers()
      ]);

      if (usersResult.success) {
        const activeSessions = activeResult.success ? activeResult.data : [];
        let newUsedAdded = false;
        
        // Use functional state update to always have latest set
        setUsedSet(prevSet => {
          const currentSet = new Set(prevSet);
          
          const voucherUsers = usersResult.data
            .filter(u => u.comment && u.comment.includes('Generated Voucher'))
            .map(u => {
               const activeSession = activeSessions.find(a => a.name === u.name);
               const isNowUsed = activeSession || (u.uptime && u.uptime !== '0s' && u.uptime !== '0') || (u['bytes-out'] && parseInt(u['bytes-out']) > 0);
               
               if (isNowUsed && !currentSet.has(u.name)) {
                 currentSet.add(u.name);
                 newUsedAdded = true;

                 // Record sale automatically
                 const state = useStore.getState();
                 const price = (state.settings?.profilePrices || {})[u.profile] || 0;
                 if (state.router.ip) {
                   DatabaseService.saveSale(state.router.ip, u.name, u.profile, price);
                 }
               }

               if (activeSession) {
                 return { 
                   ...u, 
                   isOnline: true, 
                   activeLoginTime: activeSession.loginTime, 
                   activeBytesOutFormatted: activeSession.bytesOut 
                 };
               }
               return { ...u, isOnline: false };
            });
            
          setVouchers(voucherUsers);

          if (newUsedAdded) {
            localStorage.setItem(`used_vouchers_${router.ip}`, JSON.stringify(Array.from(currentSet)));
            return currentSet;
          }
          return prevSet;
        });
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomString = (length) => {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerate = async () => {
    if (formData.count < 1 || formData.count > 100) {
      setGenMessage({ type: 'error', text: 'Count must be between 1 and 100' });
      return;
    }
    if (formData.length < 3 || formData.length > 10) {
      setGenMessage({ type: 'error', text: 'Length must be between 3 and 10' });
      return;
    }
    setGenLoading(true);
    setGenMessage(null);
    let success = 0;
    try {
      for (let i = 0; i < formData.count; i++) {
        const pin = formData.prefix + generateRandomString(formData.length);
        const result = await MikroTikService.createHotspotUser({
          name: pin, password: pin,
          profile: formData.profile,
          comment: 'Generated Voucher',
        });
        if (result.success) success++;
        else throw new Error(`Failed on voucher ${i + 1}: ${result.message}`);
      }
      setGenMessage({ type: 'success', text: `✓ ${success} vouchers generated successfully!` });
      fetchVouchers();
      setTimeout(() => {
        setShowVoucherGen(false);
        setGenMessage(null);
      }, 2000);
    } catch (err) {
      setGenMessage({ type: 'error', text: err.message });
    } finally {
      setGenLoading(false);
    }
  };

  const handleSelectForPrint = (voucher) => {
    setSelectedForPrint(prev => {
      if (prev.find(v => v.id === voucher.id)) {
        return prev.filter(v => v.id !== voucher.id);
      }
      return [...prev, voucher];
    });
  };

  const handlePrintClick = () => {
    if (selectedForPrint.length === 0) return;
    setShowPrintPreview(true);
  };

  const handleConfirmPrint = () => {
    window.print();
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const result = await MikroTikService.deleteHotspotUser(id);
      if (result.success) {
        setConfirmDelete(null);
        setUsedSet(prev => {
          const voucherToDelete = vouchers.find(v => v.id === id);
          if (voucherToDelete && prev.has(voucherToDelete.name)) {
            const newSet = new Set(prev);
            newSet.delete(voucherToDelete.name);
            localStorage.setItem(`used_vouchers_${router.ip}`, JSON.stringify(Array.from(newSet)));
            return newSet;
          }
          return prev;
        });
        fetchVouchers();
      }
    } catch (error) {
      console.error('Error deleting voucher:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUsed = (name) => {
    const voucher = vouchers.find(v => v.name === name);
    if (voucher && router.ip) {
      const price = (settings?.profilePrices || {})[voucher.profile] || 0;
      DatabaseService.saveSale(router.ip, voucher.name, voucher.profile, price);
    }

    setUsedSet(prev => {
      const newSet = new Set(prev);
      newSet.add(name);
      localStorage.setItem(`used_vouchers_${router.ip}`, JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const isUsed = (v) => {
    if (usedSet.has(v.name)) return true;
    if (v.isOnline) return true;
    if (v.uptime && v.uptime !== '0s' && v.uptime !== '0') return true;
    if (v['bytes-out'] && parseInt(v['bytes-out']) > 0) return true;
    return false;
  };

  const unusedVouchers = vouchers.filter(v => !isUsed(v));
  const usedVouchers = vouchers.filter(v => isUsed(v));

  const filteredUnused = unusedVouchers.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.profile && v.profile.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUsed = usedVouchers.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.profile && v.profile.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!router.connected) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="card-glass p-10 max-w-sm text-center relative hover:shadow-[0_0_30px_rgba(244,63,94,0.1)] transition-all duration-500">
          <div className="absolute inset-0 bg-rose-500/5 blur-xl rounded-full -z-10"></div>
          <div className="w-20 h-20 mx-auto bg-surfaceHover rounded-full flex items-center justify-center mb-6">
            <Ticket size={40} className="text-textMuted transition-colors group-hover:text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Router Disconnected</h2>
          <p className="text-sm text-textMuted mb-6">Connect your MikroTik router to view vouchers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Vouchers</h1>
          <p className="text-textMuted text-sm">Generate and manage WiFi vouchers.</p>
        </div>
        <button
          onClick={() => { setShowVoucherGen(!showVoucherGen); setGenMessage(null); }}
          className="btn-primary"
        >
          {showVoucherGen ? 'Cancel' : <><Ticket size={18} /> Generate Vouchers</>}
        </button>
      </div>

      {/* Inline Voucher Generator Form */}
      {showVoucherGen && (
        <div className="card-glass p-6 animate-in slide-in-from-top-4 border-l-4 border-l-primary relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 blur-[60px] rounded-full pointer-events-none"></div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
            <Ticket size={18} className="text-primary" /> Generate New Vouchers
          </h3>

          {genMessage && (
            <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 text-sm border relative z-10 ${
              genMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <AlertCircle size={18} />
              {genMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            <div>
              <label className="label-custom">Number of Vouchers</label>
              <input
                type="number" min="1" max="100"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 0 })}
                className="input-custom"
                disabled={genLoading}
              />
            </div>
            <div>
              <label className="label-custom">Prefix (Optional)</label>
              <input
                type="text" placeholder="e.g. vip_"
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                className="input-custom"
                disabled={genLoading}
              />
            </div>
            <div>
              <label className="label-custom">Random String Length</label>
              <input
                type="number" min="3" max="10"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: parseInt(e.target.value) || 0 })}
                className="input-custom"
                disabled={genLoading}
              />
            </div>
            <div>
              <label className="label-custom">Assign to Profile</label>
              <select
                value={formData.profile}
                onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                className="input-custom"
                disabled={genLoading}
              >
                {profiles.map((p) => (
                  <option key={p.id || p.name} value={p.name} className="bg-surface text-text">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 relative z-10">
            <button
              onClick={() => { setShowVoucherGen(false); setGenMessage(null); }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleGenerate} disabled={genLoading} className="btn-primary shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-shadow">
              {genLoading ? <><Loader size={16} className="animate-spin" /> Generating...</> : 'Generate Now'}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input
            type="text"
            placeholder="Search vouchers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-custom pl-10 bg-white/5 border-transparent focus:border-primary"
          />
        </div>
        <div className="flex gap-3">
          {selectedForPrint.length > 0 && (
            <button onClick={handlePrintClick} className="btn-secondary text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Printer size={18} /> Print ({selectedForPrint.length})
            </button>
          )}
          <button onClick={fetchVouchers} disabled={loading} className="btn-secondary">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card-glass max-w-sm w-full mx-4 p-6 border border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.15)] animate-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={24} className="text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Delete Voucher?</h3>
            <p className="text-textMuted text-sm mb-6">Are you sure you want to delete this voucher? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 btn-primary bg-rose-500 hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)] border-none">Delete</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showPrintPreview && createPortal(
        <div className="fixed inset-0 z-[999999] bg-black/90 flex flex-col backdrop-blur-md overflow-hidden animate-in fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-surface border-b border-white/10 p-4 flex justify-between items-center shrink-0 shadow-lg relative z-10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Printer size={20} className="text-primary"/> Print Preview</h2>
            <div className="flex gap-3">
              <button onClick={() => setShowPrintPreview(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleConfirmPrint} className="btn-primary shadow-[0_0_20px_rgba(6,182,212,0.3)]"><Printer size={16}/> Print Now</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-900/80 w-full relative">
             <div className="w-fit mx-auto origin-top transform scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100 pb-32 transition-transform">
               <VoucherPrintLayout vouchers={selectedForPrint} isPreview={true} />
             </div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Unused Vouchers (Main Grid) */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            Available Vouchers ({filteredUnused.length})
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              Array.from({length: 6}).map((_, i) => (
                <div key={i} className="relative p-4 rounded-xl border border-white/5 bg-white/5 card-glass shadow-glass">
                  <div className="skeleton h-5 w-28 mb-2 rounded" />
                  <div className="skeleton h-2.5 w-20 mb-4 rounded" />
                  <div className="skeleton h-12 w-full rounded-lg mb-2" />
                  <div className="skeleton h-2 w-16 mx-auto rounded" />
                </div>
              ))
            ) : filteredUnused.length === 0 ? (
              <div className="col-span-full text-center py-12 text-textMuted card-glass">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Ticket size={32} className="opacity-40" />
                </div>
                <p className="text-lg font-bold text-white mb-1">No Available Vouchers</p>
                <p className="text-sm">Generate some vouchers to get started.</p>
              </div>
            ) : (
              filteredUnused.map((voucher) => {
                const isSelected = selectedForPrint.some(v => v.id === voucher.id);

                return (
                  <div key={voucher.id} onClick={() => handleSelectForPrint(voucher)} className={`relative group p-4 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-between ${isSelected ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-[#ffffff]' : 'border-gray-400/60 bg-[#ffffff] hover:border-gray-400 hover:shadow-md'}`}>

                    {/* Top Row: Title & Actions */}
                    <div className="w-full relative flex justify-center items-start mb-1.5">
                      <h3 className="text-[#00bcd4] font-bold text-lg tracking-tight">MikroDex WiFi</h3>
                      
                      {/* Actions (visible on hover) */}
                      <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleMarkAsUsed(voucher.name); }} className="w-6 h-6 rounded-md bg-[#d1fae5] text-[#10b981] flex items-center justify-center hover:bg-[#a7f3d0] transition-colors shadow-sm" title="Mark as Sold">
                          <Check size={14} strokeWidth={3} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(voucher.id); }} className="w-6 h-6 rounded-md bg-[#ffe4e6] text-[#f43f5e] flex items-center justify-center hover:bg-[#fecdd3] transition-colors shadow-sm" title="Delete">
                          <Trash2 size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Package Info */}
                    <p className="text-[#64748b] text-[13px] mb-3 font-medium">Package: {voucher.profile || 'default'}</p>

                    {/* PIN Box */}
                    <div className={`w-full rounded-xl py-3 flex flex-col items-center justify-center mb-3 transition-colors ${isSelected ? 'bg-[#e2e8f0]' : 'bg-[#cbd5e1]/70'}`}>
                      <span className="text-[#64748b] text-[10px] font-semibold uppercase tracking-wide mb-1.5">PIN / Password</span>
                      <span className="text-[#1e293b] text-2xl font-bold font-mono tracking-widest">{voucher.name}</span>
                    </div>

                    {/* Footer */}
                    <p className="text-[#94a3b8] text-[10px] font-medium mb-1">Ready to connect!</p>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Used Vouchers List */}
        <div className="w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            Used Vouchers ({filteredUsed.length})
          </h2>
          
          <div className="space-y-3">
            {loading ? (
              Array.from({length: 5}).map((_, i) => (
                <div key={i} className="card-glass p-4 flex justify-between bg-white/5 border border-white/5">
                  <div className="space-y-2.5 w-full"><div className="skeleton h-5 w-24 rounded"/><div className="skeleton h-3 w-32 rounded"/><div className="skeleton h-3 w-16 rounded"/></div>
                  <div className="skeleton h-8 w-8 rounded-lg shrink-0"/>
                </div>
              ))
            ) : filteredUsed.length === 0 ? (
              <div className="text-center py-8 text-textMuted bg-surface rounded-xl border border-white/5 text-sm card-glass shadow-glass">
                No vouchers used yet.
              </div>
            ) : (
              filteredUsed.map((voucher) => (
                <div key={voucher.id} className="card-glass p-4 flex justify-between items-center bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 transition-all group hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none group-hover:scale-150 transition-transform"></div>
                  <div className="relative z-10">
                    <div className="font-mono font-bold text-emerald-400 text-lg mb-1">{voucher.name}</div>
                    <div className="text-xs text-textMuted font-medium">
                      {voucher.isOnline ? (
                        <>In: <span className="text-white">{voucher.activeLoginTime}</span></>
                      ) : (
                        <>Dur: <span className="text-white">{voucher.uptime}</span></>
                      )}
                      {voucher.isOnline && <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20 shadow-[0_0_8px_rgba(34,211,238,0.2)]">Online</span>}
                    </div>
                    {voucher.isOnline ? (
                      <div className="text-[10px] text-textMuted mt-1">Tx: {voucher.activeBytesOutFormatted}</div>
                    ) : (
                      voucher['bytes-out'] && (
                        <div className="text-[10px] text-textMuted mt-1">Tx: {(parseInt(voucher['bytes-out']) / 1048576).toFixed(1)} MB</div>
                      )
                    )}
                  </div>
                  <button onClick={() => setConfirmDelete(voucher.id)} className="p-2 text-rose-500/50 hover:text-white hover:bg-rose-500 rounded-lg transition-all relative z-10 opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-rose-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
      </div>

      {/* Hidden Print Layout */}
      <VoucherPrintLayout vouchers={selectedForPrint} />
    </div>
  );
};

export default Vouchers;
