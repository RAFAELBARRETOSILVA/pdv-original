import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PrinterConfig } from '@/types/pos';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function compressImage(
  dataUrl: string,
  maxWidth = 400,
  quality = 0.7,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;

      if (w > maxWidth) {
        h = (h * maxWidth) / w;
        w = maxWidth;
      }

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export interface ViaCepResult {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento: string;
  erro?: boolean;
}

export async function fetchCep(cep: string): Promise<ViaCepResult | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.erro) return null;

    return data as ViaCepResult;
  } catch {
    return null;
  }
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
}

type PrintTarget = 'main' | 'kitchen';

function openPrintWindow(html: string) {
  const printWindow = window.open('', '_blank', 'width=420,height=760');
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 500);
}

export async function printHtml(
  html: string,
  printerConfig?: PrinterConfig,
  target: PrintTarget = 'main',
) {
  const paperWidth = printerConfig?.paperWidth || 80;

  const selectedPrinter =
    target === 'kitchen'
      ? (printerConfig?.kitchenPrinterName || printerConfig?.printerName || '')
      : (printerConfig?.printerName || '');

  const canSilentPrint =
    Boolean(printerConfig?.autoPrint) &&
    Boolean(selectedPrinter) &&
    Boolean(window.electronAPI?.printer);

  if (canSilentPrint) {
    try {
      const result = await window.electronAPI!.printer.printSilent(
        selectedPrinter,
        html,
        paperWidth,
      );

      if (!result.success) {
        console.warn(`Impressão silenciosa (${target}) falhou:`, result.error);
        openPrintWindow(html);
      }
      return;
    } catch (error) {
      console.warn(`Erro de impressão (${target}):`, error);
      openPrintWindow(html);
      return;
    }
  }

  openPrintWindow(html);
}