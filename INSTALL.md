# MikroDesk Installation Guide

## Step-by-Step Installation

### Prerequisites Check

Before starting, ensure your system has:

```bash
# Check Node.js version (should be v16 or higher)
node --version

# Check npm version (should be v7 or higher)
npm --version

# If not installed, download from: https://nodejs.org/
```

### Installation Steps

#### Step 1: Navigate to Project Directory

```bash
cd MikroDesk
```

#### Step 2: Install Dependencies

This step may take 2-5 minutes depending on your internet speed.

```bash
npm install
```

This installs:
- Electron (Desktop framework)
- React & React-DOM (UI library)
- Vite (Build tool)
- TailwindCSS (CSS framework)
- better-sqlite3 (Database)
- Zustand (State management)
- Framer Motion (Animations)
- Lucide React (Icons)
- Axios (HTTP client)
- And other dependencies

#### Step 3: Verify Installation

```bash
# Check if node_modules was created
dir node_modules

# Should show folders like: electron, react, vite, tailwindcss, etc.
```

### Running the Application

#### Development Mode (with hot reload)

```bash
npm run electron-dev
```

This will:
1. Start Vite dev server on http://localhost:5173
2. Launch Electron app
3. Open DevTools automatically
4. Enable hot reload - changes appear instantly

#### Production Build

```bash
# Build React application
npm run build

# Create Windows installer
npm run electron-build
```

The installer will be created in the `out/` directory.

### Detailed Feature Installation

#### Database Setup

The SQLite database is automatically created when you first:

1. Connect to a router
2. Create/manage users
3. View usage history

Database location: `C:\Users\{YourUsername}\.mikrodesk\database.db`

#### MikroTik Router Preparation

Before connecting, ensure your MikroTik router has:

1. **REST API Enabled**
   - SSH/Telnet into router
   - Or use WebFig interface
   - Navigate to: System → Users → API
   - Enable REST API

2. **Network Connectivity**
   - Router is on the same network OR
   - Router IP is accessible from your PC
   - Port 8728 is not blocked by firewall

3. **User Account**
   - Has sufficient permissions
   - Password is set correctly
   - User is not disabled

#### First Time Setup

1. **Launch App**
   ```bash
   npm run electron-dev
   ```

2. **Go to Router Connection Page**
   - Click "Router Connection" in sidebar

3. **Enter Router Details**
   - Router IP: e.g., `192.168.88.1`
   - Username: e.g., `admin`
   - Password: Your router password

4. **Connect**
   - Click "Connect" button
   - You should see "Connected" status

5. **View Dashboard**
   - Go to Dashboard page
   - See real-time statistics

### Troubleshooting Installation

#### Issue: npm install fails

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rmdir /s node_modules
del package-lock.json

# Reinstall
npm install
```

#### Issue: better-sqlite3 build error

**Solution:**

```bash
# Build the native module
npm rebuild better-sqlite3

# If still failing, try:
npm install --build-from-source
```

#### Issue: Port 5173 already in use

**Solution:**

```bash
# Kill the process using port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID {PID} /F

# Or change port in vite.config.js
```

#### Issue: Cannot find module errors

**Solution:**

```bash
# Ensure all dependencies are installed
npm install

# Clear next.js/vite cache
rmdir /s .vite
rmdir /s dist

# Restart dev server
npm run electron-dev
```

### System Requirements

| Component | Requirement |
|-----------|------------|
| OS | Windows 7+ / macOS 10.12+ / Linux |
| RAM | 2GB minimum (4GB recommended) |
| Disk Space | 500MB for installation |
| Network | 10 Mbps (for router connection) |
| Node.js | v16.0.0 or higher |
| npm | v7.0.0 or higher |

### Installation Verification Checklist

- [ ] Node.js v16+ installed
- [ ] npm v7+ installed
- [ ] MikroDesk folder downloaded/cloned
- [ ] `npm install` completed successfully
- [ ] No error messages during installation
- [ ] `node_modules` folder exists
- [ ] Can run `npm run electron-dev` without errors
- [ ] Electron app window opens
- [ ] Can navigate between pages in sidebar

### Post-Installation Configuration

#### Configure MikroTik Router

1. Connect to MikroTik WebFig (http://router-ip:80)
2. Login with admin credentials
3. Go to: System → Users
4. Create or select user
5. Ensure "API" permissions are enabled
6. Go to: System → Packages
7. Verify "api" package is installed

#### Test Connection

1. Open MikroDesk
2. Go to "Router Connection"
3. Enter router IP and credentials
4. Click "Connect"
5. Should see "Connected" message

#### Initial Data

1. Once connected, go to "Hotspot Users"
2. Create test user
3. Go to "Online Users"
4. Should see activity updates

### Optional: Advanced Setup

#### Enable Notifications

In Settings page, toggle:
- [ ] Notifications (ON)
- [ ] Auto Connect (ON)

#### Configure Auto-Refresh

- Set refresh interval to 5-10 seconds
- For slow networks, use 10-30 seconds

#### Multiple Router Setup

1. Go to "Router Connection"
2. Enter first router details
3. Click "Save"
4. Enter second router details
5. Click "Save"
6. Click on saved router to load it
7. Click "Connect"

### Common Commands Reference

```bash
# Development
npm run dev                  # React only
npm run electron-dev        # Full app

# Production
npm run build               # Build React
npm run electron-build      # Create installer

# Code Quality
npm run lint                # Check errors
npm run format              # Format code

# Utilities
npm run preview             # Preview build
```

### File Structure After Installation

```
MikroDesk/
├── node_modules/           # All dependencies
├── dist/                   # Production build
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── store/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── electron/
├── public/
├── .vite/                  # Cache
├── package.json
└── [other config files]
```

### Next Steps After Installation

1. ✅ Complete installation
2. ✅ Start dev server
3. ✅ Configure MikroTik router
4. ✅ Test connection
5. ✅ Create test users
6. ✅ Monitor dashboard
7. ✅ Build for production

### Getting Help

If you encounter issues:

1. Check this guide again
2. Review the SETUP.md file
3. Check MikroTik documentation
4. Verify network connectivity
5. Check console errors (F12 in Electron)

### Performance Tips

1. Close DevTools (F12) for faster performance
2. Set refresh interval to 10 seconds or higher
3. Don't keep too many browser tabs open
4. Use SSD for better performance
5. Keep Windows/drivers updated

---

**Installation complete! Start building your hotspot management system.**
