import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Trash2, Eye, Loader, UserPlus, AlertCircle, Ticket } from 'lucide-react';
import { useStore } from '../store/store';
import MikroTikService from '../services/MikroTikService';

const HotspotUsers = () => {
  const { users, setUsers, router } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    profile: 'default',
    comment: '',
    rateLimit: '',
  });
  const [profiles, setProfiles] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  const [activeTab, setActiveTab] = useState('users');
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    rateLimit: '',
    sharedUsers: '1',
  });

  useEffect(() => {
    if (router.connected) {
      fetchUsers();
      fetchProfiles();
    }
  }, [router.connected]);

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await MikroTikService.getHotspotUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error fetching users: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.name || !formData.password) {
      setMessage({ type: 'error', text: 'Please fill required fields' });
      return;
    }

    setLoading(true);
    try {
      const result = await MikroTikService.createHotspotUser(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'User created successfully' });
        setFormData({ name: '', password: '', profile: 'default', comment: '', rateLimit: '' });
        setShowForm(false);
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!confirmDelete) return;
    const userId = confirmDelete;
    setConfirmDelete(null);

    setLoading(true);
    try {
      const result = await MikroTikService.deleteHotspotUser(userId);
      if (result.success) {
        setMessage({ type: 'success', text: 'User deleted successfully' });
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!profileFormData.name) {
      setMessage({ type: 'error', text: 'Profile name is required' });
      return;
    }
    setLoading(true);
    try {
      const result = await MikroTikService.createHotspotProfile(profileFormData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile created' });
        setShowProfileForm(false);
        setProfileFormData({ name: '', rateLimit: '', sharedUsers: '1' });
        fetchProfiles();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteProfile = async (id) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;
    setLoading(true);
    const result = await MikroTikService.deleteHotspotProfile(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile deleted' });
      fetchProfiles();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    setLoading(false);
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.address && user.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!router.connected) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="card-glass p-10 max-w-sm text-center">
          <div className="w-20 h-20 mx-auto bg-surfaceHover rounded-full flex items-center justify-center mb-6">
            <Users size={40} className="text-textMuted" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Router Disconnected</h2>
          <p className="text-sm text-textMuted mb-6">Connect your MikroTik router to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Hotspot Users</h1>
          <p className="text-textMuted text-sm">Manage authentication, profiles, and access.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'users' ? (
            <>
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-primary"
              >
                {showForm ? 'Cancel' : <><UserPlus size={18} /> New User</>}
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowProfileForm(!showProfileForm)}
              className="btn-primary"
            >
              {showProfileForm ? 'Cancel' : <><Plus size={18} /> New Profile</>}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-primary text-white' : 'text-textMuted hover:text-white'}`}
        >
          Users List
        </button>
        <button 
          onClick={() => setActiveTab('profiles')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profiles' ? 'bg-primary text-white' : 'text-textMuted hover:text-white'}`}
        >
          Rate Profiles
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 border ${
          message.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}>
          <AlertCircle size={18} />
          {message.text}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card-glass max-w-sm w-full mx-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Delete User?</h3>
              <p className="text-textMuted text-sm mb-6">Are you sure you want to delete this user? This action cannot be undone and they will immediately lose internet access.</p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creation Form */}
      {showForm && (
        <div className="card-glass p-6 animate-in slide-in-from-top-4 border-l-4 border-l-primary">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-primary" /> Create New Hotspot User
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label-custom">Username</label>
              <input
                type="text"
                placeholder="johndoe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-custom"
                disabled={loading}
              />
            </div>
            <div>
              <label className="label-custom">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-custom"
                disabled={loading}
              />
            </div>
            <div>
              <label className="label-custom">Profile</label>
              <select
                value={formData.profile}
                onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                className="input-custom"
                disabled={loading}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.name} className="bg-surface text-text">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-custom">Comment</label>
              <input
                type="text"
                placeholder="e.g. VIP Member"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="input-custom"
                disabled={loading}
              />
            </div>
            <div>
              <label className="label-custom">Speed Limit</label>
              <input
                type="text"
                placeholder="e.g. 5M/5M (Optional)"
                value={formData.rateLimit}
                onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })}
                className="input-custom"
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setShowForm(false);
                setFormData({ name: '', password: '', profile: 'default', comment: '', rateLimit: '' });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateUser}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? <><Loader size={16} className="animate-spin" /> Processing...</> : 'Save User'}
            </button>
          </div>
        </div>
      )}

      {/* Profile Creation Form */}
      {showProfileForm && activeTab === 'profiles' && (
        <div className="card-glass p-6 animate-in slide-in-from-top-4 border-l-4 border-l-primary">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Plus size={18} className="text-primary" /> Create New Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-custom">Profile Name</label>
              <input
                type="text"
                placeholder="e.g. 5M_Package"
                value={profileFormData.name}
                onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                className="input-custom"
                disabled={loading}
              />
            </div>
            <div>
              <label className="label-custom">Rate Limit (Rx/Tx)</label>
              <input
                type="text"
                placeholder="e.g. 5M/5M"
                value={profileFormData.rateLimit}
                onChange={(e) => setProfileFormData({ ...profileFormData, rateLimit: e.target.value })}
                className="input-custom"
                disabled={loading}
              />
              <p className="text-[10px] text-textMuted mt-1">Leave empty for unlimited</p>
            </div>
            <div>
              <label className="label-custom">Shared Users</label>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={profileFormData.sharedUsers}
                onChange={(e) => setProfileFormData({ ...profileFormData, sharedUsers: e.target.value })}
                className="input-custom"
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setShowProfileForm(false);
                setProfileFormData({ name: '', rateLimit: '', sharedUsers: '1' });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProfile}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? <><Loader size={16} className="animate-spin" /> Processing...</> : 'Save Profile'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'users' ? (
        <>
          {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input
            type="text"
            placeholder="Search by username or IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-custom pl-10 bg-white/5 border-transparent focus:border-primary"
          />
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="btn-secondary"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Table */}
      <div className="card-glass overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-textMuted flex flex-col items-center">
            <Search size={48} className="opacity-20 mb-4" />
            <p className="text-lg font-medium text-white mb-1">No Users Found</p>
            <p className="text-sm">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scroll-custom">
            <table className="table-custom w-full">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Profile</th>
                  <th>Assigned IP</th>
                  <th>Comment</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="group">
                    <td className="font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surfaceHover flex items-center justify-center border border-white/5">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td>
                      <span className="px-2.5 py-1 rounded-md bg-white/5 text-xs font-medium text-textMuted border border-white/5">
                        {user.profile}
                      </span>
                    </td>
                    <td className="font-mono text-sm text-textMuted">{user.address || 'Dynamic'}</td>
                    <td className="text-sm text-textMuted max-w-[200px] truncate">{user.comment || '-'}</td>
                    <td>
                      <span className={`badge ${user.disabled ? 'badge-error' : 'badge-success'}`}>
                        {user.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="btn-icon hover:bg-primary/10 hover:text-primary" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(user.id)}
                          className="btn-icon hover:bg-rose-500/10 hover:text-rose-400"
                          title="Delete User"
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      ) : (
        <div className="card-glass overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto scroll-custom">
            <table className="table-custom w-full">
              <thead>
                <tr>
                  <th>Profile Name</th>
                  <th>Rate Limit (Rx/Tx)</th>
                  <th>Shared Users</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="group">
                    <td className="font-semibold text-white">{profile.name}</td>
                    <td className="font-mono text-sm text-primary">{profile.rateLimit || 'Unlimited'}</td>
                    <td className="text-sm text-textMuted">{profile.sharedUsers || '1'}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => confirmDeleteProfile(profile.id)}
                          className="btn-icon hover:bg-rose-500/10 hover:text-rose-400"
                          title="Delete Profile"
                          disabled={loading || profile.name === 'default'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-textMuted">No profiles found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotspotUsers;
