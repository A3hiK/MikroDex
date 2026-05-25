/**
 * MikroTikService — all HTTP calls go through Electron main process via IPC.
 * Falls back to mock data when running without Electron (e.g. Vite dev server)
 * or when mock mode is explicitly enabled (e.g. Demo Mode).
 */

const hasElectron = typeof window !== 'undefined' && window.electron?.invoke;

let forceMock = false;

// Call main process via IPC, or mock fallback
const ipc = (channel, args) => {
  if (hasElectron && !forceMock) {
    return window.electron.invoke(channel, args);
  }
  // Mock fallback for dev mode / demo
  return mockIpc(channel, args);
};

// ── Mock data for dev mode ──────────────────────────────────────────────
const mockDb = {
  hotspotUsers: [
    { '.id': '*1', name: 'user01', password: 'pass123', profile: 'default', address: '192.168.88.10', comment: 'Test user', disabled: 'false' },
    { '.id': '*2', name: 'user02', password: 'pass456', profile: 'default', address: '192.168.88.20', comment: '', disabled: 'false' },
    { '.id': '*3', name: 'admin_guest', password: 'guest123', profile: 'default', address: '192.168.88.30', comment: 'VIP', disabled: 'false' },
    { '.id': '*4', name: 'test_user', password: 'test123', profile: 'admin', address: '192.168.88.40', comment: '', disabled: 'true' },
  ],
  hotspotProfiles: [
    { '.id': '*1', name: 'default' },
    { '.id': '*2', name: 'admin' },
    { '.id': '*3', name: 'vip' },
  ],
  hotspotActive: [
    { '.id': '*1', user: 'user01', address: '192.168.88.10', 'mac-address': 'AA:BB:CC:DD:EE:01', 'login-time': 'May/20/2026 00:15:30', 'bytes-in': '1048576', 'bytes-out': '2097152' },
    { '.id': '*2', user: 'user02', address: '192.168.88.20', 'mac-address': 'AA:BB:CC:DD:EE:02', 'login-time': 'May/20/2026 01:20:45', 'bytes-in': '524288', 'bytes-out': '1048576' },
  ],
  identity: { name: 'MikroTik-CCR1036' },
  systemResource: {
    'cpu-load': '12',
    'free-memory': '240512000',
    'total-memory': '536870912',
    'free-hdd-space': '1048576000',
    'total-hdd-space': '2147483648',
    'uptime': '10d 4h 12m'
  },
  logs: [
    { '.id': '*1', time: '10:00:15', topics: 'hotspot,info', message: 'admin_guest logged in' },
    { '.id': '*2', time: '10:05:22', topics: 'hotspot,error', message: 'user02 login failed' },
  ],
  interfaces: [
    { '.id': '*1', name: 'ether1-WAN', type: 'ether', running: 'true', 'tx-byte': '1048576000', 'rx-byte': '2097152000' },
    { '.id': '*2', name: 'ether2-LAN', type: 'ether', running: 'true', 'tx-byte': '536870912', 'rx-byte': '1048576000' },
    { '.id': '*3', name: 'wlan1', type: 'wlan', running: 'false', 'tx-byte': '0', 'rx-byte': '0' },
  ],
};
let mockNextId = 5;

function mockIpc(channel, args) {
  switch (channel) {
    case 'mikrotik:discover':
      return { success: true, data: [{ ip: '192.168.88.1', mac: 'AA:BB:CC:DD:EE:FF', identity: 'MikroTik Demo Router' }] };

    case 'mikrotik:connect':
      if (args.username !== 'admin') {
        return { success: false, message: 'Wrong username or password.' };
      }
      return { success: true, message: 'Connected (mock)' };

    case 'mikrotik:request': {
      const { method, path, body } = args;

      if (path.startsWith('/rest/ip/hotspot/user') && method === 'GET') {
        return { success: true, data: [...mockDb.hotspotUsers] };
      }
      if (path === '/rest/ip/hotspot/user' && (method === 'POST' || method === 'PUT')) {
        const newUser = {
          '.id': `*${mockNextId++}`,
          name: body.name,
          password: body.password,
          profile: body.profile || 'default',
          address: '0.0.0.0',
          comment: body.comment || '',
          disabled: 'false',
        };
        mockDb.hotspotUsers.push(newUser);
        return { success: true, data: newUser, message: 'User created (mock)' };
      }
      if (path.match(/\/rest\/ip\/hotspot\/user\/(\*?\d+)/) && method === 'DELETE') {
        const id = path.match(/\/(\*?\d+)$/)[1];
        const idx = mockDb.hotspotUsers.findIndex(u => u['.id'] === id);
        if (idx !== -1) {
          mockDb.hotspotUsers.splice(idx, 1);
          return { success: true };
        }
        return { success: false, status: 404, message: 'User not found' };
      }
      if (path.startsWith('/rest/ip/hotspot/user/profile') && method === 'GET') {
        return { success: true, data: [...mockDb.hotspotProfiles] };
      }
      if (path === '/rest/ip/hotspot/user/profile' && (method === 'POST' || method === 'PUT')) {
        const newProfile = {
          '.id': `*P${mockNextId++}`,
          name: body.name,
          'rate-limit': body['rate-limit'] || '',
          'shared-users': body['shared-users'] || '1',
        };
        mockDb.hotspotProfiles.push(newProfile);
        return { success: true, data: newProfile, message: 'Profile created (mock)' };
      }
      if (path.match(/\/rest\/ip\/hotspot\/user\/profile\/(\*?\w+)/) && method === 'DELETE') {
        const id = path.match(/\/(\*?\w+)$/)[1];
        const idx = mockDb.hotspotProfiles.findIndex(u => u['.id'] === id);
        if (idx !== -1) {
          mockDb.hotspotProfiles.splice(idx, 1);
          return { success: true };
        }
        return { success: false, status: 404, message: 'Profile not found' };
      }
      if (path.startsWith('/rest/ip/hotspot/active') && method === 'GET') {
        return { success: true, data: [...mockDb.hotspotActive] };
      }
      if (path.match(/\/rest\/ip\/hotspot\/active\/(\*?\d+)/) && method === 'DELETE') {
        const id = path.match(/\/(\*?\d+)$/)[1];
        const idx = mockDb.hotspotActive.findIndex(u => u['.id'] === id);
        if (idx !== -1) {
          mockDb.hotspotActive.splice(idx, 1);
          return { success: true };
        }
        return { success: false, status: 404, message: 'Session not found' };
      }
      if (path.startsWith('/rest/system/identity') && method === 'GET') {
        return { success: true, data: { ...mockDb.identity } };
      }
      if (path.startsWith('/rest/system/resource') && method === 'GET') {
        return { success: true, data: { ...mockDb.systemResource } };
      }
      if (path.startsWith('/rest/log') && method === 'GET') {
        return { success: true, data: [...mockDb.logs] };
      }
      if (path.startsWith('/rest/interface') && method === 'GET') {
        // simulate live traffic changes
        mockDb.interfaces.forEach(iface => {
          if (iface.running === 'true') {
            iface['tx-byte'] = String(parseInt(iface['tx-byte']) + Math.floor(Math.random() * 500000));
            iface['rx-byte'] = String(parseInt(iface['rx-byte']) + Math.floor(Math.random() * 500000));
          }
        });
        return { success: true, data: [...mockDb.interfaces] };
      }
      return { success: false, status: 404, message: 'Mock: Unknown endpoint' };
    }

    default:
      return { success: false, message: `Mock: Unknown channel "${channel}"` };
  }
}

class MikroTikService {
  constructor() {
    this.config = { ip: '', port: 80, username: '', password: '' };
    this.connected = false;
  }

  // ── Internal helper ─────────────────────────────────────────────────────
  async _request(method, path, body = null) {
    return ipc('mikrotik:request', {
      ...this.config,
      method,
      path: `/rest${path}`,
      body,
    });
  }

  // ── Connect ─────────────────────────────────────────────────────────────
  async connect(ip, username, password, port = 80) {
    this.config = { ip, port, username, password };

    const result = await ipc('mikrotik:connect', { ip, port, username, password });

    if (result.success) {
      this.connected = true;
    } else {
      this.connected = false;
    }
    return result;
  }

  // ── Discover Routers ──────────────────────────────────────────────────────
  async discoverRouters() {
    try {
      const result = await ipc('mikrotik:discover');
      return result || { success: false, data: [] };
    } catch (err) {
      return { success: false, data: [], message: err.message };
    }
  }

  // ── Mock mode toggle ───────────────────────────────────────────────────
  setMockMode(enable) {
    forceMock = enable;
    this.connected = enable;
    if (enable) {
      this.config = { ip: '192.168.88.1 (Demo)', port: 80, username: 'admin', password: '' };
    } else {
      this.config = { ip: '', port: 80, username: '', password: '' };
    }
  }

  // ── Disconnect ──────────────────────────────────────────────────────────
  disconnect() {
    this.connected = false;
    this.config = { ip: '', port: 80, username: '', password: '' };
  }

  isConnected() { return this.connected; }

  // ── Hotspot Users ────────────────────────────────────────────────────────
  async getHotspotUsers() {
    try {
      if (!this.connected) throw new Error('Router not connected');

      const res = await this._request('GET', '/ip/hotspot/user');

      if (res.success && Array.isArray(res.data)) {
        return {
          success: true,
          data: res.data.map((u) => ({
            id: u['.id'],
            name: u.name,
            profile: u.profile || 'default',
            address: u.address || 'N/A',
            comment: u.comment || '',
            disabled: u.disabled === 'true' || u.disabled === true,
            expiryTime: u['limit-uptime'] || u['expires-after'] || 'never',
            uptime: u.uptime || '0s',
            'bytes-in': u['bytes-in'] || '0',
            'bytes-out': u['bytes-out'] || '0',
          })),
        };
      }
      return { success: false, data: [], message: `Failed to fetch users (HTTP ${res.status})` };
    } catch (err) {
      return { success: false, data: [], message: err.message };
    }
  }

  // ── Create Hotspot User ──────────────────────────────────────────────────
  async createHotspotUser(userData) {
    try {
      if (!this.connected) throw new Error('Router not connected');

      const body = {
        name: userData.name,
        password: userData.password,
        profile: userData.profile || 'default',
        ...(userData.comment && { comment: userData.comment }),
        ...(userData.expiryTime && { 'limit-uptime': userData.expiryTime }),
        ...(userData.rateLimit && { 'rate-limit': userData.rateLimit }),
      };

      const res = await this._request('PUT', '/ip/hotspot/user', body);

      if (res.success) return { success: true, message: 'User created successfully', data: res.data };
      const detail = res.errorDetail || (res.data && (res.data.detail || res.data.message)) || '';
      return { success: false, message: `Failed to create user (HTTP ${res.status})${detail ? ': ' + detail : ''}` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ── Delete Hotspot User ──────────────────────────────────────────────────
  async deleteHotspotUser(userId) {
    try {
      if (!this.connected) throw new Error('Router not connected');

      const res = await this._request('DELETE', `/ip/hotspot/user/${userId}`);

      if (res.success) return { success: true, message: 'User deleted' };
      return { success: false, message: `Failed to delete user (HTTP ${res.status})` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ── Hotspot Profiles ─────────────────────────────────────────────────────
  async getHotspotProfiles() {
    try {
      if (!this.connected) throw new Error('Router not connected');

      const res = await this._request('GET', '/ip/hotspot/user/profile');

      if (res.success && Array.isArray(res.data)) {
        return {
          success: true,
          data: res.data.map((p) => ({
            id: p['.id'],
            name: p.name,
            rateLimit: p['rate-limit'] || '',
            sharedUsers: p['shared-users'] || '1',
          })),
        };
      }
      return { success: false, data: [], message: `Failed to fetch profiles (HTTP ${res.status})` };
    } catch (err) {
      return { success: false, data: [], message: err.message };
    }
  }

  // ── Create Profile ───────────────────────────────────────────────────────
  async createHotspotProfile(profileData) {
    try {
      if (!this.connected) throw new Error('Router not connected');
      const body = {
        name: profileData.name,
        ...(profileData.rateLimit && { 'rate-limit': profileData.rateLimit }),
        ...(profileData.sharedUsers && { 'shared-users': profileData.sharedUsers }),
      };
      const res = await this._request('PUT', '/ip/hotspot/user/profile', body);
      if (res.success) return { success: true, message: 'Profile created successfully' };
      return { success: false, message: `Failed to create profile (HTTP ${res.status})` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ── Delete Profile ───────────────────────────────────────────────────────
  async deleteHotspotProfile(id) {
    try {
      if (!this.connected) throw new Error('Router not connected');
      const res = await this._request('DELETE', `/ip/hotspot/user/profile/${id}`);
      if (res.success) return { success: true, message: 'Profile deleted' };
      return { success: false, message: `Failed to delete profile (HTTP ${res.status})` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ── Online / Active Users ────────────────────────────────────────────────
  async getOnlineUsers() {
    try {
      if (!this.connected) throw new Error('Router not connected');

      const res = await this._request('GET', '/ip/hotspot/active');

      if (res.success && Array.isArray(res.data)) {
        return {
          success: true,
          data: res.data.map((u) => ({
            id: u['.id'],
            name: u.user || u.name || 'Unknown',
            address: u.address || 'N/A',
            macAddress: u['mac-address'] || 'N/A',
            loginTime: u['login-time'] || 'N/A',
            bytesIn: this.formatBytes(parseInt(u['bytes-in']) || 0),
            bytesOut: this.formatBytes(parseInt(u['bytes-out']) || 0),
            uploadSpeed: u['tx-rate'] || '0',
            downloadSpeed: u['rx-rate'] || '0',
          })),
        };
      }
      return { success: false, data: [], message: `Failed to fetch active users (HTTP ${res.status})` };
    } catch (err) {
      return { success: false, data: [], message: err.message };
    }
  }

  // ── Router Identity ──────────────────────────────────────────────────────
  async getRouterInfo() {
    try {
      if (!this.connected) throw new Error('Router not connected');

      const res = await this._request('GET', '/system/identity');

      if (res.success) return { success: true, data: { name: res.data?.name || 'Unknown' } };
      return { success: false, message: `Failed (HTTP ${res.status})` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ── Disconnect Active User ────────────────────────────────────────────────
  async disconnectActiveUser(id) {
    try {
      if (!this.connected) throw new Error('Router not connected');
      const res = await this._request('DELETE', `/ip/hotspot/active/${id}`);
      if (res.success) return { success: true, message: 'User disconnected' };
      return { success: false, message: `Failed to disconnect user (HTTP ${res.status})` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ── System Resource ──────────────────────────────────────────────────────
  async getSystemResource() {
    try {
      if (!this.connected) throw new Error('Router not connected');
      const res = await this._request('GET', '/system/resource');
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        return { success: true, data };
      }
      return { success: false, message: `Failed (HTTP ${res.status})` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ── Logs ─────────────────────────────────────────────────────────────────
  async getLogs() {
    try {
      if (!this.connected) throw new Error('Router not connected');
      const res = await this._request('GET', '/log');
      if (res.success && Array.isArray(res.data)) {
        return { success: true, data: res.data.reverse().slice(0, 50) };
      }
      return { success: false, data: [], message: `Failed (HTTP ${res.status})` };
    } catch (err) {
      return { success: false, data: [], message: err.message };
    }
  }

  // ── Interfaces ───────────────────────────────────────────────────────────
  async getInterfaces() {
    try {
      if (!this.connected) throw new Error('Router not connected');
      const res = await this._request('GET', '/interface');
      if (res.success && Array.isArray(res.data)) {
        return { success: true, data: res.data };
      }
      return { success: false, data: [], message: `Failed (HTTP ${res.status})` };
    } catch (err) {
      return { success: false, data: [], message: err.message };
    }
  }

  // ── Utility ──────────────────────────────────────────────────────────────
  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export default new MikroTikService();
