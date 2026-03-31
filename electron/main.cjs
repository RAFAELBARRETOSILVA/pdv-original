const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Pasta de backups automáticos
const backupDir = path.join(app.getPath('userData'), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'Tá na Mão - PDV',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: true,
  });

  // In production, load the built files
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // In dev, load from Vite dev server
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

// === BACKUP IPC HANDLERS ===

// Salvar backup automático (chamado pelo renderer ao iniciar)
ipcMain.handle('backup:auto-save', async (_event, data) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-auto-${timestamp}.json`;
    const filePath = path.join(backupDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // Manter apenas os últimos 10 backups automáticos
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-auto-'))
      .sort()
      .reverse();
    for (let i = 10; i < files.length; i++) {
      fs.unlinkSync(path.join(backupDir, files[i]));
    }

    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Exportar backup manual (escolher pasta)
ipcMain.handle('backup:export', async (_event, data) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Salvar Backup',
      defaultPath: `pdv-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'Backup PDV', extensions: ['json'] }],
    });
    if (result.canceled) return { success: false, canceled: true };

    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, path: result.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Importar backup manual (escolher arquivo)
ipcMain.handle('backup:import', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Restaurar Backup',
      filters: [{ name: 'Backup PDV', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (result.canceled) return { success: false, canceled: true };

    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    const data = JSON.parse(content);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Listar backups automáticos
ipcMain.handle('backup:list', async () => {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .map(f => {
        const stat = fs.statSync(path.join(backupDir, f));
        return { name: f, date: stat.mtime.toISOString(), size: stat.size };
      });
    return { success: true, files };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Restaurar de backup automático
ipcMain.handle('backup:restore-auto', async (_event, fileName) => {
  try {
    const filePath = path.join(backupDir, fileName);
    if (!fs.existsSync(filePath)) return { success: false, error: 'Arquivo não encontrado' };
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Obter caminho da pasta de backups
ipcMain.handle('backup:get-path', async () => {
  return backupDir;
});

// === PRINTER IPC HANDLERS ===

// Listar impressoras instaladas no PC
ipcMain.handle('printer:list', async () => {
  try {
    const printers = mainWindow.webContents.getPrintersAsync
      ? await mainWindow.webContents.getPrintersAsync()
      : mainWindow.webContents.getPrinters();
    return {
      success: true,
      printers: printers.map(p => ({
        name: p.name,
        displayName: p.displayName || p.name,
        isDefault: p.isDefault,
        status: p.status,
      })),
    };
  } catch (err) {
    return { success: false, error: err.message, printers: [] };
  }
});

// Imprimir silenciosamente (sem diálogo) na impressora configurada
ipcMain.handle('printer:print-silent', async (_event, { printerName, html, paperWidth }) => {
  let printWin;
  try {
    // Calcular largura da janela baseada no papel
    const widthPx = paperWidth === 58 ? 220 : paperWidth === 80 ? 302 : 595;

    printWin = new BrowserWindow({
      show: false,
      width: widthPx,
      height: 900,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    // Garantir que o HTML é um documento completo
    const fullHtml = html.includes('<!DOCTYPE') || html.includes('<html')
      ? html
      : `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;

    // Registrar listener ANTES de carregar a URL para evitar race condition
    const loadPromise = new Promise((resolve) => {
      printWin.webContents.once('did-finish-load', resolve);
    });
    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);
    await loadPromise;

    // Delay para garantir renderização completa
    await new Promise(resolve => setTimeout(resolve, 300));

    // Definir tamanho da página para impressoras térmicas (em microns)
    // 58mm = 58000 microns, 80mm = 80000 microns
    const pw = (paperWidth || 80) * 1000; // largura em microns
    const ph = 297000; // altura padrão (será cortada pela impressora térmica)

    const printOptions = {
      silent: true,
      deviceName: printerName,
      printBackground: true,
      margins: { marginType: 'none' },
      pageSize: paperWidth === 210
        ? 'A4'
        : { width: pw, height: ph },
    };

    // Suporte para Electron com callback e com Promise
    await new Promise((resolve, reject) => {
      const result = printWin.webContents.print(printOptions, (success, failureReason) => {
        if (success) resolve(true);
        else reject(new Error(failureReason || 'Falha na impressão'));
      });
      // Se print() retorna Promise (Electron >= 28), tratar também
      if (result && typeof result.then === 'function') {
        result.then(resolve).catch(reject);
      }
    });

    printWin.close();
    printWin = null;
    return { success: true };
  } catch (err) {
    if (printWin && !printWin.isDestroyed()) {
      printWin.close();
    }
    return { success: false, error: err.message };
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
