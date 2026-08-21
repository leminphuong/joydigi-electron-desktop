'use strict';

const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const APP_HOST = 'checkin.joydigi.net';
const CHECKIN_URL = 'https://checkin.joydigi.net/';
const KIOSK_URL = 'https://checkin.joydigi.net/kiosk/';

let mainWindow = null;
const launchInKiosk = process.argv.includes('--kiosk');

function parseUrl(rawUrl) {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

function isInternalUrl(rawUrl) {
  const parsed = parseUrl(rawUrl);
  return Boolean(
    parsed &&
    (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
    parsed.hostname === APP_HOST
  );
}

function isSafeExternalUrl(rawUrl) {
  const parsed = parseUrl(rawUrl);
  return Boolean(
    parsed &&
    ['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol)
  );
}

async function openExternal(rawUrl) {
  if (!isSafeExternalUrl(rawUrl)) return;

  try {
    await shell.openExternal(rawUrl);
  } catch (error) {
    console.error('Cannot open external URL:', rawUrl, error);
  }
}

function loadInternal(rawUrl) {
  if (!mainWindow || mainWindow.isDestroyed() || !isInternalUrl(rawUrl)) return;
  mainWindow.loadURL(rawUrl).catch((error) => {
    console.error('Cannot load internal URL:', rawUrl, error);
  });
}

function toolbarScript() {
  return `
(() => {
  const ID = '__joydigi_desktop_toolbar__';
  const old = document.getElementById(ID);
  if (old) old.remove();

  const host = document.createElement('div');
  host.id = ID;
  host.style.cssText = [
    'position:fixed',
    'top:12px',
    'left:50%',
    'transform:translateX(-50%)',
    'z-index:2147483647',
    'pointer-events:auto'
  ].join(';');

  const shadow = host.attachShadow({ mode: 'open' });
  const isKiosk = location.pathname.startsWith('/kiosk');

  shadow.innerHTML = \`
    <style>
      * { box-sizing: border-box; }
      .bar {
        display:flex;
        align-items:center;
        gap:4px;
        padding:5px;
        border:1px solid rgba(255,255,255,.20);
        border-radius:14px;
        background:rgba(20,22,26,.90);
        box-shadow:0 8px 28px rgba(0,0,0,.28);
        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);
        font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        user-select:none;
      }
      button {
        appearance:none;
        border:0;
        border-radius:10px;
        padding:8px 11px;
        background:transparent;
        color:#e9eef5;
        font:600 12px/1 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        cursor:pointer;
        white-space:nowrap;
      }
      button:hover { background:rgba(255,255,255,.10); }
      button.active { background:#fff; color:#15171b; }
      button.icon { width:34px; padding:8px 0; font-size:14px; }
      @media (max-width: 560px) {
        .bar { top:7px; }
        button { padding:7px 9px; }
      }
    </style>
    <div class="bar" role="toolbar" aria-label="JoyDigi Desktop">
      <button id="checkin" class="\${isKiosk ? '' : 'active'}">Check-in</button>
      <button id="kiosk" class="\${isKiosk ? 'active' : ''}">Kiosk</button>
      <button id="reload" class="icon" title="Tải lại">↻</button>
      <button id="fullscreen" class="icon" title="Toàn màn hình">⛶</button>
    </div>
  \`;

  shadow.getElementById('checkin').addEventListener('click', () => {
    location.href = '${CHECKIN_URL}';
  });

  shadow.getElementById('kiosk').addEventListener('click', () => {
    location.href = '${KIOSK_URL}';
  });

  shadow.getElementById('reload').addEventListener('click', () => {
    location.reload();
  });

  shadow.getElementById('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request failed', e);
    }
  });

  document.documentElement.appendChild(host);
})();
  `;
}

function injectToolbar() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const currentUrl = mainWindow.webContents.getURL();
  if (!isInternalUrl(currentUrl)) return;

  mainWindow.webContents.executeJavaScript(toolbarScript(), true).catch((error) => {
    console.error('Toolbar injection failed:', error);
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'JoyDigi Check-in',
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#111318',
    icon: process.platform === 'win32' ? path.join(__dirname, 'build', 'icon.ico') : path.join(__dirname, 'build', 'icon.png'),
    fullscreenable: true,
    kiosk: launchInKiosk,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      partition: 'persist:joydigi-checkin',
      devTools: !app.isPackaged
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternalUrl(url)) {
      setImmediate(() => loadInternal(url));
    } else if (isSafeExternalUrl(url)) {
      setImmediate(() => openExternal(url));
    }

    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, details) => {
    const url = typeof details === 'string' ? details : details.url;

    if (isInternalUrl(url)) return;

    event.preventDefault();
    if (isSafeExternalUrl(url)) openExternal(url);
  });

  mainWindow.webContents.on('will-redirect', (event, details) => {
    const url = typeof details === 'string' ? details : details.url;

    if (isInternalUrl(url)) return;

    event.preventDefault();
    if (isSafeExternalUrl(url)) openExternal(url);
  });

  mainWindow.webContents.on('did-finish-load', injectToolbar);

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    if (input.key === 'F11') {
      event.preventDefault();
      if (mainWindow.isKiosk()) {
        mainWindow.setKiosk(false);
      } else {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
      return;
    }

    if (input.key === 'Escape' && mainWindow.isFullScreen() && !mainWindow.isKiosk()) {
      event.preventDefault();
      mainWindow.setFullScreen(false);
      return;
    }

    if (input.control && input.key === '1') {
      event.preventDefault();
      loadInternal(CHECKIN_URL);
      return;
    }

    if (input.control && input.key === '2') {
      event.preventDefault();
      loadInternal(KIOSK_URL);
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (launchInKiosk && !mainWindow.isKiosk()) mainWindow.setKiosk(true);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  loadInternal(launchInKiosk ? KIOSK_URL : CHECKIN_URL);
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
