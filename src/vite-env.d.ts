/// <reference types="vite/client" />

interface BackupAPI {
  autoSave: (data: unknown) => Promise<{ success: boolean; path?: string; error?: string }>;
  export: (data: unknown) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
  import: () => Promise<{ success: boolean; data?: unknown; canceled?: boolean; error?: string }>;
  list: () => Promise<{ success: boolean; files?: { name: string; date: string; size: number }[]; error?: string }>;
  restoreAuto: (fileName: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  getPath: () => Promise<string>;
}

interface PrinterInfo {
  name: string;
  displayName: string;
  isDefault: boolean;
  status: number;
}

interface PrinterAPI {
  list: () => Promise<{ success: boolean; printers: PrinterInfo[]; error?: string }>;
  printSilent: (printerName: string, html: string, paperWidth?: number) => Promise<{ success: boolean; error?: string }>;
}

interface ElectronAPI {
  platform: string;
  backup: BackupAPI;
  printer: PrinterAPI;
}

interface Window {
  electronAPI?: ElectronAPI;
}
