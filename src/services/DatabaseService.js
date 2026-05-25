// Browser-compatible database service using localStorage
const DB_KEY = 'mikrodesk_db';

// Load or initialize data
const loadData = () => {
  try {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }
  return {
    routers: [],
    users: [],
    usage_history: [],
    settings: {},
    login_history: [],
    sales: [],
  };
};

// Save data
const saveData = (data) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
    return false;
  }
};

class DatabaseService {
  constructor() {
    this.data = loadData();
    this.nextId = {
      routers: this.getMaxId('routers') + 1,
      users: this.getMaxId('users') + 1,
      usage_history: this.getMaxId('usage_history') + 1,
      login_history: this.getMaxId('login_history') + 1,
      sales: this.getMaxId('sales') + 1,
    };
    if (!this.data.sales) this.data.sales = [];
  }

  getMaxId(table) {
    const items = this.data[table] || [];
    return items.reduce((max, item) => Math.max(max, item.id || 0), 0);
  }

  save() {
    return saveData(this.data);
  }

  // Router Methods
  saveRouter(name, ip, username, password, autoConnect = false) {
    try {
      // Upsert by IP — same IP updates instead of duplicating
      const existing = this.data.routers.find((r) => r.ip === ip);
      if (existing) {
        existing.name = name || existing.name;
        existing.username = username;
        existing.password = password;
        existing.lastConnected = new Date().toISOString();
        this.save();
        return { success: true, id: existing.id, message: 'Router profile updated' };
      }
      const router = {
        id: this.nextId.routers++,
        name,
        ip,
        username,
        password,
        autoConnect: autoConnect ? 1 : 0,
        lastConnected: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      this.data.routers.push(router);
      this.save();
      return {
        success: true,
        id: router.id,
        message: 'Router saved successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Error saving router: ${error.message}`,
      };
    }
  }

  getRouters() {
    try {
      return this.data.routers || [];
    } catch (error) {
      console.error('Error fetching routers:', error);
      return [];
    }
  }

  getRouterById(id) {
    try {
      return (this.data.routers || []).find((r) => r.id === id) || null;
    } catch (error) {
      console.error('Error fetching router:', error);
      return null;
    }
  }

  deleteRouter(id) {
    try {
      this.data.routers = this.data.routers.filter((r) => r.id !== id);
      this.save();
      return { success: true, message: 'Router deleted successfully' };
    } catch (error) {
      return { success: false, message: `Error deleting router: ${error.message}` };
    }
  }

  updateRouterConnection(id) {
    try {
      const router = this.data.routers.find((r) => r.id === id);
      if (router) {
        router.lastConnected = new Date().toISOString();
        this.save();
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // User Methods
  saveUser(routerId, name, password, profile, address, comment, expiryTime) {
    try {
      const user = {
        id: this.nextId.users++,
        routerId,
        name,
        password,
        profile,
        address,
        comment,
        expiryTime,
        createdAt: new Date().toISOString(),
      };
      this.data.users.push(user);
      this.save();
      return {
        success: true,
        id: user.id,
        message: 'User saved successfully',
      };
    } catch (error) {
      return { success: false, message: `Error saving user: ${error.message}` };
    }
  }

  getUsersByRouterId(routerId) {
    try {
      return (this.data.users || []).filter((u) => u.routerId === routerId);
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  deleteUser(id) {
    try {
      this.data.users = this.data.users.filter((u) => u.id !== id);
      this.save();
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      return { success: false, message: `Error deleting user: ${error.message}` };
    }
  }

  // Usage History Methods
  saveUsageHistory(routerId, userId, userName, bytesIn, bytesOut, loginTime, logoutTime, status = 'active') {
    try {
      const sessionDuration = logoutTime
        ? (new Date(logoutTime) - new Date(loginTime)) / 1000
        : null;

      const history = {
        id: this.nextId.usage_history++,
        routerId,
        userId,
        userName,
        bytesIn,
        bytesOut,
        loginTime,
        logoutTime,
        sessionDuration,
        status,
        createdAt: new Date().toISOString(),
      };
      this.data.usage_history.push(history);
      this.save();
      return { success: true, message: 'Usage history saved' };
    } catch (error) {
      return { success: false, message: `Error saving history: ${error.message}` };
    }
  }

  getUsageHistory(routerId, limit = 100) {
    try {
      const history = (this.data.usage_history || []).filter((h) => h.routerId === routerId);
      return history.slice(-limit).reverse();
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }

  // Settings Methods
  setSetting(key, value) {
    try {
      this.data.settings[key] = value;
      this.save();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getSetting(key) {
    try {
      return this.data.settings[key] || null;
    } catch (error) {
      console.error('Error fetching setting:', error);
      return null;
    }
  }

  // Login History Methods
  saveLoginHistory(routerId, userName, ipAddress, macAddress, status) {
    try {
      const login = {
        id: this.nextId.login_history++,
        routerId,
        userName,
        ipAddress,
        macAddress,
        loginTime: new Date().toISOString(),
        logoutTime: null,
        status,
      };
      this.data.login_history.push(login);
      this.save();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getLoginHistory(routerId, limit = 50) {
    try {
      const history = (this.data.login_history || []).filter((h) => h.routerId === routerId);
      return history.slice(-limit).reverse();
    } catch (error) {
      console.error('Error fetching login history:', error);
      return [];
    }
  }

  // Sales Methods
  saveSale(routerId, voucherName, profile, price) {
    try {
      // Check if this voucher was already sold to prevent duplicates
      const existing = this.data.sales.find(s => s.voucherName === voucherName && s.routerId === routerId);
      if (existing) return { success: true, message: 'Already recorded' };

      const sale = {
        id: this.nextId.sales++,
        routerId,
        voucherName,
        profile,
        price: parseFloat(price) || 0,
        soldAt: new Date().toISOString(),
      };
      this.data.sales.push(sale);
      this.save();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getSales(routerId) {
    try {
      return (this.data.sales || []).filter((s) => s.routerId === routerId);
    } catch (error) {
      console.error('Error fetching sales:', error);
      return [];
    }
  }

  closeDatabase() {
    this.save();
  }
}

export default new DatabaseService();
