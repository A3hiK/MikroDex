# MikroDesk - MikroTik Hotspot Manager

A modern, professional Windows Desktop Application for managing MikroTik hotspots with a dark futuristic UI.

## 🚀 Features

- **Dashboard**: Real-time statistics and monitoring
- **Router Connection**: Easy connection to MikroTik routers
- **Hotspot User Management**: Create, delete, and manage users
- **Online Users**: Real-time view of connected users
- **Usage History**: Track user sessions and data usage
- **SQLite Database**: Local data persistence
- **Dark Futuristic Theme**: Premium UI with glassmorphism effects
- **Auto-Reconnect**: Automatic router connection management

## 📋 Tech Stack

- **Electron**: Desktop application framework
- **React**: UI library
- **Vite**: Build tool
- **TailwindCSS**: Utility-first CSS framework
- **SQLite**: Local database (better-sqlite3)
- **Zustand**: State management
- **Framer Motion**: Animations
- **Axios**: HTTP client
- **Lucide React**: Icons

## 🛠️ Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup Steps

1. **Navigate to project directory**
   ```bash
   cd MikroDesk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development mode**
   ```bash
   npm run electron-dev
   ```

   This will start:
   - Vite dev server on http://localhost:5173
   - Electron app with hot reload

4. **Build for production**
   ```bash
   npm run electron-build
   ```

## 📁 Project Structure

```
MikroDesk/
├── src/
│   ├── components/        # Reusable components
│   │   └── Sidebar.jsx
│   ├── pages/             # Page components
│   │   ├── Dashboard.jsx
│   │   └── RouterConnection.jsx
│   ├── services/          # Business logic
│   │   ├── MikroTikService.js
│   │   └── DatabaseService.js
│   ├── store/             # State management
│   │   └── store.js
│   ├── styles/            # Tailwind CSS
│   │   └── index.css
│   ├── App.jsx            # Main app component
│   └── main.jsx           # React entry point
├── electron/
│   ├── main.js            # Electron main process
│   └── preload.js         # IPC preload script
├── public/                # Public assets
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # TailwindCSS configuration
├── postcss.config.js      # PostCSS configuration
├── package.json
└── index.html
```

## 🔧 Configuration

### MikroTik Router Connection

Default connection parameters:
- **Host**: 192.168.88.1 (or your router IP)
- **Port**: 8728 (REST API)
- **Username**: admin
- **Password**: (your password)

### Database Location

SQLite database is stored at:
- **Windows**: `C:\Users\{Username}\.mikrodesk\database.db`

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.js` to customize colors:
- Primary color: Blue (#6095ff)
- Accent: Cyan (#00f0ff), Purple (#b026ff), Pink (#ff006e)
- Dark backgrounds: #0f1419, #1a232f

### UI Components

All custom components use Tailwind utilities:
- `.btn-primary` - Primary buttons
- `.btn-secondary` - Secondary buttons
- `.card-glass` - Glassmorphism cards
- `.badge` - Status badges

## 🔌 MikroTik API Integration

### Supported Operations

1. **Connect/Disconnect**: Establish connection with router
2. **Get Hotspot Users**: List all hotspot users
3. **Create User**: Add new hotspot user
4. **Delete User**: Remove hotspot user
5. **Get Online Users**: Real-time active user list
6. **Get Router Info**: Fetch router details

### API Usage Example

```javascript
import MikroTikService from './services/MikroTikService';

// Connect to router
const result = await MikroTikService.connect('192.168.88.1', 'admin', 'password');

// Get online users
const onlineUsers = await MikroTikService.getOnlineUsers();

// Create user
const newUser = await MikroTikService.createHotspotUser({
  name: 'testuser',
  password: 'password123',
  profile: 'default'
});
```

## 💾 Database Schema

### Tables

1. **routers** - Saved router connections
2. **users** - Hotspot users
3. **usage_history** - User session logs
4. **settings** - App settings
5. **login_history** - Login/logout records

## 🎯 Key Features Implementation

### State Management (Zustand)

All app state is managed globally:
- Router connection status
- User data
- Dashboard statistics
- UI preferences

### Real-time Updates

Dashboard updates every 10 seconds automatically:
- Online user count
- Usage statistics
- Connection status

### Secure Storage

- Credentials saved locally in SQLite
- Encrypted connections to router
- Secure IPC communication (Electron)

## 📝 Scripts

```bash
# Development
npm run dev              # Vite dev server only
npm run electron-dev    # Electron + Vite

# Production
npm run build           # Build React
npm run electron-build  # Build Electron app

# Utilities
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run preview         # Preview production build
```

## 🚀 Deployment

### Creating Installers

For Windows:
```bash
npm run electron-build
```

This creates an installer in `out/` directory.

## 🐛 Troubleshooting

### Connection Issues

1. Verify router IP address is accessible
2. Ensure MikroTik REST API is enabled (port 8728)
3. Check firewall settings
4. Verify credentials

### Database Issues

1. Delete `~/.mikrodesk/database.db` to reset
2. Reinstall better-sqlite3: `npm rebuild better-sqlite3`

### Electron Issues

1. Clear cache: Delete `.vite` folder
2. Reinstall dependencies: `rm -rf node_modules && npm install`

## 📄 License

MIT License - See LICENSE file

## 👨‍💻 Developer Notes

### Adding New Pages

1. Create component in `src/pages/`
2. Import in `App.jsx`
3. Add route to Routes
4. Add menu item in Sidebar

### Adding New Services

1. Create service file in `src/services/`
2. Export as singleton instance
3. Import and use in components

### Database Operations

All database operations go through `DatabaseService`:

```javascript
import DatabaseService from '../services/DatabaseService';

// Save data
DatabaseService.setSetting('theme', 'dark');

// Retrieve data
const theme = DatabaseService.getSetting('theme');
```

## 🔐 Security

- Context isolation enabled in Electron
- No nodeIntegration
- Secure IPC communication
- Input validation on all forms
- SQL prepared statements

## 📞 Support

For issues and questions, please check:
1. MikroTik API documentation
2. Electron documentation
3. React documentation

---

**Made with ❤️ for MikroTik administrators**
