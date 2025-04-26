const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Окно приложения
let mainWindow;

function createWindow() {
  console.log('Creating main window');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    show: false,
    backgroundColor: '#f0f2f5'
  });

  console.log('Main window created');

  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
  });

  // Загружаем наш HTML-файл напрямую
  const htmlFile = path.join(__dirname, 'absolute-standalone.html');
  if (fs.existsSync(htmlFile)) {
    console.log(`Loading HTML file: ${htmlFile}`);
    mainWindow.loadFile(htmlFile)
      .then(() => console.log('HTML file loaded successfully'))
      .catch(err => console.error('Failed to load HTML file:', err));
  } else {
    console.error('HTML file not found:', htmlFile);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
}); 