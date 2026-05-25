# MikroDesk - Setup Guide

## Quick Start Guide

### 1. Prerequisites

Before starting, ensure you have:
- Node.js v16+ installed
- npm or yarn
- Git (optional)

### 2. Installation Steps

```bash
# Navigate to project directory
cd MikroDesk

# Install all dependencies
npm install

# This will install:
# - Electron (Desktop framework)
# - React (UI library)
# - Vite (Build tool)
# - TailwindCSS (Styling)
# - better-sqlite3 (Database)
# - And all other required packages
```

### 3. Development

```bash
# Start development mode (includes hot reload)
npm run electron-dev

# This starts:
# - Vite dev server on http://localhost:5173
# - Electron app with DevTools open

# Vite dev server only (for testing React separately)
npm run dev
```

### 4. Building for Production

```bash
# Build React application
npm run build

# Create Electron installer for Windows
npm run electron-build

# Executable will be in: out/ directory
```

## Project Structure Explanation

```
MikroDesk/
├── src/
│   ├── components/          # Reusable React components
│   │   └── Sidebar.jsx      # Navigation sidebar
│   │
│   ├── pages/               # Page components
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   ├── RouterConnection.jsx  # Router setup
│   │   ├── HotspotUsers.jsx # User management
│   │   ├── OnlineUsers.jsx  # Active users
│   │   ├── UsageHistory.jsx # Data logs
│   │   └── Settings.jsx     # App settings
│   │
│   ├── services/            # Business logic
│   │   ├── MikroTikService.js   # Router API
│   │   └── DatabaseService.js   # SQLite DB
│   │
│   ├── store/               # State management
│   │   └── store.js         # Zustand store
│   │
│   ├── styles/              # CSS files
│   │   └── index.css        # Tailwind styles
│   │
│   ├── App.jsx              # Main component
│   └── main.jsx             # Entry point
│
├── electron/
│   ├── main.js              # Electron main process
│   └── preload.js           # IPC security
│
├── public/                  # Assets
├── vite.config.js           # Vite config
├── tailwind.config.js       # TailwindCSS config
├── postcss.config.js        # PostCSS config
├── package.json
└── README.md
```

## Configuration

### MikroTik Router Connection

**Default Settings:**
- IP: `192.168.88.1`
- Port: `8728` (REST API)
- Username: `admin`
- Password: (set by router admin)

### Enable REST API on MikroTik Router

1. Connect to your MikroTik router
2. Go to: `System > Users > API`
3. Enable REST API for your user
4. Ensure port 8728 is not blocked by firewall

### Database Location

SQLite database is stored at:
- **Windows**: `C:\Users\{Username}\.mikrodesk\database.db`

Data is persisted locally and includes:
- Saved routers
- User information
- Usage history
- Application settings

## Features Overview

### Dashboard
- Real-time statistics
- User activity charts
- System status monitoring
- Live data visualization

### Router Connection
- Add/remove router connections
- Save multiple routers
- One-click connection
- Connection status display

### Hotspot Users
- Create new users
- Delete users
- User profile management
- Search and filter users
- Display expiry times

### Online Users
- Real-time active user list
- Live IP addresses and MAC addresses
- Session duration tracking
- Data usage monitoring
- Auto-refresh capability

### Usage History
- User session logs
- Login/logout records
- Data usage tracking
- Export to CSV
- Search and filter

### Settings
- Dark/Light mode toggle
- Auto-connect preference
- Notification settings
- Refresh interval configuration
- Database management

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to router
- ✓ Verify router IP address is correct
- ✓ Ensure MikroTik REST API is enabled
- ✓ Check port 8728 is accessible
- ✓ Verify firewall settings
- ✓ Test with correct username/password

**Problem:** Authentication failed
- ✓ Double-check credentials
- ✓ Verify user has API permissions
- ✓ Check if user is disabled in MikroTik

### Database Issues

**Problem:** Database errors or corruption
```bash
# Reset database
rm ~/.mikrodesk/database.db

# Restart app - will recreate database
npm run electron-dev
```

**Problem:** better-sqlite3 build errors
```bash
# Rebuild native module
npm rebuild better-sqlite3
```

### Performance Issues

**Problem:** App is slow or unresponsive
- ✓ Reduce auto-refresh interval
- ✓ Close DevTools (press F12)
- ✓ Restart the application
- ✓ Clear browser cache in Vite

### Electron Issues

**Problem:** App won't start
```bash
# Clear cache and rebuild
rm -rf node_modules .vite dist
npm install
npm run electron-dev
```

## Environment Setup

### Windows Setup

1. **Install Node.js**
   - Download from https://nodejs.org/
   - Install LTS version
   - Verify: `node --version` and `npm --version`

2. **Clone/Download Project**
   - Download MikroDesk to Desktop
   - Extract if zipped

3. **Install Dependencies**
   ```bash
   cd MikroDesk
   npm install
   ```

4. **Run Development**
   ```bash
   npm run electron-dev
   ```

### Linux/Mac Setup

Similar steps, but use:
```bash
npm install
npm run electron-dev
```

## API Reference

### MikroTikService

```javascript
import MikroTikService from './services/MikroTikService';

// Connect
await MikroTikService.connect(ip, username, password);

// Get users
const result = await MikroTikService.getHotspotUsers();

// Create user
await MikroTikService.createHotspotUser({
  name: 'username',
  password: 'password',
  profile: 'default'
});

// Get online users
const online = await MikroTikService.getOnlineUsers();

// Delete user
await MikroTikService.deleteHotspotUser(userId);
```

### DatabaseService

```javascript
import DatabaseService from './services/DatabaseService';

// Save router
DatabaseService.saveRouter(name, ip, username, password);

// Get routers
const routers = DatabaseService.getRouters();

// Save setting
DatabaseService.setSetting('key', value);

// Get setting
const value = DatabaseService.getSetting('key');
```

### State Management (Zustand)

```javascript
import { useStore } from './store/store';

const { router, users, setRouter, setUsers } = useStore();
```

## Tips & Best Practices

1. **Auto-refresh**: Set to 5-10 seconds for optimal performance
2. **Database**: Backup `~/.mikrodesk/database.db` regularly
3. **Credentials**: Store securely; MikroDesk stores locally only
4. **Multiple Routers**: Save multiple routers for quick switching
5. **Export Data**: Use "Export CSV" for monthly reports

## Security Notes

- Context isolation enabled in Electron
- No nodeIntegration (safe IPC)
- SQL prepared statements (no injection)
- Input validation on all forms
- Secure preload scripts
- HTTPS connections to router (if available)

## Version Info

- **MikroDesk**: v1.0.0
- **Electron**: v27+
- **React**: v18+
- **Node**: v16+

## Support & Resources

- **MikroTik Docs**: https://wiki.mikrotik.com/
- **React Docs**: https://react.dev/
- **Electron Docs**: https://www.electronjs.org/docs
- **TailwindCSS**: https://tailwindcss.com/

## Development Tips

### Add New Feature
1. Create component in `src/pages/` or `src/components/`
2. Add import in `App.jsx`
3. Create route if it's a page
4. Add menu item in `Sidebar.jsx`

### Use State
```javascript
import { useStore } from './store/store';

const { users, setUsers } = useStore();
```

### Call MikroTik API
```javascript
import MikroTikService from '../services/MikroTikService';

const result = await MikroTikService.method();
```

### Save to Database
```javascript
import DatabaseService from '../services/DatabaseService';

DatabaseService.saveData(...);
```

## Performance Optimization

1. **Lazy Loading**: Routes are dynamically loaded
2. **Code Splitting**: Vite automatically splits code
3. **Caching**: SQLite queries are cached
4. **Animations**: Use Framer Motion for smooth UI
5. **Virtual Lists**: For large user lists (future)

## Next Steps

1. ✓ Install dependencies: `npm install`
2. ✓ Start development: `npm run electron-dev`
3. ✓ Configure MikroTik router connection
4. ✓ Create first hotspot user
5. ✓ Monitor live data in Dashboard
6. ✓ Build for production: `npm run electron-build`

---

**Happy managing! For issues, check MikroTik and Electron documentation.**
