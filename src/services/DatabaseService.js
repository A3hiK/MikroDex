import { supabase } from './supabaseClient';

class DatabaseService {
  async saveRouter(name, ip, username, password, autoConnect = false) {
    try {
      // Upsert by IP
      const { data: existing, error: checkError } = await supabase
        .from('routers')
        .select('*')
        .eq('ip', ip)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('routers')
          .update({
            name: name || existing.name,
            username,
            password,
            lastConnected: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select();
        if (error) throw error;
        return { success: true, id: existing.id, message: 'Router profile updated' };
      }

      const { data, error } = await supabase
        .from('routers')
        .insert([{ name, ip, username, password, autoConnect }])
        .select();
      
      if (error) throw error;
      return { success: true, id: data[0].id, message: 'Router saved successfully' };
    } catch (error) {
      return { success: false, message: `Error saving router: ${error.message}` };
    }
  }

  async getRouters() {
    try {
      const { data, error } = await supabase.from('routers').select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching routers:', error);
      return [];
    }
  }

  async getRouterById(id) {
    try {
      const { data, error } = await supabase.from('routers').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching router:', error);
      return null;
    }
  }

  async deleteRouter(id) {
    try {
      const { error } = await supabase.from('routers').delete().eq('id', id);
      if (error) throw error;
      return { success: true, message: 'Router deleted successfully' };
    } catch (error) {
      return { success: false, message: `Error deleting router: ${error.message}` };
    }
  }

  async updateRouterConnection(id) {
    try {
      const { error } = await supabase
        .from('routers')
        .update({ lastConnected: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // User Methods
  async saveUser(routerId, name, password, profile, address, comment, expiryTime) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ routerId, name, password, profile, address, comment, expiryTime }])
        .select();
      if (error) throw error;
      return { success: true, id: data[0].id, message: 'User saved successfully' };
    } catch (error) {
      return { success: false, message: `Error saving user: ${error.message}` };
    }
  }

  async getUsersByRouterId(routerId) {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('routerId', routerId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async deleteUser(id) {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      return { success: false, message: `Error deleting user: ${error.message}` };
    }
  }

  // Usage History Methods
  async saveUsageHistory(routerId, userId, userName, bytesIn, bytesOut, loginTime, logoutTime, status = 'active') {
    try {
      const sessionDuration = logoutTime
        ? (new Date(logoutTime) - new Date(loginTime)) / 1000
        : null;

      const { error } = await supabase
        .from('usage_history')
        .insert([{ routerId, userId, userName, bytesIn, bytesOut, loginTime, logoutTime, sessionDuration, status }]);
      if (error) throw error;
      return { success: true, message: 'Usage history saved' };
    } catch (error) {
      return { success: false, message: `Error saving history: ${error.message}` };
    }
  }

  async getUsageHistory(routerId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('usage_history')
        .select('*')
        .eq('routerId', routerId)
        .order('createdAt', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }

  // Settings Methods
  async setSetting(key, value) {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert([{ key, value }], { onConflict: 'key' });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getSetting(key) {
    try {
      const { data, error } = await supabase.from('settings').select('value').eq('key', key).single();
      if (error) throw error;
      return data?.value || null;
    } catch (error) {
      return null;
    }
  }

  // Login History Methods
  async saveLoginHistory(routerId, userName, ipAddress, macAddress, status) {
    try {
      const { error } = await supabase
        .from('login_history')
        .insert([{ routerId, userName, ipAddress, macAddress, status }]);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getLoginHistory(routerId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .eq('routerId', routerId)
        .order('loginTime', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching login history:', error);
      return [];
    }
  }

  // Sales Methods
  async saveSale(routerId, voucherName, profile, price) {
    try {
      const { error } = await supabase
        .from('sales')
        .insert([{ routerId, voucherName, profile, price }]);
      if (error) {
        if (error.code === '23505') return { success: true, message: 'Already recorded' }; // Unique violation
        throw error;
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getSales(routerId) {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('routerId', routerId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sales:', error);
      return [];
    }
  }

  closeDatabase() {
    // No-op for Supabase
  }
}

export default new DatabaseService();
