import { useState, useEffect } from 'react';
import { usePosStore } from '@/store/pos-store';
import {
  Plus,
  Trash2,
  Save,
  Store,
  Truck,
  Image,
  X,
  CreditCard,
  Smartphone,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  Printer,
  RefreshCw,
  Pencil,
  Check,
  ChefHat,
} from 'lucide-react';
import {
  PixKeyType,
  PIX_KEY_TYPE_LABELS,
  PrinterType,
  PRINTER_TYPE_LABELS,
} from '@/types/pos';
import { toast } from 'sonner';
import { compressImage, fetchCep, formatCep } from '@/lib/utils';

type InstalledPrinter = {
  name: string;
  displayName: string;
  isDefault: boolean;
};

export default function Settings() {
  const {
    deliveryTiers,
    storeName,
    storeLogo,
    storePhone,
    storeAddress,
    storeCep,
    storeCity,
    storeState,
    enabledPaymentMethods,
    pixConfig,
    printerConfig,
    menuLink,
    addDeliveryTier,
    updateDeliveryTier,
    removeDeliveryTier,
    setStoreName,
    setStoreLogo,
    setStoreInfo,
    setEnabledPaymentMethods,
    setPixConfig,
    setPrinterConfig,
    setMenuLink,
  } = usePosStore();

  const [newTier, setNewTier] = useState({ fromKm: '', toKm: '', fee: '' });
  const [editingName, setEditingName] = useState(storeName);

  const [pixForm, setPixForm] = useState({
    pixKey: pixConfig?.pixKey || '',
    pixKeyType: (pixConfig?.pixKeyType || 'cpf') as PixKeyType,
    bankName: pixConfig?.bankName || '',
    beneficiaryName: pixConfig?.beneficiaryName || '',
  });

  const [autoBackups, setAutoBackups] = useState<{ name: string; date: string; size: number }[]>([]);
  const [backupPath, setBackupPath] = useState('');
  const [installedPrinters, setInstalledPrinters] = useState<InstalledPrinter[]>([]);

  const [printerForm, setPrinterForm] = useState({
    printerName: printerConfig?.printerName || '',
    kitchenPrinterName: printerConfig?.kitchenPrinterName || '',
    printerType: (printerConfig?.printerType || 'thermal') as PrinterType,
    paperWidth: printerConfig?.paperWidth || 80,
    autoPrint: printerConfig?.autoPrint || false,
  });

  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [editingTierFee, setEditingTierFee] = useState('');
  const [customMenuLink, setCustomMenuLink] = useState(menuLink || '');

  const [storeInfoForm, setStoreInfoForm] = useState({
    phone: storePhone || '',
    address: storeAddress || '',
    cep: storeCep || '',
    city: storeCity || '',
    state: storeState || '',
  });

  const isElectron = !!window.electronAPI?.backup;

  const handleAddTier = () => {
    if (!newTier.fromKm || !newTier.toKm || !newTier.fee) {
      toast.error('Preencha todos os campos da faixa');
      return;
    }

    addDeliveryTier({
      fromKm: Number(newTier.fromKm),
      toKm: Number(newTier.toKm),
      fee: Number(newTier.fee),
    });

    setNewTier({ fromKm: '', toKm: '', fee: '' });
    toast.success('Faixa adicionada');
  };

  const handleSaveName = () => {
    setStoreName(editingName);
    toast.success('Nome atualizado');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 2MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione uma imagem');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const compressed = await compressImage(base64, 200, 0.8);
      setStoreLogo(compressed);
      toast.success('Logo atualizada com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setStoreLogo(undefined);
    toast.success('Logo removida');
  };

  const handleSaveStoreInfo = () => {
    setStoreInfo({
      phone: storeInfoForm.phone,
      address: storeInfoForm.address,
      cep: storeInfoForm.cep,
      city: storeInfoForm.city,
      state: storeInfoForm.state,
    });
    toast.success('Informações da loja atualizadas');
  };

  useEffect(() => {
    loadAutoBackups();
    loadBackupPath();
    loadPrinters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAutoBackups = async () => {
    if (!isElectron) return;

    const result = await window.electronAPI!.backup.list();
    if (result.success && result.files) {
      setAutoBackups(result.files);
    }
  };

  const loadBackupPath = async () => {
    if (!isElectron) return;
    const p = await window.electronAPI!.backup.getPath();
    setBackupPath(p);
  };

  const loadPrinters = async () => {
    if (!window.electronAPI?.printer) return;

    setLoadingPrinters(true);

    try {
      const result = await window.electronAPI.printer.list();

      if (result.success) {
        setInstalledPrinters(result.printers);

        if (!printerForm.printerName && result.printers.length > 0) {
          const defaultPrinter =
            result.printers.find((p) => p.isDefault) || result.printers[0];

          setPrinterForm((current) => ({
            ...current,
            printerName: defaultPrinter.name,
          }));
        }
      }
    } catch {
      // fail silently on web
    }

    setLoadingPrinters(false);
  };

  const handleExportBackup = async () => {
    const raw = localStorage.getItem('pos-storage');
    if (!raw) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const data = JSON.parse(raw);

    if (isElectron) {
      const result = await window.electronAPI!.backup.export(data);
      if (result.canceled) return;

      if (result.success) {
        toast.success('Backup exportado com sucesso!');
      } else {
        toast.error('Erro ao exportar: ' + result.error);
      }
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pdv-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Backup baixado!');
    }
  };

  const handleImportBackup = async () => {
    if (isElectron) {
      const result = await window.electronAPI!.backup.import();
      if (result.canceled) return;

      if (result.success && result.data) {
        localStorage.setItem('pos-storage', JSON.stringify(result.data));
        toast.success('Backup restaurado! Reiniciando...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error('Erro ao restaurar: ' + result.error);
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target?.result as string);
            localStorage.setItem('pos-storage', JSON.stringify(data));
            toast.success('Backup restaurado! Reiniciando...');
            setTimeout(() => window.location.reload(), 1000);
          } catch {
            toast.error('Arquivo de backup inválido');
          }
        };
        reader.readAsText(file);
      };

      input.click();
    }
  };

  const handleRestoreAutoBackup = async (fileName: string) => {
    if (!isElectron) return;

    const result = await window.electronAPI!.backup.restoreAuto(fileName);
    if (result.success && result.data) {
      localStorage.setItem('pos-storage', JSON.stringify(result.data));
      toast.success('Backup restaurado! Reiniciando...');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error('Erro ao restaurar: ' + result.error);
    }
  };

  const handleForceAutoBackup = async () => {
    const raw = localStorage.getItem('pos-storage');
    if (!raw) {
      toast.error('Nenhum dado para backup');
      return;
    }

    if (isElectron) {
      const result = await window.electronAPI!.backup.autoSave(JSON.parse(raw));
      if (result.success) {
        toast.success('Backup salvo com sucesso!');
        loadAutoBackups();
      } else {
        toast.error('Erro: ' + result.error);
      }
    } else {
      toast.info('Backup automático disponível apenas no aplicativo desktop');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const buildTestHtml = (title: string, printerName: string, kitchen = false) => {
    const pw = printerForm.paperWidth || 80;
    const bodyWidth = pw === 58 ? 190 : pw === 80 ? 270 : 500;

    return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: ${pw}mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              width: ${bodyWidth}px;
              margin: 0;
              padding: 8px;
              font-size: 12px;
              color: #000;
            }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin:0;">${storeName}</h2>
            <p style="margin:4px 0;">${title}</p>
            <p style="margin:4px 0;">${new Date().toLocaleString('pt-BR')}</p>
          </div>

          <div class="line"></div>

          ${
            kitchen
              ? `
                <p style="font-weight:bold; font-size:16px;">1x X-BURGER</p>
                <p style="margin-top:4px;">OBS: Sem cebola</p>
                <p style="margin-top:8px; font-weight:bold; font-size:16px;">2x REFRIGERANTE LATA</p>
              `
              : `
                <p>Pedido: #PEDIDO TESTE</p>
                <p>Impressora: ${printerName || 'Navegador'}</p>
                <p>Tipo: ${PRINTER_TYPE_LABELS[printerForm.printerType]}</p>
                <p>Papel: ${pw}mm</p>
                <p style="margin-top:8px; font-weight:bold;">TOTAL: R$ 39,90</p>
              `
          }

          <div class="line"></div>

          <div class="center">
            <p style="font-weight:bold;">Funcionando!</p>
          </div>
        </body>
      </html>`;
  };

  const handleTestPrinter = async (printerName: string, label: string, kitchen = false) => {
    if (!window.electronAPI?.printer) {
      toast.info('Teste silencioso disponível apenas no aplicativo desktop');
      return;
    }

    if (!printerName) {
      toast.error(
        kitchen
          ? 'Selecione uma impressora da cozinha'
          : 'Selecione uma impressora principal',
      );
      return;
    }

    const html = buildTestHtml(label, printerName, kitchen);
    const pw = printerForm.paperWidth || 80;

    const result = await window.electronAPI!.printer.printSilent(
      printerName,
      html,
      pw,
    );

    if (result.success) {
      toast.success(
        kitchen
          ? 'Teste enviado para a impressora da cozinha!'
          : 'Teste enviado para a impressora principal!',
      );
    } else {
      toast.error('Erro: ' + result.error);
    }
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto pos-scrollbar animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>

      <div className="bg-card border border-border rounded-2xl p-5 mb-6 animate-scale-in">
        <div className="flex items-center gap-2 mb-4">
          <Store className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Nome da Loja</h2>
        </div>

        <div className="flex gap-2">
          <input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSaveName}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-all"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="bg-card border border-border rounded-2xl p-5 mb-6 animate-scale-in"
        style={{ animationDelay: '40ms' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Image className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Logo da Loja</h2>
        </div>

        {storeLogo ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center w-full h-32 bg-secondary/50 rounded-lg overflow-hidden">
              <img
                src={storeLogo}
                alt="Logo da loja"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <button
              onClick={handleRemoveLogo}
              className="w-full px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              Remover Logo
            </button>
          </div>
        ) : (
          <label className="block w-full">
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
              <div className="text-center">
                <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-semibold">Clique para selecionar uma imagem</p>
                <p className="text-xs text-muted-foreground">JPG, PNG (máx 2MB)</p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div
        className="bg-card border border-border rounded-2xl p-5 mb-6 animate-scale-in"
        style={{ animationDelay: '80ms' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Store className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Informações de Localização</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Telefone/WhatsApp
            </label>
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={storeInfoForm.phone}
              onChange={(e) =>
                setStoreInfoForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">CEP</label>
            <input
              placeholder="12345-678"
              value={storeInfoForm.cep}
              onChange={async (e) => {
                const formatted = formatCep(e.target.value);
                setStoreInfoForm((f) => ({ ...f, cep: formatted }));

                if (formatted.replace(/\D/g, '').length === 8) {
                  const data = await fetchCep(formatted);
                  if (data) {
                    setStoreInfoForm((f) => ({
                      ...f,
                      address: data.logradouro || f.address,
                      city: data.localidade || f.city,
                      state: data.uf || f.state,
                    }));
                    toast.success('Endereço encontrado!');
                  }
                }
              }}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Endereço</label>
            <input
              placeholder="Rua, número, complemento"
              value={storeInfoForm.address}
              onChange={(e) =>
                setStoreInfoForm((f) => ({ ...f, address: e.target.value }))
              }
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Bairro/Cidade
              </label>
              <input
                placeholder="Cidade"
                value={storeInfoForm.city}
                onChange={(e) =>
                  setStoreInfoForm((f) => ({ ...f, city: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Estado</label>
              <input
                placeholder="SP, RJ..."
                value={storeInfoForm.state}
                onChange={(e) =>
                  setStoreInfoForm((f) => ({ ...f, state: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <button
            onClick={handleSaveStoreInfo}
            className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Informações
          </button>
        </div>
      </div>

      <div
        className="bg-card border border-border rounded-2xl p-5 animate-scale-in"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Truck className="h-5 w-5 text-pos-delivery" />
          <h2 className="font-semibold">Faixas de Taxa de Entrega</h2>
        </div>

        <div className="space-y-2 mb-4">
          {deliveryTiers.map((tier) => (
            <div
              key={tier.id}
              className="flex items-center gap-2 bg-secondary/40 rounded-lg px-4 py-3 text-sm"
            >
              {editingTierId === tier.id ? (
                <>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      step="0.5"
                      value={tier.fromKm}
                      onChange={(e) =>
                        updateDeliveryTier(tier.id, {
                          fromKm: Number(e.target.value),
                        })
                      }
                      className="w-16 px-2 py-1 bg-background border border-border rounded text-sm text-center tabular-nums"
                    />
                    <span className="text-muted-foreground text-xs">até</span>
                    <input
                      type="number"
                      step="0.5"
                      value={tier.toKm}
                      onChange={(e) =>
                        updateDeliveryTier(tier.id, {
                          toKm: Number(e.target.value),
                        })
                      }
                      className="w-16 px-2 py-1 bg-background border border-border rounded text-sm text-center tabular-nums"
                    />
                    <span className="text-muted-foreground text-xs">km → R$</span>
                    <input
                      type="number"
                      step="0.50"
                      value={editingTierFee}
                      onChange={(e) => setEditingTierFee(e.target.value)}
                      className="w-20 px-2 py-1 bg-background border border-border rounded text-sm text-center tabular-nums"
                    />
                  </div>
                  <button
                    onClick={() => {
                      updateDeliveryTier(tier.id, {
                        fee: Number(editingTierFee),
                      });
                      setEditingTierId(null);
                      toast.success('Faixa atualizada');
                    }}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 active:scale-90 transition-all"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1">
                    <span className="font-semibold">{tier.fromKm}km</span>
                    <span className="text-muted-foreground"> até </span>
                    <span className="font-semibold">{tier.toKm}km</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="font-bold text-primary">
                      R$ {tier.fee.toFixed(2).replace('.', ',')}
                    </span>
                  </span>
                  <button
                    onClick={() => {
                      setEditingTierId(tier.id);
                      setEditingTierFee(String(tier.fee));
                    }}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary active:scale-90 transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeDeliveryTier(tier.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 active:scale-90 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}

          {deliveryTiers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma faixa cadastrada
            </p>
          )}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">De (km)</label>
            <input
              type="number"
              step="0.5"
              value={newTier.fromKm}
              onChange={(e) =>
                setNewTier((t) => ({ ...t, fromKm: e.target.value }))
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring tabular-nums"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Até (km)</label>
            <input
              type="number"
              step="0.5"
              value={newTier.toKm}
              onChange={(e) =>
                setNewTier((t) => ({ ...t, toKm: e.target.value }))
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring tabular-nums"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Taxa (R$)</label>
            <input
              type="number"
              step="0.50"
              value={newTier.fee}
              onChange={(e) =>
                setNewTier((t) => ({ ...t, fee: e.target.value }))
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring tabular-nums"
            />
          </div>
          <button
            onClick={handleAddTier}
            className="h-[38px] px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-all flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="bg-card border border-border rounded-2xl p-5 mt-6 animate-scale-in"
        style={{ animationDelay: '200ms' }}
      >
        <h2 className="font-semibold mb-2">Link do Cardápio Online</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Use o cardápio integrado ou coloque o link do seu cardápio online externo
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Cardápio Integrado (interno)
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={`${window.location.origin}/menu`}
                className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-muted-foreground"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/menu`);
                  toast.success('Link copiado!');
                }}
                className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm active:scale-95 transition-all"
              >
                Copiar
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Cardápio Externo (opcional)
            </label>
            <p className="text-[10px] text-muted-foreground mb-1">
              Cole o link do seu cardápio externo (iFood, Goomer, etc.)
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://meu-cardapio.com.br"
                value={customMenuLink}
                onChange={(e) => setCustomMenuLink(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => {
                  setMenuLink(customMenuLink || undefined);
                  toast.success(
                    customMenuLink ? 'Link externo salvo!' : 'Link externo removido',
                  );
                }}
                className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-all"
              >
                <Save className="h-4 w-4" />
              </button>
            </div>
          </div>

          {menuLink && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(menuLink);
                  toast.success('Link externo copiado!');
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm active:scale-95 transition-all"
              >
                Copiar Link Externo
              </button>
              <button
                onClick={() => {
                  setCustomMenuLink('');
                  setMenuLink(undefined);
                  toast.success('Link externo removido');
                }}
                className="px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive font-semibold text-sm active:scale-95 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className="bg-card border border-border rounded-2xl p-5 mt-6 animate-scale-in"
        style={{ animationDelay: '220ms' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Métodos de Pagamento</h2>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Escolha quais formas de pagamento ativar no seu PDV
        </p>

        <div className="space-y-2">
          {(['pix', 'credit', 'debit', 'cash', 'online'] as const).map((method) => (
            <div
              key={method}
              className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border hover:border-muted-foreground/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={enabledPaymentMethods.includes(method)}
                  onChange={(e) => {
                    const newMethods = e.target.checked
                      ? [...enabledPaymentMethods, method]
                      : enabledPaymentMethods.filter((m) => m !== method);

                    setEnabledPaymentMethods(newMethods);
                  }}
                  className="w-4 h-4 cursor-pointer accent-primary"
                />
                <div>
                  <p className="font-semibold text-sm">
                    {method === 'pix' && '💳 PIX'}
                    {method === 'credit' && '💳 Crédito'}
                    {method === 'debit' && '💳 Débito'}
                    {method === 'cash' && '💵 Dinheiro'}
                    {method === 'online' && '🌐 Online'}
                  </p>
                  {method === 'online' && (
                    <p className="text-xs text-muted-foreground">
                      Requer configuração de API
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  enabledPaymentMethods.includes(method)
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                }`}
              >
                {enabledPaymentMethods.includes(method) ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-4">
          <p className="text-xs text-primary">
            <strong>💡 Dica:</strong> Os métodos ativados aparecerão como opções de
            pagamento no cardápio online dos seus clientes.
          </p>
        </div>
      </div>

      <div
        className="bg-card border border-border rounded-2xl p-5 mt-6 animate-scale-in"
        style={{ animationDelay: '230ms' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="h-5 w-5 text-[#00D4FF]" />
          <h2 className="font-semibold">Configuração do PIX</h2>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Configure sua chave PIX para receber pagamentos e imprimir na comanda
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Nome do Beneficiário
            </label>
            <input
              placeholder="Nome completo ou razão social"
              value={pixForm.beneficiaryName}
              onChange={(e) =>
                setPixForm((f) => ({ ...f, beneficiaryName: e.target.value }))
              }
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Tipo de Chave PIX
            </label>
            <select
              value={pixForm.pixKeyType}
              onChange={(e) =>
                setPixForm((f) => ({
                  ...f,
                  pixKeyType: e.target.value as PixKeyType,
                }))
              }
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {(Object.entries(PIX_KEY_TYPE_LABELS) as [PixKeyType, string][]).map(
                ([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Chave PIX
            </label>
            <input
              placeholder={
                pixForm.pixKeyType === 'cpf'
                  ? '000.000.000-00'
                  : pixForm.pixKeyType === 'cnpj'
                    ? '00.000.000/0000-00'
                    : pixForm.pixKeyType === 'email'
                      ? 'email@exemplo.com'
                      : pixForm.pixKeyType === 'phone'
                        ? '(11) 99999-9999'
                        : 'Chave aleatória'
              }
              value={pixForm.pixKey}
              onChange={(e) =>
                setPixForm((f) => ({ ...f, pixKey: e.target.value }))
              }
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Banco</label>
            <input
              placeholder="Ex: Nubank, Itaú, Bradesco, Inter..."
              value={pixForm.bankName}
              onChange={(e) =>
                setPixForm((f) => ({ ...f, bankName: e.target.value }))
              }
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            onClick={() => {
              if (!pixForm.pixKey || !pixForm.bankName || !pixForm.beneficiaryName) {
                toast.error('Preencha todos os campos do PIX');
                return;
              }

              setPixConfig({
                pixKey: pixForm.pixKey,
                pixKeyType: pixForm.pixKeyType,
                bankName: pixForm.bankName,
                beneficiaryName: pixForm.beneficiaryName,
              });

              toast.success('Configuração PIX salva com sucesso!');
            }}
            className="w-full px-4 py-2.5 rounded-lg bg-[#00D4FF] text-white font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar PIX
          </button>
        </div>

        {pixConfig && (
          <div className="mt-4 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-[#00D4FF] mb-1">
              ✅ PIX Configurado
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Beneficiário:</strong> {pixConfig.beneficiaryName}
              <br />
              <strong>Tipo:</strong> {PIX_KEY_TYPE_LABELS[pixConfig.pixKeyType]}
              <br />
              <strong>Chave:</strong> {pixConfig.pixKey}
              <br />
              <strong>Banco:</strong> {pixConfig.bankName}
            </p>
          </div>
        )}
      </div>

      <div
        className="bg-card border border-border rounded-2xl p-5 mt-6 animate-scale-in"
        style={{ animationDelay: '240ms' }}
      >
        <h2 className="font-semibold mb-2">Integração com Plataformas</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Integre seus pedidos de outras plataformas de delivery
        </p>

        <div className="space-y-3">
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <h3 className="font-semibold text-sm mb-2">🍔 iFood</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Para integrar seus pedidos do iFood com este PDV, você precisa:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Acessar seu painel de gerenciamento no iFood</li>
              <li>Configurar a integração via API ou webhook</li>
              <li>Usar sua chave de API para conectar com um sistema de integração</li>
            </ul>
            <a
              href="https://www.ifood.com.br/restaurante"
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 text-xs text-primary hover:underline font-semibold"
            >
              Acessar iFood para restaurantes →
            </a>
          </div>

          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <h3 className="font-semibold text-sm mb-2">🚗 Uber Eats</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Configure sua conta e ative a integração com sistema de gestão:
            </p>
            <a
              href="https://www.ubereats.com/pt-BR/restaurant/register"
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 text-xs text-primary hover:underline font-semibold"
            >
              Registre no Uber Eats →
            </a>
          </div>

          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <h3 className="font-semibold text-sm mb-2">
              📦 Loggi / Outras Plataformas
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Para integração com outras plataformas de delivery, entre em contato com
              o suporte técnico.
            </p>
            <p className="text-xs mt-2 text-muted-foreground">
              <strong>Dica:</strong> Você pode usar serviços de integração como Zapier
              ou Make.com para conectar plataformas.
            </p>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-4">
          <p className="text-xs text-primary">
            <strong>💡 Nota:</strong> As integrações geralmente requerem configuração
            técnica. Consulte a documentação de cada plataforma ou contacte seu
            suporte.
          </p>
        </div>
      </div>

      <div
        className="bg-card border border-border rounded-2xl p-5 mt-6 animate-scale-in"
        style={{ animationDelay: '250ms' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Printer className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Configuração de Impressoras</h2>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Configure a impressora principal e, se quiser, uma impressora exclusiva da cozinha. Se a impressora da cozinha não for configurada, a comanda da cozinha sairá na impressora principal.
        </p>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">
                Impressora Principal (caixa e pagamento)
              </label>
              <button
                onClick={loadPrinters}
                disabled={loadingPrinters}
                className="flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline"
              >
                <RefreshCw
                  className={`h-3 w-3 ${loadingPrinters ? 'animate-spin' : ''}`}
                />
                Buscar
              </button>
            </div>

            {installedPrinters.length > 0 ? (
              <select
                value={printerForm.printerName}
                onChange={(e) =>
                  setPrinterForm((f) => ({ ...f, printerName: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecione uma impressora principal</option>
                {installedPrinters.map((printer) => (
                  <option key={printer.name} value={printer.name}>
                    {printer.displayName} {printer.isDefault ? '(Padrão)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-muted-foreground">
                {window.electronAPI?.printer
                  ? 'Clique em "Buscar" para encontrar impressoras'
                  : 'Disponível apenas no aplicativo desktop'}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-4 bg-secondary/10">
            <div className="flex items-center gap-2 mb-3">
              <ChefHat className="h-4 w-4 text-orange-500" />
              <h3 className="font-semibold text-sm">Impressora da Cozinha</h3>
            </div>

            <label className="text-xs text-muted-foreground block mb-1">
              Impressora exclusiva da cozinha (opcional)
            </label>

            {installedPrinters.length > 0 ? (
              <select
                value={printerForm.kitchenPrinterName}
                onChange={(e) =>
                  setPrinterForm((f) => ({
                    ...f,
                    kitchenPrinterName: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">
                  Não usar impressora separada (usar a principal)
                </option>
                {installedPrinters.map((printer) => (
                  <option key={`kitchen-${printer.name}`} value={printer.name}>
                    {printer.displayName} {printer.isDefault ? '(Padrão)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-muted-foreground">
                {window.electronAPI?.printer
                  ? 'Clique em "Buscar" para encontrar impressoras'
                  : 'Disponível apenas no aplicativo desktop'}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground mt-2">
              Quando estiver vazia, o sistema manda a comanda da cozinha para a impressora principal.
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Tipo de Impressora
            </label>
            <select
              value={printerForm.printerType}
              onChange={(e) =>
                setPrinterForm((f) => ({
                  ...f,
                  printerType: e.target.value as PrinterType,
                }))
              }
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {(Object.entries(PRINTER_TYPE_LABELS) as [PrinterType, string][]).map(
                ([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Largura do Papel (mm)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[58, 80, 210].map((w) => (
                <button
                  key={w}
                  onClick={() =>
                    setPrinterForm((f) => ({ ...f, paperWidth: w }))
                  }
                  className={`py-2 rounded-lg text-sm font-semibold border-2 transition-all active:scale-95 ${
                    printerForm.paperWidth === w
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  {w}mm
                  <span className="block text-[10px] text-muted-foreground font-normal">
                    {w === 58 ? 'Térmica P' : w === 80 ? 'Térmica G' : 'A4'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Impressão Automática</p>
              <p className="text-[10px] text-muted-foreground">
                Ativa a impressão silenciosa quando houver impressora configurada
              </p>
            </div>
            <button
              onClick={() =>
                setPrinterForm((f) => ({ ...f, autoPrint: !f.autoPrint }))
              }
              className={`relative w-11 h-6 rounded-full transition-colors ${
                printerForm.autoPrint ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  printerForm.autoPrint ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => {
              if (!printerForm.printerName && window.electronAPI?.printer) {
                toast.error('Selecione uma impressora principal');
                return;
              }

              setPrinterConfig({
                printerName: printerForm.printerName,
                kitchenPrinterName: printerForm.kitchenPrinterName || undefined,
                printerType: printerForm.printerType,
                paperWidth: printerForm.paperWidth,
                autoPrint: printerForm.autoPrint,
              });

              toast.success('Configuração de impressoras salva!');
            }}
            className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Impressoras
          </button>

          {window.electronAPI?.printer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleTestPrinter(
                    printerForm.printerName,
                    '--- TESTE IMPRESSORA PRINCIPAL ---',
                    false,
                  )
                }
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-secondary"
              >
                <Printer className="h-4 w-4" />
                Testar Principal
              </button>

              <button
                onClick={() =>
                  handleTestPrinter(
                    printerForm.kitchenPrinterName || printerForm.printerName,
                    '--- TESTE IMPRESSORA COZINHA ---',
                    true,
                  )
                }
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-secondary"
              >
                <ChefHat className="h-4 w-4" />
                Testar Cozinha
              </button>
            </div>
          )}
        </div>

        {printerConfig && (
          <div className="mt-4 bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-primary mb-1">
              ✅ Impressoras Configuradas
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Impressora principal:</strong>{' '}
              {printerConfig.printerName || 'Padrão do navegador'}
              <br />
              <strong>Impressora da cozinha:</strong>{' '}
              {printerConfig.kitchenPrinterName || 'Usando a impressora principal'}
              <br />
              <strong>Tipo:</strong> {PRINTER_TYPE_LABELS[printerConfig.printerType]}
              <br />
              <strong>Papel:</strong> {printerConfig.paperWidth}mm
              <br />
              <strong>Auto-imprimir:</strong>{' '}
              {printerConfig.autoPrint ? 'Sim' : 'Não'}
            </p>
          </div>
        )}
      </div>

      <div
        className="bg-card border border-border rounded-2xl p-5 mt-6 animate-scale-in"
        style={{ animationDelay: '260ms' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <HardDrive className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Backup & Restauração</h2>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          O backup automático é feito toda vez que o sistema inicia. Seus dados
          (cardápio, clientes, pedidos, vendas, configurações) são salvos
          automaticamente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.97] transition-all"
          >
            <Download className="h-4 w-4" />
            Exportar Backup
          </button>

          <button
            onClick={handleImportBackup}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary text-primary font-semibold text-sm active:scale-[0.97] transition-all hover:bg-primary/5"
          >
            <Upload className="h-4 w-4" />
            Restaurar Backup
          </button>
        </div>

        {isElectron && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Backups Automáticos</p>
              <button
                onClick={handleForceAutoBackup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold active:scale-95 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Fazer Backup Agora
              </button>
            </div>

            {autoBackups.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pos-scrollbar">
                {autoBackups.slice(0, 5).map((backup) => (
                  <div
                    key={backup.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {new Date(backup.date).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(backup.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestoreAutoBackup(backup.name)}
                      className="px-3 py-1.5 rounded-lg bg-pos-warning/10 text-pos-warning text-xs font-semibold active:scale-95 transition-all hover:bg-pos-warning/20"
                    >
                      Restaurar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3">
                Nenhum backup automático encontrado
              </p>
            )}

            {backupPath && (
              <div className="bg-secondary/30 rounded-lg p-3 mt-3">
                <p className="text-[10px] text-muted-foreground">
                  <strong>Pasta de backups:</strong> {backupPath}
                </p>
              </div>
            )}
          </>
        )}

        <div className="bg-pos-warning/10 border border-pos-warning/20 rounded-lg p-3 mt-4">
          <p className="text-xs text-pos-warning">
            <strong>⚠️ Importante:</strong> Ao atualizar o sistema, seus dados serão
            mantidos automaticamente. Se precisar reinstalar, use "Exportar Backup"
            antes e "Restaurar Backup" depois para recuperar tudo.
          </p>
        </div>
      </div>
    </div>
  );
}