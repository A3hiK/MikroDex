import React, { useState, useEffect } from 'react';
import { Ticket, X, Printer, Loader, AlertCircle } from 'lucide-react';
import MikroTikService from '../services/MikroTikService';

const VoucherGenerator = ({ onClose, onComplete, profiles }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [generatedVouchers, setGeneratedVouchers] = useState(null);
  
  const [formData, setFormData] = useState({
    count: 10,
    prefix: 'user_',
    length: 5,
    profile: profiles.length > 0 ? profiles[0].name : 'default',
  });

  const generateRandomString = (length) => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // removed confusing chars i, l, o, 1, 0
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerate = async () => {
    if (formData.count < 1 || formData.count > 100) {
      setMessage({ type: 'error', text: 'Count must be between 1 and 100' });
      return;
    }
    if (formData.length < 3 || formData.length > 10) {
      setMessage({ type: 'error', text: 'Length must be between 3 and 10' });
      return;
    }

    setLoading(true);
    setMessage(null);
    const newVouchers = [];

    try {
      for (let i = 0; i < formData.count; i++) {
        const pin = formData.prefix + generateRandomString(formData.length);
        const username = pin;
        const password = pin;
        
        const result = await MikroTikService.createHotspotUser({
          name: username,
          password: password,
          profile: formData.profile,
          comment: 'Generated Voucher',
        });

        if (result.success) {
          newVouchers.push({ username, password, profile: formData.profile });
        } else {
          throw new Error(`Failed on voucher ${i + 1}: ${result.message}`);
        }
      }
      setGeneratedVouchers(newVouchers);
      setMessage({ type: 'success', text: `Successfully generated ${newVouchers.length} vouchers.` });
      if (onComplete) onComplete();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      // If some were generated, still show them
      if (newVouchers.length > 0) {
        setGeneratedVouchers(newVouchers);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (window.electron) {
      await window.electron.invoke('app:print');
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card-glass w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95">
        
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="text-primary" /> Voucher Generator
          </h2>
          <button onClick={onClose} className="p-2 text-textMuted hover:text-white transition-colors" disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto scroll-custom flex-1">
          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm border ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <AlertCircle size={18} />
              {message.text}
            </div>
          )}

          {!generatedVouchers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label-custom">Number of Vouchers</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.count}
                    onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 0 })}
                    className="input-custom"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="label-custom">Prefix (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. vip_"
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                    className="input-custom"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label-custom">Random String Length</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: parseInt(e.target.value) || 0 })}
                    className="input-custom"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="label-custom">Assign to Profile</label>
                  <select
                    value={formData.profile}
                    onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                    className="input-custom"
                    disabled={loading}
                  >
                    {profiles.map((p) => (
                      <option key={p.id || p.name} value={p.name} className="bg-surface text-text">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Generated Vouchers Preview</h3>
              </div>
              
              {/* Vouchers Preview Container */}
              <div className="bg-white p-8 rounded-xl text-black h-[400px] overflow-y-auto">
                <div className="print-grid grid grid-cols-2 md:grid-cols-3 gap-4">
                  {generatedVouchers.map((v, i) => (
                    <div key={i} className="ticket border-2 border-dashed border-gray-300 p-4 rounded-xl text-center bg-gray-50">
                      <h4 className="font-bold text-lg mb-2 text-primary">MikroDex WiFi</h4>
                      <p className="text-sm text-gray-500 mb-1">Package: {v.profile}</p>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 mb-2">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Username</div>
                        <div className="font-mono font-bold text-lg">{v.username}</div>
                        <div className="w-full h-px bg-gray-100 my-2"></div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Password</div>
                        <div className="font-mono font-bold text-lg">{v.password}</div>
                      </div>
                      <p className="text-[10px] text-gray-400">Enjoy your connection!</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-white/5">
          <button onClick={onClose} disabled={loading} className="btn-secondary">
            Close
          </button>
          {!generatedVouchers && (
            <button onClick={handleGenerate} disabled={loading} className="btn-primary">
              {loading ? <><Loader size={16} className="animate-spin" /> Generating...</> : 'Generate Now'}
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default VoucherGenerator;
