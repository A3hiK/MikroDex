import { create } from 'zustand';

const CONN_KEY = 'mikrodesk_last_connection';
const THEME_KEY = 'mikrodesk_theme';

const loadPersistedConnection = () => {
  try {
    const saved = localStorage.getItem(CONN_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return { ip: '', username: '', password: '', connected: false, connecting: false, error: null };
};

const persistConnection = (router) => {
  try {
    localStorage.setItem(CONN_KEY, JSON.stringify(router));
  } catch (e) {
    // ignore
  }
};

export const useStore = create((set) => ({
  // Router Connection — restored from localStorage
  router: loadPersistedConnection(),
  setRouter: (data) => set((state) => {
    const updated = { ...state.router, ...data };
    persistConnection(updated);
    return { router: updated };
  }),

  // Hotspot Users
  users: [],
  setUsers: (users) => set({ users }),
  addUser: (user) => set((state) => ({
    users: [...state.users, user],
  })),
  removeUser: (id) => set((state) => ({
    users: state.users.filter((u) => u.id !== id),
  })),

  // Online Users
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  // Dashboard Stats
  stats: {
    totalUsers: 0,
    onlineCount: 0,
    activeRouters: 0,
    trafficUsage: 0,
  },
  setStats: (stats) => set((state) => ({
    stats: { ...state.stats, ...stats },
  })),

  // UI State — theme persisted in localStorage
  theme: localStorage.getItem(THEME_KEY) !== null ? localStorage.getItem(THEME_KEY) : '',
  sidebarOpen: true,
  setSidebar: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    set({ theme });
  },

  // Settings
  settings: {
    autoConnect: true,
    notifications: true,
    refreshInterval: 5,
    darkMode: false,
    hotspotDns: 'hotspot.local',
    profilePrices: {},
  },
  updateSettings: (settings) => set((state) => ({
    settings: { ...state.settings, ...settings },
  })),

  // Saved Routers
  savedRouters: [],
  setSavedRouters: (routers) => set({ savedRouters: routers }),
  addSavedRouter: (router) => set((state) => ({
    savedRouters: [...state.savedRouters, router],
  })),
  removeSavedRouter: (id) => set((state) => ({
    savedRouters: state.savedRouters.filter((r) => r.id !== id),
  })),
}));
