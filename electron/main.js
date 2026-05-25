const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');

const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  console.log('[MAIN] Creating window...');
  mainWindow = new BrowserWindow({
    width: 852,
    height: 710,
    minWidth: 600,
    minHeight: 500,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false, // disabled so preload can use ipcRenderer fully
    },
    icon: path.join(__dirname, '../public/icon.png'),
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  console.log('[MAIN] Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[MAIN] Page loaded successfully');
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.log('[MAIN] Renderer process gone:', details.reason);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER ${level}] ${message} (${sourceId}:${line})`);
  });
}

app.on('ready', () => {
  console.log('[MAIN] App ready');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// ─── Menu ──────────────────────────────────────────────────────────────────
const template = [
  {
    label: 'File',
    submenu: [{ label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }],
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
      { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
      { type: 'separator' },
      { label: 'Cut',   accelerator: 'CmdOrCtrl+X', role: 'cut'   },
      { label: 'Copy',  accelerator: 'CmdOrCtrl+C', role: 'copy'  },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
    ],
  },
  {
    label: 'View',
    submenu: [
      { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
      { label: 'Toggle Developer Tools', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' },
    ],
  },
];
Menu.setApplicationMenu(Menu.buildFromTemplate(template));

// ─── IPC: app-version ──────────────────────────────────────────────────────
ipcMain.handle('app-version', () => ({ version: app.getVersion() }));

// ─── IPC: app:print ────────────────────────────────────────────────────────
ipcMain.handle('app:print', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.webContents.print({ printBackground: true });
  }
  return true;
});

// ─── Helper: make HTTP/HTTPS request from main process ────────────────────
function makeRequest({ ip, port, path: urlPath, method = 'GET', username, password, body, useHttps = false }) {
  return new Promise((resolve) => {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    const lib = useHttps ? https : http;

    const bodyStr = body ? JSON.stringify(body) : null;

    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };

    // MikroTik REST API requires Content-Length for POST/PATCH/PUT requests
    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const options = {
      hostname: ip,
      port: port || (useHttps ? 443 : 80),
      path: urlPath,
      method,
      headers,
      timeout: 8000,
      // Skip SSL verification for self-signed certs on routers
      rejectUnauthorized: false,
    };

    console.log(`[MIKROTIK] ${method} ${urlPath}${bodyStr ? ' body=' + bodyStr : ''}`);

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[MIKROTIK] Response ${res.statusCode}: ${data}`);
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, success: res.statusCode >= 200 && res.statusCode < 300 });
        } catch {
          resolve({ status: res.statusCode, data: data, success: res.statusCode >= 200 && res.statusCode < 300 });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, data: null, success: false, error: 'TIMEOUT' });
    });

    req.on('error', (err) => {
      resolve({ status: 0, data: null, success: false, error: err.code || err.message });
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ─── IPC: mikrotik:connect ────────────────────────────────────────────────
ipcMain.handle('mikrotik:connect', async (event, { ip, port, username, password }) => {
  console.log(`[MIKROTIK] Connecting to ${ip}:${port}`);

  const res = await makeRequest({
    ip, port: port || 80,
    path: '/rest/system/identity',
    username, password,
  });

  console.log(`[MIKROTIK] Connect result: status=${res.status} error=${res.error}`);

  if (res.success) {
    if (typeof res.data === 'object' && res.data !== null && 'name' in res.data) {
      return { success: true, message: 'Connected successfully', data: res.data };
    } else {
      return { success: false, message: 'Connected to device, but it does not appear to be a MikroTik router (REST API disabled or wrong device).' };
    }
  }

  if (res.error === 'TIMEOUT') {
    return {
      success: false,
      message: `Timeout — router at ${ip}:${port} did not respond.\n\nTroubleshoot:\n• Check the IP address is correct\n• Make sure you are on the same network\n• Enable REST API: RouterOS → IP → Services → www (port 80)`,
    };
  }
  if (res.error === 'ECONNREFUSED') {
    return {
      success: false,
      message: `Connection refused at ${ip}:${port}.\n\nTo enable REST API on MikroTik:\n1. Open Winbox or WebFig\n2. Go to IP → Services\n3. Enable "www" service (port 80)\n4. Make sure firewall allows port 80`,
    };
  }
  if (res.error === 'ENOTFOUND' || res.error === 'ENETUNREACH') {
    return {
      success: false,
      message: `Cannot find router at "${ip}".\nCheck the IP address and your network connection.`,
    };
  }
  if (res.status === 401) {
    return { success: false, message: 'Wrong username or password.' };
  }
  if (res.status === 403) {
    return { success: false, message: 'Access denied. The user may not have API access.' };
  }
  if (res.status === 404) {
    return {
      success: false,
      message: `REST API not found at port ${port}.\nRequires RouterOS 7.1+.\nEnable: IP → Services → www`,
    };
  }

  return { success: false, message: `Connection failed (HTTP ${res.status || res.error})` };
});

// ─── IPC: mikrotik:request ────────────────────────────────────────────────
ipcMain.handle('mikrotik:request', async (event, { ip, port, username, password, method, path: urlPath, body }) => {
  const res = await makeRequest({ ip, port: port || 80, path: urlPath, method, username, password, body });
  // Attach MikroTik's error detail to the response so UI can display it
  if (!res.success && res.data) {
    const detail = typeof res.data === 'object' ? (res.data.detail || res.data.message || JSON.stringify(res.data)) : res.data;
    res.errorDetail = detail;
  }
  return res;
});

// ─── IPC: mikrotik:discover (MNDP Network Discovery) ──────────────────────
const dgram = require('dgram');

ipcMain.handle('mikrotik:discover', async () => {
  return new Promise((resolve) => {
    const routers = [];
    const socket = dgram.createSocket('udp4');
    
    socket.on('message', (msg, rinfo) => {
      // Basic check for MNDP packet
      if (rinfo.port === 5678) {
        // In a full implementation, we would parse the TLV pairs here to get Identity/Version
        // For now, we'll just capture the IP of any device responding on 5678
        if (!routers.some(r => r.ip === rinfo.address)) {
          routers.push({ ip: rinfo.address, mac: '', identity: 'MikroTik Device' });
        }
      }
    });

    socket.on('error', (err) => {
      console.error('[MAIN] MNDP Socket Error:', err);
      socket.close();
      resolve({ success: false, data: [] });
    });

    socket.bind(0, () => {
      socket.setBroadcast(true);
      // Send a dummy broadcast to trigger MNDP responses
      const message = Buffer.from([0, 0, 0, 0]); 
      socket.send(message, 0, message.length, 5678, '255.255.255.255', (err) => {
        if (err) console.error('[MAIN] MNDP Broadcast error:', err);
      });
      
      // Also send to limited broadcast
      socket.send(message, 0, message.length, 5678, '192.168.88.255', (err) => {});
    });

    // Wait 3 seconds for responses
    setTimeout(() => {
      try {
        socket.close();
      } catch (e) {}
      resolve({ success: true, data: routers });
    }, 3000);
  });
});
