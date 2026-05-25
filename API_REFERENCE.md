# Database Schema & API Reference

## Database Overview

MikroDesk uses SQLite (better-sqlite3) for local data storage. All data is stored in:
`~/.mikrodesk/database.db`

The database is automatically created and initialized on first run.

---

## Database Schema

### 1. Routers Table

Stores all saved MikroTik router connections.

```sql
CREATE TABLE routers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ip TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  autoConnect INTEGER DEFAULT 0,
  lastConnected DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Fields:**
- `id` - Unique router identifier
- `name` - Router name/label
- `ip` - Router IP address
- `username` - MikroTik username
- `password` - MikroTik password
- `autoConnect` - Auto-connect on startup (0/1)
- `lastConnected` - Last connection timestamp
- `createdAt` - Record creation timestamp

**Example:**
```javascript
{
  id: 1,
  name: "Main Router",
  ip: "192.168.88.1",
  username: "admin",
  password: "password123",
  autoConnect: 1,
  lastConnected: "2024-05-20 10:30:00",
  createdAt: "2024-05-15 08:00:00"
}
```

### 2. Users Table

Stores hotspot users created in MikroTik.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  routerId INTEGER NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  profile TEXT DEFAULT 'default',
  address TEXT,
  comment TEXT,
  expiryTime TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (routerId) REFERENCES routers(id)
)
```

**Fields:**
- `id` - Unique user identifier
- `routerId` - Reference to router
- `name` - Username
- `password` - User password
- `profile` - Hotspot profile
- `address` - IP address
- `comment` - Notes about user
- `expiryTime` - When user expires
- `createdAt` - User creation date

### 3. Usage History Table

Tracks user sessions and data usage.

```sql
CREATE TABLE usage_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  routerId INTEGER NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT,
  bytesIn INTEGER DEFAULT 0,
  bytesOut INTEGER DEFAULT 0,
  loginTime DATETIME,
  logoutTime DATETIME,
  sessionDuration INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (routerId) REFERENCES routers(id)
)
```

**Fields:**
- `id` - Session identifier
- `routerId` - Router reference
- `userId` - MikroTik user ID
- `userName` - Username
- `bytesIn` - Downloaded bytes
- `bytesOut` - Uploaded bytes
- `loginTime` - Session start
- `logoutTime` - Session end
- `sessionDuration` - Duration in seconds
- `createdAt` - Record timestamp

### 4. Settings Table

Stores application settings.

```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Fields:**
- `id` - Setting identifier
- `key` - Setting name
- `value` - JSON value
- `updatedAt` - Last update

**Example Keys:**
- `theme` - dark/light
- `autoConnect` - true/false
- `notifications` - true/false
- `refreshInterval` - 5-60

### 5. Login History Table

Records all login/logout events.

```sql
CREATE TABLE login_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  routerId INTEGER NOT NULL,
  userName TEXT NOT NULL,
  ipAddress TEXT,
  macAddress TEXT,
  loginTime DATETIME DEFAULT CURRENT_TIMESTAMP,
  logoutTime DATETIME,
  status TEXT,
  FOREIGN KEY (routerId) REFERENCES routers(id)
)
```

**Fields:**
- `id` - Event identifier
- `routerId` - Router reference
- `userName` - Username
- `ipAddress` - Client IP
- `macAddress` - Client MAC
- `loginTime` - Login timestamp
- `logoutTime` - Logout timestamp
- `status` - login/logout/expired

---

## API Reference

### DatabaseService

#### Router Operations

```javascript
// Save a new router
DatabaseService.saveRouter(
  name: string,
  ip: string,
  username: string,
  password: string,
  autoConnect?: boolean
): { success: boolean, id?: number, message: string }

// Get all routers
DatabaseService.getRouters(): Router[]

// Get router by ID
DatabaseService.getRouterById(id: number): Router | null

// Delete router
DatabaseService.deleteRouter(id: number): { success: boolean, message: string }

// Update connection timestamp
DatabaseService.updateRouterConnection(id: number): { success: boolean }
```

**Example:**
```javascript
const result = DatabaseService.saveRouter(
  'Office Router',
  '192.168.88.1',
  'admin',
  'password123',
  true
);
// result: { success: true, id: 1, message: 'Router saved successfully' }

const routers = DatabaseService.getRouters();
// routers: [{ id: 1, name: 'Office Router', ... }]
```

#### User Operations

```javascript
// Save user
DatabaseService.saveUser(
  routerId: number,
  name: string,
  password: string,
  profile: string,
  address: string,
  comment: string,
  expiryTime: string
): { success: boolean, id?: number, message: string }

// Get users by router
DatabaseService.getUsersByRouterId(routerId: number): User[]

// Delete user
DatabaseService.deleteUser(id: number): { success: boolean, message: string }
```

#### Usage History Operations

```javascript
// Save usage record
DatabaseService.saveUsageHistory(
  routerId: number,
  userId: string,
  userName: string,
  bytesIn: number,
  bytesOut: number,
  loginTime: string,
  logoutTime?: string
): { success: boolean, message: string }

// Get history
DatabaseService.getUsageHistory(
  routerId: number,
  limit?: number = 100
): UsageRecord[]
```

#### Settings Operations

```javascript
// Save setting
DatabaseService.setSetting(key: string, value: any): { success: boolean }

// Get setting
DatabaseService.getSetting(key: string): any

// Example:
DatabaseService.setSetting('theme', 'dark');
const theme = DatabaseService.getSetting('theme'); // 'dark'
```

#### Login History Operations

```javascript
// Save login event
DatabaseService.saveLoginHistory(
  routerId: number,
  userName: string,
  ipAddress: string,
  macAddress: string,
  status: string
): { success: boolean }

// Get login history
DatabaseService.getLoginHistory(
  routerId: number,
  limit?: number = 50
): LoginEvent[]
```

---

### MikroTikService

#### Connection

```javascript
// Connect to router
MikroTikService.connect(
  ip: string,
  username: string,
  password: string
): Promise<{ success: boolean, message: string }>

// Check if connected
MikroTikService.isConnected(): boolean

// Disconnect
MikroTikService.disconnect(): void

// Example:
const result = await MikroTikService.connect(
  '192.168.88.1',
  'admin',
  'password'
);
if (result.success) {
  console.log('Connected!');
}
```

#### Hotspot Users

```javascript
// Get all hotspot users
MikroTikService.getHotspotUsers(): Promise<{
  success: boolean,
  data: User[],
  message?: string
}>

// Create user
MikroTikService.createHotspotUser(userData: {
  name: string,
  password: string,
  profile?: string,
  comment?: string,
  expiryTime?: string
}): Promise<{ success: boolean, message: string, data?: any }>

// Delete user
MikroTikService.deleteHotspotUser(userId: string): Promise<{
  success: boolean,
  message: string
}>

// Example:
const users = await MikroTikService.getHotspotUsers();
console.log(users.data);
// [
//   { id: '*1', name: 'user1', profile: 'default', ... },
//   { id: '*2', name: 'user2', profile: 'default', ... }
// ]
```

#### Online Users

```javascript
// Get online users
MikroTikService.getOnlineUsers(): Promise<{
  success: boolean,
  data: OnlineUser[],
  message?: string
}>

// Returns:
// [
//   {
//     id: '*1',
//     name: 'user1',
//     address: '192.168.1.100',
//     macAddress: 'AA:BB:CC:DD:EE:FF',
//     loginTime: '09:30:00',
//     bytesIn: '1024000',
//     bytesOut: '512000',
//     uploadSpeed: 1000,
//     downloadSpeed: 2000
//   }
// ]
```

#### Router Info

```javascript
// Get router information
MikroTikService.getRouterInfo(): Promise<{
  success: boolean,
  data?: { name: string },
  message?: string
}>
```

#### Utility

```javascript
// Format bytes
MikroTikService.formatBytes(bytes: number): string
// Returns: "1.5 MB"
```

---

## Complete Usage Example

```javascript
import { useStore } from './store/store';
import MikroTikService from './services/MikroTikService';
import DatabaseService from './services/DatabaseService';

// In your component
const { setUsers, setOnlineUsers, setStats } = useStore();

// Connect to router
const connectResult = await MikroTikService.connect(
  '192.168.88.1',
  'admin',
  'password123'
);

if (connectResult.success) {
  // Save router to database
  DatabaseService.saveRouter(
    'My Router',
    '192.168.88.1',
    'admin',
    'password123',
    true
  );

  // Fetch users
  const usersResult = await MikroTikService.getHotspotUsers();
  if (usersResult.success) {
    setUsers(usersResult.data);
    DatabaseService.setSetting('lastUserCount', usersResult.data.length);
  }

  // Fetch online users
  const onlineResult = await MikroTikService.getOnlineUsers();
  if (onlineResult.success) {
    setOnlineUsers(onlineResult.data);
    setStats({
      onlineCount: onlineResult.data.length,
      totalUsers: usersResult.data.length
    });
  }

  // Save usage history
  if (onlineResult.data.length > 0) {
    const user = onlineResult.data[0];
    DatabaseService.saveUsageHistory(
      1, // routerId
      user.id,
      user.name,
      parseInt(user.bytesIn),
      parseInt(user.bytesOut),
      user.loginTime,
      null
    );
  }
}
```

---

## Data Query Examples

### Get all users for a router

```javascript
const users = DatabaseService.getUsersByRouterId(1);
```

### Get recent activity

```javascript
const history = DatabaseService.getUsageHistory(1, 50);
```

### Filter high bandwidth users

```javascript
const history = DatabaseService.getUsageHistory(1, 100);
const highBandwidth = history.filter(
  h => (h.bytesIn + h.bytesOut) > 1000000 // > 1MB
);
```

### Export to CSV

```javascript
const headers = ['Username', 'Download', 'Upload', 'Duration'];
const rows = DatabaseService.getUsageHistory(1, 100).map(h => [
  h.userName,
  h.bytesOut,
  h.bytesIn,
  h.sessionDuration
]);

const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
```

---

## Error Handling

All database methods return success status:

```javascript
const result = DatabaseService.saveRouter(...);
if (result.success) {
  console.log('Saved:', result.id);
} else {
  console.error('Error:', result.message);
}
```

All API methods return error messages:

```javascript
const result = await MikroTikService.getHotspotUsers();
if (result.success) {
  console.log('Users:', result.data);
} else {
  console.error('Error:', result.message);
}
```

---

## Performance Considerations

1. **Pagination**: Limit queries for better performance
2. **Caching**: Store results in state to avoid repeated queries
3. **Batch Operations**: Process multiple items together
4. **Indexes**: Database automatically indexed on primary keys
5. **Archive**: Move old history to archive table for large databases

---

## Backup & Recovery

### Backup Database

```bash
# Windows
copy %USERPROFILE%\.mikrodesk\database.db backup.db

# Linux/Mac
cp ~/.mikrodesk/database.db backup.db
```

### Restore Database

```bash
# Windows
copy backup.db %USERPROFILE%\.mikrodesk\database.db

# Linux/Mac
cp backup.db ~/.mikrodesk/database.db
```

### Reset Database

Delete and restart app:
```bash
# Windows
del %USERPROFILE%\.mikrodesk\database.db

# Linux/Mac
rm ~/.mikrodesk/database.db
```

---

## Data Types

- `INTEGER` - Whole numbers
- `TEXT` - Strings and JSON
- `DATETIME` - Timestamps (YYYY-MM-DD HH:MM:SS)
- `REAL` - Decimal numbers (rarely used)

---

**Last Updated**: 2024-05-20
