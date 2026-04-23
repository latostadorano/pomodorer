const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let isQuitting = false;

function createWindow() {
  const bounds = store.get('windowBounds', {
    width: 900, height: 600,
    x: undefined, y: undefined,
  });

  const win = new BrowserWindow({
    width:  bounds.width,
    height: bounds.height,
    x:      bounds.x,
    y:      bounds.y,
    minWidth:  400,
    minHeight: 130,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#111111',
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadFile('index.html');

  // Persist window bounds
  const saveBounds = () => store.set('windowBounds', win.getBounds());
  win.on('resize', saveBounds);
  win.on('move',   saveBounds);

  win.on('close', async (e) => {
    if (isQuitting) return;
    e.preventDefault();
    const { response } = await dialog.showMessageBox(win, {
      type: 'question',
      buttons: ['Close', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
      message: 'Close Pomodorer?',
      detail: 'Any timers currently running will be lost.',
    });
    if (response === 0) {
      isQuitting = true;
      win.destroy();
    }
  });

  return win;
}

function buildMenu() {
  const template = [
    {
      label: 'Pomodorer',
      submenu: [
        { label: 'About Pomodorer', role: 'about' },
        { type: 'separator' },
        { label: 'Hide Pomodorer', role: 'hide' },
        { label: 'Hide Others',    role: 'hideOthers' },
        { label: 'Show All',       role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit Pomodorer', accelerator: 'Cmd+Q', role: 'quit' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize',          accelerator: 'Cmd+M',   role: 'minimize' },
        { label: 'Zoom',              role: 'zoom' },
        { label: 'Enter Full Screen', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Close Window',      accelerator: 'Cmd+W',   role: 'close' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', async (e) => {
  if (isQuitting) return;
  e.preventDefault();
  const win = BrowserWindow.getFocusedWindow();
  const { response } = await dialog.showMessageBox(win || null, {
    type: 'question',
    buttons: ['Quit', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
    message: 'Quit Pomodorer?',
    detail: 'Any timers currently running will be lost.',
  });
  if (response === 0) {
    isQuitting = true;
    app.quit();
  }
});

app.on('window-all-closed', () => app.quit());
