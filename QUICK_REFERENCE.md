# MikroDesk - Quick Reference

## Getting Started (60 seconds)

```bash
# 1. Navigate to folder
cd MikroDesk

# 2. Install
npm install

# 3. Run
npm run electron-dev

# 4. Done! App opens automatically
```

---

## Commands Reference

| Command | What it Does |
|---------|------------|
| `npm install` | Install all dependencies |
| `npm run electron-dev` | Run app with hot reload |
| `npm run build` | Build React for production |
| `npm run electron-build` | Create Windows installer |
| `npm run dev` | Vite dev server only |
| `npm run lint` | Check code quality |
| `npm run format` | Auto-format code |

---

## UI Navigation

```
Dashboard
├── Total Users Stats
├── Online Users Stats
├── Activity Charts
└── Recent Activity Log

Router Connection
├── Input Fields (IP, User, Pass)
├── Connect Button
├── Saved Routers List
└── Router Management

Hotspot Users
├── Create User Form
├── User Search
└── User Management Table

Online Users
├── Live User List
├── Auto-refresh Controls
└── Session Tracking

Usage History
├── Router Selection
├── History Filters
├── Data Export (CSV)
└── Session Logs

Settings
├── Connection Settings
├── Display Settings
└── Advanced Options
```

---

## File Locations

| Item | Location |
|------|----------|
| Database | `~/.mikrodesk/database.db` |
| App Cache | `.vite/` folder |
| Build Output | `dist/` folder |
| Installer | `out/` folder |
| Electron Main | `electron/main.js` |
| React App | `src/App.jsx` |

---

## Configuration

### Router Connection
```
IP: 192.168.88.1
Username: admin
Password: [your password]
Port: 8728 (automatic)
```

### Database Tables
- `routers` - Connections
- `users` - Hotspot users
- `usage_history` - Logs
- `settings` - Config
- `login_history` - Events

---

## Common Tasks

### Connect to Router
1. Go to "Router Connection"
2. Enter IP, username, password
3. Click "Connect"
4. See "Connected" message

### Create User
1. Go to "Hotspot Users"
2. Click "New User"
3. Enter name and password
4. Click "Create User"

### View Online Users
1. Go to "Online Users"
2. Enable "Auto Refresh"
3. See live updates

### Export Data
1. Go to "Usage History"
2. Select router and filters
3. Click "Export CSV"

### Save Multiple Routers
1. Configure first router
2. Click "Save"
3. Load saved router
4. Click "Connect"

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Q` | Quit application |
| `F12` | Toggle DevTools |
| `Ctrl+R` | Reload page |
| `Ctrl+Shift+I` | Open DevTools |

---

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Can't connect | Verify router IP and credentials |
| App won't start | Delete `node_modules`, run `npm install` |
| Port 5173 busy | Kill process or restart PC |
| Database error | Delete `~/.mikrodesk/database.db` |
| Better-sqlite3 error | Run `npm rebuild better-sqlite3` |

---

## Directory Structure

```
MikroDesk/
├── src/             # React source
├── electron/        # Electron files
├── public/          # Assets
├── dist/            # Build output
├── out/             # Installers
├── node_modules/    # Dependencies
├── package.json     # Config
└── [docs]           # Documentation
```

---

## Performance Tips

✅ Close DevTools (F12) for speed
✅ Use 10-30s refresh interval
✅ Don't keep many tabs open
✅ Update Windows/drivers
✅ Use SSD for storage
✅ Allocate 2GB+ RAM

---

## Project Stats

- **Size**: ~50MB (with node_modules)
- **Built With**: 20+ files
- **Code**: 3000+ lines
- **Dependencies**: 20+
- **Build Time**: ~30 seconds
- **App Size**: ~10MB (installer)

---

## Key Features

✅ Real-time Dashboard
✅ Router Management
✅ User Creation/Deletion
✅ Live Online Monitoring
✅ Usage History Tracking
✅ CSV Export
✅ Dark Theme
✅ Auto-connect
✅ Multiple Routers
✅ SQLite Database

---

## Important Files

| File | Size | Purpose |
|------|------|---------|
| `package.json` | ~1KB | Config |
| `vite.config.js` | ~1KB | Build |
| `electron/main.js` | ~3KB | Desktop |
| `src/App.jsx` | ~2KB | Routes |
| `services/*.js` | ~15KB | Logic |
| `pages/*.jsx` | ~25KB | UI |

---

## Network Requirements

- **Router Access**: Local network
- **Download Speed**: 10 Mbps+
- **Port**: 8728 (REST API)
- **Firewall**: Port 8728 open

---

## Database Backup

```bash
# Backup
copy %USERPROFILE%\.mikrodesk\database.db backup.db

# Restore
copy backup.db %USERPROFILE%\.mikrodesk\database.db
```

---

## Support Docs

1. **README.md** - Overview
2. **SETUP.md** - Configuration
3. **INSTALL.md** - Installation
4. **API_REFERENCE.md** - Database/API
5. **PROJECT_SUMMARY.md** - Complete info

---

## What's Included

✅ Full Electron app
✅ React UI with routing
✅ MikroTik API integration
✅ SQLite database
✅ State management
✅ Animations
✅ Dark theme
✅ Responsive design
✅ Error handling
✅ Documentation

---

## Version Info

| Component | Version |
|-----------|---------|
| Electron | 27+ |
| React | 18+ |
| Vite | 5+ |
| Node.js | 16+ |
| npm | 7+ |

---

## First Run Checklist

- [ ] Install Node.js
- [ ] Run `npm install`
- [ ] Run `npm run electron-dev`
- [ ] Configure MikroTik router
- [ ] Test connection
- [ ] Create test user
- [ ] Check dashboard
- [ ] Try online users
- [ ] Export history

---

## Tips & Tricks

1. **Save Routers**: Quickly switch between multiple routers
2. **Auto-Refresh**: Set appropriate interval for your network
3. **Export Data**: Use CSV for monthly reports
4. **Search Users**: Use search to find users quickly
5. **Settings**: Customize auto-connect for convenience

---

## Resources

- **MikroTik**: https://www.mikrotik.com/
- **React**: https://react.dev/
- **Electron**: https://www.electronjs.org/
- **Tailwind**: https://tailwindcss.com/
- **SQLite**: https://www.sqlite.org/

---

## License

MIT License - Free to use and modify

---

**MikroDesk v1.0.0 - Production Ready**

Ready to manage your hotspots! 🚀
