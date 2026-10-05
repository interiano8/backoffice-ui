import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Database,
  XCircle,
  Search,
  Server,
  MapPin,
  Zap,
  Clock,
  CheckCircle2,
  Cloud,
  Layers,
  Cpu,
  Sliders,
  Fuel,
  Store,
  Lock,
  Key,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import api from '../infrastructure/api/api-client';
import { useAppStore } from '../store/useAppStore';
import { isAdmin, can } from '../services/auth.service';
import { FuelProduct, DEFAULT_FUEL_PRODUCTS } from '../lib/fuelProducts';

export interface PosConfigData {
  codigoPos?: string;
  pantallaEnBomba?: boolean;
  bloquearSoloPos?: boolean;
  mostrarVideoPublicidad?: boolean;
  reimprimirVarios?: boolean;
  facturarVariasLineas?: boolean;
  descuentoManual?: boolean;
  ocultarBotonOtrasBombas?: boolean;
  ocultarInformacionTurnos?: boolean;
  mostrarBombas?: boolean;
  numTransaccionesBombas?: number;
  minutosAtrasada?: number;
  mostrarTeclado?: boolean;
  declararMontosIniciales?: boolean;
}

interface StoreItem {
  id: string;
  code: string;
  name: string;
  titulo?: string;
  RTN?: string;
  address?: string;
  ip: string;
  dbPort?: number;
  dbName?: string;
  dbUser?: string;
  dbPassword?: string;
  dbSsl?: boolean;
  apiUrl?: string;
  lanUrl?: string;
  logoUrl?: string;
  isActive: boolean;
  healthStatus?: 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'ERROR';
  latencyMs?: number | null;
  lastSeenAt?: string | null;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
  lastSyncError?: string | null;
  moduleCustomers?: number;
  moduleAccounting?: number;
  printCreditInvoices?: boolean;
  SyncMinutes?: number;
  PresentationMinutes?: number;
  masterVersion?: number;
  pendingCount?: number;

  // Wayne Fusion / Hardware
  ipFusion?: string;
  urlControlador?: string;
  claveControlador?: string;
  esControladorGas?: boolean;

  // General parameters
  emisor?: string;
  moneda?: string;
  codigoMoneda?: string;
  telefono?: string;
  correo?: string;

  // Cliente Consumidor Final (configuración central de Casa Matriz 000)
  noConsumidorFinal?: string;
  validarSaldoCredito?: boolean;

  // POS configuration
  posConfig?: PosConfigData;
  configVersion?: number;
}

export const StoresPage: React.FC = () => {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null);
  const [syncingStore, setSyncingStore] = useState<string | null>(null);
  const [pingingStore, setPingingStore] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StoreItem | null>(null);

  const { getStores: refreshAppStores } = useAppStore();
  const canManageStores = isAdmin() || can('storesManage');

  const [activeTab, setActiveTab] = useState<'general' | 'wayne' | 'pos' | 'hoses' | 'db'>('general');
  const [showControllerKey, setShowControllerKey] = useState(false);
  const [showTpvKey, setShowTpvKey] = useState(false);
  const [storeHoses, setStoreHoses] = useState<any[]>([]);
  const [loadingHoses, setLoadingHoses] = useState<boolean>(false);

  // Hose modal state
  const [hoseModalOpen, setHoseModalOpen] = useState(false);
  const [editingHose, setEditingHose] = useState<any | null>(null);
  const [savingHose, setSavingHose] = useState(false);
  const [hoseForm, setHoseForm] = useState({
    pumpId: 1,
    hoseId: 1,
    gradeName: 'GASOLINA SUPERIOR',
    genericCode: 'SUPER',
    gradeId: 1,
    tankId: '1',
    unitOfMeasure: 'GL',
    active: true,
  });
  const [deleteHoseModalOpen, setDeleteHoseModalOpen] = useState(false);
  const [hoseToDelete, setHoseToDelete] = useState<any | null>(null);
  const [deletingHose, setDeletingHose] = useState(false);

  // Store Fuel Catalog State
  const [catalogProducts, setCatalogProducts] = useState<FuelProduct[]>(DEFAULT_FUEL_PRODUCTS);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('1');
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [editingCatalogProd, setEditingCatalogProd] = useState<FuelProduct | null>(null);
  const [catalogForm, setCatalogForm] = useState<FuelProduct>({
    id: '',
    gradeName: 'GASOLINA SUPERIOR',
    genericCode: 'SUPER',
    posCode: 'SUPER',
    tankId: '1',
    gradeId: 1,
  });

  const handleOpenAddCatalogProduct = () => {
    setEditingCatalogProd(null);
    setCatalogForm({
      id: String(Date.now()),
      gradeName: 'GASOLINA SUPERIOR',
      genericCode: 'SUPER',
      posCode: 'SUPER',
      tankId: String(catalogProducts.length + 1),
      gradeId: catalogProducts.length + 1,
    });
    setCatalogModalOpen(true);
  };

  const handleOpenEditCatalogProduct = (prod: FuelProduct) => {
    setEditingCatalogProd(prod);
    setCatalogForm({ ...prod });
    setCatalogModalOpen(true);
  };

  const handleSaveCatalogProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogForm.gradeName.trim() || !catalogForm.genericCode.trim()) {
      toast.error('Nombre de producto y Código POS son obligatorios');
      return;
    }
    const genericCode = catalogForm.genericCode.trim().toUpperCase();
    const formattedItem: FuelProduct = {
      ...catalogForm,
      gradeName: catalogForm.gradeName.trim().toUpperCase(),
      genericCode,
      posCode: genericCode,
      tankId: String(catalogForm.tankId || '').trim(),
      gradeId: Number(catalogForm.gradeId) || 1,
    };
    let updated: FuelProduct[];
    if (editingCatalogProd) {
      updated = catalogProducts.map((p) => (p.id === editingCatalogProd.id ? formattedItem : p));
    } else {
      updated = [...catalogProducts, { ...formattedItem, id: formattedItem.id || String(Date.now()) }];
    }
    setCatalogProducts(updated);
    setCatalogModalOpen(false);
    toast.success('Producto guardado en el catálogo');
  };

  const handleDeleteCatalogProduct = (id: string) => {
    if (catalogProducts.length <= 1) {
      toast.error('Debe mantener al menos 1 producto en el catálogo');
      return;
    }
    setCatalogProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success('Producto eliminado del catálogo');
  };

  const [form, setForm] = useState<Partial<StoreItem>>({
    code: '',
    name: '',
    titulo: '',
    RTN: '',
    address: '',
    ip: '127.0.0.1',
    apiUrl: 'http://127.0.0.1:5012/api',
    dbPort: 5432,
    dbName: 'prisma',
    dbUser: 'postgres',
    dbPassword: '',
    dbSsl: false,
    isActive: true,
    SyncMinutes: 5,
    ipFusion: '192.168.10.51',
    urlControlador: 'http://localhost:5008',
    claveControlador: '',
    esControladorGas: false,
    emisor: '',
    moneda: 'HNL',
    codigoMoneda: 'HNL',
    telefono: '',
    correo: '',
    noConsumidorFinal: '',
    validarSaldoCredito: true,
    posConfig: {
      codigoPos: '01',
      mostrarBombas: true,
      numTransaccionesBombas: 400,
      minutosAtrasada: 60,
      mostrarTeclado: true,
      declararMontosIniciales: true,
      ocultarBotonOtrasBombas: false,
    },
  });

  const handleGenerateUuidKey = () => {
    const newUuid = crypto.randomUUID();
    setForm((prev) => ({ ...prev, dbPassword: newUuid }));
    setShowTpvKey(true);
    toast.success('Nueva Key UUID generada con éxito');
  };

  const handleCopyTpvKey = () => {
    if (!form.dbPassword) {
      toast.error('No hay ninguna clave para copiar');
      return;
    }
    navigator.clipboard.writeText(form.dbPassword);
    toast.success('Key copiada al portapapeles');
  };

  const hqStore = stores.find((s) => s.code === '000') || null;
  const isEditingHQ = editingStore?.code === '000' || form.code === '000';

  const loadStoreHoses = async (code: string) => {
    setLoadingHoses(true);
    try {
      const { data } = await api.get('/hoses', { headers: { 'x-store-code': code } });
      setStoreHoses(Array.isArray(data) ? data : []);
    } catch {
      setStoreHoses([]);
    } finally {
      setLoadingHoses(false);
    }
  };

  const handleOpenAddHose = () => {
    let nextPump = 1;
    let nextHose = 1;
    if (storeHoses.length > 0) {
      const maxPump = Math.max(...storeHoses.map((h: any) => Number(h.pumpId || h.pumpNumber || 1)));
      const hosesInMaxPump = storeHoses.filter((h: any) => Number(h.pumpId || h.pumpNumber) === maxPump);
      const maxHoseInPump = Math.max(...hosesInMaxPump.map((h: any) => Number(h.hoseId || h.hoseNumber || 1)));
      if (maxHoseInPump >= 4) {
        nextPump = maxPump + 1;
        nextHose = 1;
      } else {
        nextPump = maxPump;
        nextHose = maxHoseInPump + 1;
      }
    }
    const firstProd = catalogProducts[0] || DEFAULT_FUEL_PRODUCTS[0];
    setSelectedCatalogId(firstProd.id);
    setEditingHose(null);
    setHoseForm({
      pumpId: nextPump,
      hoseId: nextHose,
      gradeName: firstProd.gradeName,
      genericCode: firstProd.genericCode,
      gradeId: firstProd.gradeId,
      tankId: firstProd.tankId,
      unitOfMeasure: 'GL',
      active: true,
    });
    setHoseModalOpen(true);
  };

  const handleOpenEditHose = (hose: any) => {
    const matched = catalogProducts.find(
      (p) => p.genericCode === (hose.genericCode || hose.posCode) || p.gradeName === (hose.fuelGradeName || hose.productName || hose.gradeName),
    ) || catalogProducts[0] || DEFAULT_FUEL_PRODUCTS[0];
    setSelectedCatalogId(matched?.id || '');
    setEditingHose(hose);
    setHoseForm({
      pumpId: hose.pumpId ?? hose.pumpNumber ?? 1,
      hoseId: hose.hoseId ?? hose.hoseNumber ?? 1,
      gradeName: hose.fuelGradeName || hose.productName || hose.gradeName || matched.gradeName,
      genericCode: hose.genericCode || hose.posCode || matched.genericCode,
      gradeId: hose.gradeId || matched.gradeId,
      tankId: hose.tankId ? String(hose.tankId) : matched.tankId,
      unitOfMeasure: hose.unitOfMeasure || 'GL',
      active: hose.active ?? true,
    });
    setHoseModalOpen(true);
  };

  const handleSaveHoseForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const storeCode = form.code || editingStore?.code;
    if (!storeCode) {
      toast.error('Código de tienda no disponible');
      return;
    }
    const pumpId = parseInt(String(hoseForm.pumpId), 10);
    const hoseId = parseInt(String(hoseForm.hoseId), 10);
    if (isNaN(pumpId) || pumpId <= 0) {
      toast.error('El número de bomba debe ser mayor a 0');
      return;
    }
    if (isNaN(hoseId) || hoseId <= 0) {
      toast.error('El número de manguera debe ser mayor a 0');
      return;
    }
    if (!hoseForm.gradeName || !hoseForm.gradeName.trim()) {
      toast.error('El nombre del producto / combustible es obligatorio');
      return;
    }

    setSavingHose(true);
    try {
      const genericCode = (hoseForm.genericCode || 'SUPER').trim().toUpperCase();
      const payload: any = {
        storeCode,
        pumpId,
        hoseId,
        gradeName: hoseForm.gradeName.trim(),
        genericCode,
        posCode: genericCode,
        gradeId: Number(hoseForm.gradeId) || 1,
        tankId: hoseForm.tankId ? String(hoseForm.tankId).trim() : null,
        unitOfMeasure: hoseForm.unitOfMeasure || 'GL',
        active: Boolean(hoseForm.active),
      };

      if (editingHose?.id) {
        await api.patch(`/hoses/${editingHose.id}`, payload, {
          headers: { 'x-store-code': storeCode },
        });
        toast.success(`Manguera actualizada exitosamente`);
      } else {
        await api.post('/hoses', payload, {
          headers: { 'x-store-code': storeCode },
        });
        toast.success(`Bomba ${pumpId}, Manguera ${hoseId} agregada con éxito`);
      }
      setHoseModalOpen(false);
      await loadStoreHoses(storeCode);
    } catch (err: any) {
      toast.error('Error al guardar manguera: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingHose(false);
    }
  };

  const handleDeleteHose = async () => {
    if (!hoseToDelete?.id) return;
    setDeletingHose(true);
    const storeCode = form.code || editingStore?.code || hoseToDelete.storeCode;
    try {
      await api.delete(`/hoses/${hoseToDelete.id}`, {
        headers: { 'x-store-code': storeCode },
      });
      toast.success('Manguera eliminada correctamente');
      setDeleteHoseModalOpen(false);
      setHoseToDelete(null);
      if (storeCode) {
        await loadStoreHoses(storeCode);
      }
    } catch (err: any) {
      toast.error('Error al eliminar manguera: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingHose(false);
    }
  };

  const fetchStores = async () => {
    setLoading(true);
    try {
      const [storesRes, healthRes] = await Promise.allSettled([
        api.get('/stores'),
        api.get('/stores/health-status'),
      ]);

      const rawStores: StoreItem[] = storesRes.status === 'fulfilled' && Array.isArray(storesRes.value.data)
        ? storesRes.value.data
        : [];

      const healthMap = new Map<string, any>();
      if (healthRes.status === 'fulfilled' && Array.isArray(healthRes.value.data)) {
        healthRes.value.data.forEach((h: any) => healthMap.set(h.id, h));
      }

      const merged = rawStores.map((s) => {
        const h = healthMap.get(s.id);
        return h ? { ...s, ...h } : s;
      });

      setStores(merged);
    } catch (err: any) {
      toast.error('Error al cargar las tiendas: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
    const interval = setInterval(() => {
      fetchStores();
    }, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  const handleOpenAdd = async () => {
    setEditingStore(null);
    setForm({
      code: '',
      name: '',
      titulo: '',
      RTN: '',
      address: '',
      ip: '127.0.0.1',
      apiUrl: 'http://127.0.0.1:5012/api',
      dbPort: 5432,
      dbName: 'prisma',
      dbUser: 'postgres',
      dbPassword: '',
      dbSsl: false,
      isActive: true,
      SyncMinutes: 5,
      moduleCustomers: 1,
      moduleAccounting: 1,
      ipFusion: '192.168.10.51',
      urlControlador: 'http://localhost:5008',
      claveControlador: '',
      esControladorGas: false,
      emisor: '',
      moneda: 'HNL',
      codigoMoneda: 'HNL',
      telefono: '',
      correo: '',
      posConfig: {
        codigoPos: '01',
        mostrarBombas: true,
        numTransaccionesBombas: 400,
        minutosAtrasada: 60,
        mostrarTeclado: true,
        declararMontosIniciales: true,
        ocultarBotonOtrasBombas: false,
      },
    });
    // Pre-llenar los campos de la empresa desde la casa matriz (000)
    try {
      const { data } = await api.get('/stores');
      const hq = Array.isArray(data) ? data.find((s: any) => s.code === '000') : null;
      if (hq) {
        setForm((prev: any) => ({
          ...prev,
          titulo: hq.titulo || prev.titulo,
          RTN: hq.RTN || prev.RTN,
          address: hq.address || prev.address,
          emisor: hq.emisor || prev.emisor,
          moneda: hq.moneda || prev.moneda,
          codigoMoneda: hq.codigoMoneda || prev.codigoMoneda,
          telefono: hq.telefono || prev.telefono,
          correo: hq.correo || prev.correo,
          SyncMinutes: hq.SyncMinutes ?? prev.SyncMinutes,
          printCreditInvoices: hq.printCreditInvoices ?? prev.printCreditInvoices,
          moduleCustomers: hq.moduleCustomers ?? prev.moduleCustomers,
          moduleAccounting: hq.moduleAccounting ?? prev.moduleAccounting,
          logoUrl: hq.logoUrl || prev.logoUrl,
        }));
      }
    } catch {
      // sin HQ o error: se queda el form con defaults
    }
    setActiveTab('general');
    setShowControllerKey(false);
    setShowTpvKey(false);
    setStoreHoses([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (store: StoreItem) => {
    setEditingStore(store);
    setForm({
      ...store,
      moduleCustomers: store.moduleCustomers ?? 1,
      moduleAccounting: store.moduleAccounting ?? 1,
      ipFusion: store.ipFusion || '192.168.10.51',
      urlControlador: store.urlControlador || 'http://localhost:5008',
      claveControlador: store.claveControlador || '',
      esControladorGas: store.esControladorGas ?? false,
      emisor: store.emisor || '',
      telefono: store.telefono || '',
      correo: store.correo || '',
      moneda: store.moneda || 'HNL',
      codigoMoneda: store.codigoMoneda || 'HNL',
      noConsumidorFinal: store.noConsumidorFinal || '',
      validarSaldoCredito: store.validarSaldoCredito ?? true,
      apiUrl: store.apiUrl || 'http://127.0.0.1:5012/api',
      dbPort: store.dbPort || 5432,
      dbName: store.dbName || 'prisma',
      dbUser: store.dbUser || 'postgres',
      dbPassword: '',
      SyncMinutes: store.SyncMinutes || 5,
      posConfig: store.posConfig || {
        codigoPos: '01',
        mostrarBombas: true,
        numTransaccionesBombas: 400,
        minutosAtrasada: 60,
        mostrarTeclado: true,
        declararMontosIniciales: true,
        ocultarBotonOtrasBombas: false,
      },
    });
    setActiveTab('general');
    setShowControllerKey(false);
    setShowTpvKey(false);
    setModalOpen(true);
    if (store.code) {
      loadStoreHoses(store.code);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) {
      toast.error('El código y el nombre son obligatorios');
      return;
    }

    const payload: Partial<StoreItem> = { ...form };
    if (editingStore && (!payload.dbPassword || payload.dbPassword.trim() === '')) {
      delete payload.dbPassword;
    }

    // Si no es Casa Matriz, hereda automáticamente los datos fiscales de Casa Matriz
    if (form.code !== '000') {
      const hq = stores.find((s) => s.code === '000');
      if (hq) {
        payload.RTN = hq.RTN || payload.RTN;
        payload.emisor = hq.emisor || payload.emisor;
        payload.titulo = hq.titulo || payload.titulo;
        payload.moneda = hq.moneda || payload.moneda || 'HNL';
        payload.codigoMoneda = hq.codigoMoneda || payload.codigoMoneda || 'HNL';
        payload.noConsumidorFinal = hq.noConsumidorFinal || payload.noConsumidorFinal || '';
      }
    }

    try {
      if (editingStore) {
        await api.patch(`/stores/${editingStore.id}`, payload);
        toast.success(`Tienda "${form.name}" actualizada con éxito`);
      } else {
        await api.post('/stores', payload);
        toast.success(`Tienda "${form.name}" creada con éxito`);
      }
      setModalOpen(false);
      await fetchStores();
      await refreshAppStores();
    } catch (err: any) {
      toast.error('Error al guardar: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async () => {
    if (!storeToDelete) return;
    try {
      await api.delete(`/stores/${storeToDelete.id}`);
      toast.success(`Tienda "${storeToDelete.name}" eliminada`);
      setDeleteConfirmOpen(false);
      setStoreToDelete(null);
      await fetchStores();
      await refreshAppStores();
    } catch (err: any) {
      toast.error('Error al eliminar: ' + (err.response?.data?.message || err.message));
    }
  };


  const handlePing = async (store: StoreItem) => {
    setPingingStore(store.id);
    try {
      const res = await api.post(`/stores/${store.id}/ping`);
      if (res.data?.success) {
        toast.success(`Ping a ${store.name}: ${res.data.data?.latencyMs}ms (Online)`);
      } else {
        toast.error(`Ping a ${store.name} falló (Offline)`);
      }
      await fetchStores();
    } catch (err: any) {
      toast.error('Error al hacer ping: ' + (err.response?.data?.message || err.message));
    } finally {
      setPingingStore(null);
    }
  };

  const handleSyncStore = async (storeCode: string) => {
    setSyncingStore(storeCode);
    try {
      toast.info(`Iniciando sincronización ETL para tienda ${storeCode}...`);
      const res = await api.post(`/etl/sync/${storeCode}`);
      if (res.data?.success) {
        toast.success(`Sincronización completada para tienda ${storeCode}`);
      } else {
        toast.error('Error en sincronización: ' + (res.data?.error || 'Falló la sincronización'));
      }
      await fetchStores();
    } catch (err: any) {
      toast.error('Error al sincronizar: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncingStore(null);
    }
  };

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');

  const onlineStores = stores.filter((s) => s.healthStatus === 'ONLINE');
  const offlineStores = stores.filter((s) => s.healthStatus !== 'ONLINE' && s.healthStatus !== 'SYNCING');

  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.RTN && s.RTN.includes(search));

    if (!matchesSearch) return false;
    if (statusFilter === 'ONLINE') return s.healthStatus === 'ONLINE';
    if (statusFilter === 'OFFLINE') return s.healthStatus !== 'ONLINE';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="w-7 h-7 text-primary" />
              Configuración y Salud de Tiendas POS
            </h1>
            {!canManageStores && (
              <Badge variant="outline" className="text-xs text-muted-foreground border-border/60">
                Modo Consulta
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoreo en tiempo real de conectividad Cloudflare, latencia, catálogos maestros y sincronización de ventas.
          </p>
        </div>
        {canManageStores && (
          <Button onClick={handleOpenAdd} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Nueva Tienda
          </Button>
        )}
      </div>

      {/* Network Health KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Estaciones</p>
              <h3 className="text-2xl font-bold mt-1">{stores.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Red de distribución</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-border/60 cursor-pointer transition-colors ${statusFilter === 'ONLINE' ? 'ring-2 ring-emerald-500' : 'hover:border-emerald-500/50'}`}
          onClick={() => setStatusFilter(statusFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">En Línea (Cloud)</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-500">{onlineStores.length}</h3>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">Túnel sincronizado</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-border/60 cursor-pointer transition-colors ${statusFilter === 'OFFLINE' ? 'ring-2 ring-rose-500' : 'hover:border-rose-500/50'}`}
          onClick={() => setStatusFilter(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Desconectadas</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-500">{offlineStores.length}</h3>
              <p className="text-[11px] text-rose-600/80 mt-0.5">Operando Offline-First</p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Hub Central</p>
              <h3 className="text-sm font-bold mt-1 flex items-center gap-1.5 text-sky-500">
                <Cloud className="w-4 h-4" /> Store 000 Matriz
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Cloudflare Tunnel Activo</p>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tienda por código, nombre o RTN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <Button
              variant={statusFilter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('ALL')}
              className="text-xs h-8"
            >
              Todas ({stores.length})
            </Button>
            <Button
              variant={statusFilter === 'ONLINE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('ONLINE')}
              className="text-xs h-8 gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Online ({onlineStores.length})
            </Button>
            <Button
              variant={statusFilter === 'OFFLINE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('OFFLINE')}
              className="text-xs h-8 gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Offline ({offlineStores.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stores List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && stores.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <span>Cargando tiendas y estado de salud...</span>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No se encontraron tiendas registradas.
          </div>
        ) : (
          filteredStores.map((store) => {
            const isOnline = store.healthStatus === 'ONLINE';
            const isSyncing = store.healthStatus === 'SYNCING' || syncingStore === store.code;

            return (
              <Card
                key={store.id}
                className={`relative overflow-hidden transition-all ${
                  store.code === '000'
                    ? 'border-amber-500/60 bg-gradient-to-b from-amber-500/[0.04] to-transparent ring-1 ring-amber-500/30 shadow-sm'
                    : 'border-border/60 hover:shadow-lg'
                }`}
              >
                <div className={`h-1.5 w-full ${isSyncing ? 'bg-blue-500 animate-pulse' : isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs font-bold">
                          {store.code}
                        </Badge>
                        {store.code === '000' && (
                          <Badge className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30 font-semibold flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" /> Casa Matriz
                          </Badge>
                        )}
                        {(store.ip === 'cloudflared' || store.ip === 'tunnel' || !store.ip) && (
                          <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-500 border-sky-500/20 font-medium flex items-center gap-1">
                            <Cloud className="w-2.5 h-2.5" /> Tunnel
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] bg-muted/60 font-mono text-muted-foreground">
                          v{store.masterVersion || 1}
                        </Badge>
                        {store.moduleAccounting !== 0 ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-medium">
                            Contabilidad ON
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-muted/40 text-muted-foreground border-border font-medium">
                            Contabilidad OFF
                          </Badge>
                        )}
                        {isSyncing ? (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Sincronizando
                          </Badge>
                        ) : isOnline ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> En línea
                            {store.latencyMs !== undefined && store.latencyMs !== null && (
                              <span className="font-mono text-[10px] opacity-80 font-normal">({store.latencyMs}ms)</span>
                            )}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-200" /> Desconectada
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg font-bold mt-2">{store.name}</CardTitle>
                      {store.titulo && (
                        <CardDescription className="text-xs">{store.titulo}</CardDescription>
                      )}
                    </div>
                    {store.logoUrl && (
                      <img src={store.logoUrl} alt={store.name} className="w-12 h-12 object-contain p-1 rounded-lg border bg-muted/20" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-sm pb-4">
                  {store.RTN && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">RTN:</span> {store.RTN}
                    </div>
                  )}
                  {store.address && (
                    <div className="text-xs text-muted-foreground flex items-start gap-1.5 line-clamp-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                      <span>{store.address}</span>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {store.ip === 'cloudflared' || store.ip === 'tunnel' || !store.ip ? (
                          <>
                            <Cloud className="w-3.5 h-3.5 text-sky-500" />
                            <span>Cloudflare Tunnel</span>
                          </>
                        ) : (
                          <>
                            <Server className="w-3.5 h-3.5 text-primary" />
                            <span>{store.ip}:{store.dbPort || 5432}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Database className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{store.dbName || 'prisma'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/20 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary/70" />
                        Sync: {store.SyncMinutes || 5} min
                      </span>
                      <span>
                        {store.lastSyncAt
                          ? `Sinc: ${new Date(store.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Sin sincronizar'}
                      </span>
                    </div>

                    {store.lastSeenAt && (
                      <div className="flex items-center justify-between pt-1 border-t border-border/10 text-[10px] text-muted-foreground">
                        <span>Último contacto:</span>
                        <span>{new Date(store.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncStore(store.code)}
                        disabled={syncingStore === store.code}
                        className="gap-1.5 text-xs h-8"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingStore === store.code ? 'animate-spin' : ''}`} />
                        Sincronizar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePing(store)}
                        disabled={!canManageStores || pingingStore === store.id}
                        className="gap-1 text-xs h-8 text-muted-foreground hover:text-foreground px-2"
                        title={canManageStores ? "Probar latencia" : "Requiere rol administrativo"}
                      >
                        <Zap className={`w-3.5 h-3.5 ${pingingStore === store.id ? 'animate-pulse text-amber-500' : 'text-primary'}`} />
                        Ping
                      </Button>
                    </div>

                    {canManageStores && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(store)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Editar tienda"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {store.code !== '000' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setStoreToDelete(store);
                              setDeleteConfirmOpen(true);
                            }}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Eliminar tienda"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add / Edit Store Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isEditingHQ ? (
                  <>
                    <Building2 className="w-5 h-5 text-amber-500" />
                    <span>Configuración de Casa Matriz (000)</span>
                    <Badge className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30 font-semibold">
                      Casa Matriz
                    </Badge>
                  </>
                ) : (
                  <>
                    <Store className="w-5 h-5 text-primary" />
                    <span>{editingStore ? 'Editar Tienda' : 'Nueva Tienda POS'}</span>
                    {editingStore && (
                      <span className="text-muted-foreground text-sm font-normal">
                        ({editingStore.name} - {editingStore.code})
                      </span>
                    )}
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {isEditingHQ
                  ? 'Configuración central de la empresa. Los datos fiscales y comerciales definidos aquí se heredan a todas las tiendas de la red.'
                  : 'Aprovisionamiento y configuración operativa de la sucursal. Los datos fiscales de la empresa son heredados de Casa Matriz (000).'}
              </DialogDescription>
            </DialogHeader>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border/60 gap-1.5 overflow-x-auto pb-2 pt-3">
              <Button
                type="button"
                variant={activeTab === 'general' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 text-xs h-8 shrink-0"
                onClick={() => setActiveTab('general')}
              >
                <Building2 className="w-3.5 h-3.5" />
                General
              </Button>
              <Button
                type="button"
                variant={activeTab === 'wayne' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 text-xs h-8 shrink-0"
                onClick={() => setActiveTab('wayne')}
              >
                <Cpu className="w-3.5 h-3.5" />
                Controlador
              </Button>
              <Button
                type="button"
                variant={activeTab === 'pos' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 text-xs h-8 shrink-0"
                onClick={() => setActiveTab('pos')}
              >
                <Sliders className="w-3.5 h-3.5" />
                Configuración POS
              </Button>
              <Button
                type="button"
                variant={activeTab === 'hoses' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 text-xs h-8 shrink-0"
                onClick={() => {
                  setActiveTab('hoses');
                  if (form.code) loadStoreHoses(form.code);
                }}
              >
                <Fuel className="w-3.5 h-3.5" />
                Mangueras
              </Button>
              <Button
                type="button"
                variant={activeTab === 'db' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 text-xs h-8 shrink-0"
                onClick={() => setActiveTab('db')}
              >
                <Server className="w-3.5 h-3.5" />
                Conexión TPV
              </Button>
            </div>

            {/* TAB: GENERAL */}
            {activeTab === 'general' && (
              isEditingHQ ? (
                /* ================= VISTA CASA MATRIZ (000) ================= */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="col-span-full p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 space-y-0.5">
                      <div className="font-semibold text-amber-900">Configuración Central de Casa Matriz (000)</div>
                      <div>
                        Aquí se definen la razón social, RTN, título comercial y moneda base de la empresa.
                        Todas las tiendas y sucursales heredan automáticamente esta información para su facturación fiscal y reportes.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="code" className="text-xs font-medium">Código de Matriz</Label>
                    <Input
                      id="code"
                      value="000"
                      disabled
                      className="bg-muted font-mono font-bold"
                    />
                    <p className="text-[11px] text-muted-foreground">Identificador maestro asignado a la Casa Matriz.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-medium">Nombre de la Casa Matriz *</Label>
                    <Input
                      id="name"
                      placeholder="Ej. Casa Matriz Inversiones Shell"
                      value={form.name || ''}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-span-full mt-2 border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                        ◆ Datos Fiscales Corporativos (Heredados a todas las tiendas)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rtn" className="text-xs font-medium">RTN de la Empresa *</Label>
                    <Input
                      id="rtn"
                      placeholder="Ej. 06019995197170"
                      value={form.RTN || ''}
                      onChange={(e) => setForm({ ...form, RTN: e.target.value })}
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">Registro Tributario Nacional de la empresa emisora.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="emisor" className="text-xs font-medium">Razón Social / Emisor Legal *</Label>
                    <Input
                      id="emisor"
                      placeholder="Ej. INVERSIONES EL RECREO S.A. DE C.V."
                      value={form.emisor || ''}
                      onChange={(e) => setForm({ ...form, emisor: e.target.value })}
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">Nombre legal en los comprobantes fiscales SAR.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="titulo" className="text-xs font-medium">Título Comercial de la Red</Label>
                    <Input
                      id="titulo"
                      placeholder="Ej. Gasolineras Shell"
                      value={form.titulo || ''}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    />
                    <p className="text-[11px] text-muted-foreground">Nombre de marca comercial visible.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="moneda" className="text-xs font-medium">Moneda Base de Facturación</Label>
                    <Input
                      id="moneda"
                      placeholder="HNL"
                      value={form.moneda || 'HNL'}
                      onChange={(e) => setForm({ ...form, moneda: e.target.value, codigoMoneda: e.target.value })}
                    />
                    <p className="text-[11px] text-muted-foreground">Moneda oficial del sistema (ej. HNL, USD).</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="telefono" className="text-xs font-medium">Teléfono Corporativo / PBX</Label>
                    <Input
                      id="telefono"
                      placeholder="Ej. +504 2234-5678"
                      value={form.telefono || ''}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="correo" className="text-xs font-medium">Correo Electrónico Corporativo</Label>
                    <Input
                      id="correo"
                      type="email"
                      placeholder="Ej. administracion@empresa.com"
                      value={form.correo || ''}
                      onChange={(e) => setForm({ ...form, correo: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="noConsumidorFinal" className="text-xs font-medium">Código de Consumidor Final (Heredado)</Label>
                    <Input
                      id="noConsumidorFinal"
                      placeholder="Ej. CCO-000-000001"
                      value={form.noConsumidorFinal || ''}
                      onChange={(e) => setForm({ ...form, noConsumidorFinal: e.target.value })}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Código del cliente de contado que actúa como "Consumidor Final". Se configura una sola vez aquí (Casa Matriz) y se propaga a todas las tiendas tras sincronizar.
                    </p>
                  </div>

                  <div className="col-span-full space-y-1.5">
                    <Label htmlFor="address" className="text-xs font-medium">Dirección Fiscal Corporativa</Label>
                    <Input
                      id="address"
                      placeholder="Ej. Tegucigalpa M.D.C., Honduras"
                      value={form.address || ''}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>

                  <div className="col-span-full flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Estado de Casa Matriz</div>
                      <div className="text-xs text-muted-foreground">Habilitar Casa Matriz en el ecosistema</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.isActive ?? true}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary"
                    />
                  </div>

                  <div className="col-span-full mt-2 border-t pt-3">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">◇ Módulos Habilitados en Backoffice</span>
                    </div>
                  </div>

                  <div className="col-span-full flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-foreground">Módulo de Contabilidad General</div>
                      <div className="text-xs text-muted-foreground">Habilitar contabilidad, libro diario y reportes financieros</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.moduleAccounting !== 0}
                      onChange={(e) => setForm({ ...form, moduleAccounting: e.target.checked ? 1 : 0 })}
                      className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary"
                    />
                  </div>

                  <div className="col-span-full flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-foreground">Módulo de Clientes & Créditos (CxC)</div>
                      <div className="text-xs text-muted-foreground">Habilitar clientes a crédito y estados de cuenta</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.moduleCustomers !== 0}
                      onChange={(e) => setForm({ ...form, moduleCustomers: e.target.checked ? 1 : 0 })}
                      className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary"
                    />
                  </div>
                </div>
              ) : (
                /* ================= VISTA TIENDA / SUCURSAL ================= */
                <div className="space-y-6 py-4">
                  {/* SECCIÓN 1: DATOS PROPIOS DE LA SUCURSAL */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          1. Información Propia de la Tienda / Sucursal
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Configuración local de la estación
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="code" className="text-xs font-medium">Código de Tienda (STORE_CODE) *</Label>
                        <Input
                          id="code"
                          placeholder="Ej. 001"
                          value={form.code}
                          disabled={!!editingStore}
                          onChange={(e) => setForm({ ...form, code: e.target.value.trim() })}
                          required
                          className="font-mono font-bold"
                        />
                        <p className="text-[11px] text-muted-foreground">Identificador único asignado al POS (ej. 001, 002).</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-medium">Nombre de la Sucursal / Estación *</Label>
                        <Input
                          id="name"
                          placeholder="Ej. ESTACIÓN EL RECREO"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                        <p className="text-[11px] text-muted-foreground">Nombre descriptivo de esta estación.</p>
                      </div>

                      <div className="col-span-full space-y-1.5">
                        <Label htmlFor="address" className="text-xs font-medium">Dirección Física de la Pista / Estación</Label>
                        <Input
                          id="address"
                          placeholder="Ej. Barrio El Recreo, Boulevard del Norte, Tegucigalpa"
                          value={form.address || ''}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                        />
                        <p className="text-[11px] text-muted-foreground">Ubicación física local de la pista o tienda.</p>
                      </div>

                      <div className="col-span-full flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">Estado Operativo de la Estación</div>
                          <div className="text-xs text-muted-foreground">Habilitar o suspender operaciones de esta estación</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.isActive ?? true}
                          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                          className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary"
                        />
                      </div>

                      <div className="col-span-full flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-foreground">Módulo de Contabilidad General</div>
                          <div className="text-xs text-muted-foreground">Habilitar partidas automáticas y estados financieros para esta estación</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.moduleAccounting !== 0}
                          onChange={(e) => setForm({ ...form, moduleAccounting: e.target.checked ? 1 : 0 })}
                          className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary"
                        />
                      </div>

                      <div className="col-span-full flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-foreground">Módulo de Clientes & Créditos (CxC)</div>
                          <div className="text-xs text-muted-foreground">Habilitar despacho y facturación a crédito en esta estación</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.moduleCustomers !== 0}
                          onChange={(e) => setForm({ ...form, moduleCustomers: e.target.checked ? 1 : 0 })}
                          className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary"
                        />
                      </div>

                      <div className="col-span-full flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-foreground">Validar Saldo de Crédito</div>
                          <div className="text-xs text-muted-foreground">Validar crédito disponible y bloqueo por morosidad al facturar a crédito</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.validarSaldoCredito ?? true}
                          onChange={(e) => setForm({ ...form, validarSaldoCredito: e.target.checked })}
                          className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 2: INFORMACIÓN DE LA EMPRESA (HEREDADA DE CASA MATRIZ 000 - NO EDITABLE) */}
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                          2. Datos de la Empresa (Heredados de Casa Matriz 000)
                        </span>
                      </div>
                      <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px] font-medium flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Solo Lectura / Heredado
                      </Badge>
                    </div>

                    <p className="text-[11px] text-amber-800/80">
                      Esta tienda hereda automáticamente la información fiscal y corporativa definida en la <strong>Casa Matriz ({hqStore?.name || '000'})</strong>.
                      Estos valores se aplican a todas las facturas y comprobantes emitidos. Para modificarlos, edite la Casa Matriz (000).
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                      <div className="p-2.5 bg-background/90 rounded-lg border border-amber-500/20">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Razón Social / Emisor Legal</span>
                        <span className="text-xs font-semibold text-foreground truncate block mt-0.5" title={hqStore?.emisor || hqStore?.name}>
                          {hqStore?.emisor || hqStore?.name || 'No configurado en Matriz'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-background/90 rounded-lg border border-amber-500/20">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">RTN de la Empresa</span>
                        <span className="text-xs font-mono font-bold text-foreground block mt-0.5">
                          {hqStore?.RTN || 'No configurado en Matriz'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-background/90 rounded-lg border border-amber-500/20">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Título Comercial</span>
                        <span className="text-xs font-medium text-foreground truncate block mt-0.5">
                          {hqStore?.titulo || hqStore?.name || '-'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-background/90 rounded-lg border border-amber-500/20">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Moneda Base</span>
                        <span className="text-xs font-mono font-bold text-foreground block mt-0.5">
                          {hqStore?.moneda || 'HNL'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-background/90 rounded-lg border border-amber-500/20">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Teléfono Corporativo</span>
                        <span className="text-xs font-medium text-foreground truncate block mt-0.5">
                          {hqStore?.telefono || 'No configurado en Matriz'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-background/90 rounded-lg border border-amber-500/20">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Correo Corporativo</span>
                        <span className="text-xs font-medium text-foreground truncate block mt-0.5">
                          {hqStore?.correo || 'No configurado en Matriz'}
                        </span>
                      </div>

                      <div className="sm:col-span-3 p-2.5 bg-background/90 rounded-lg border border-amber-500/20">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Dirección Fiscal Corporativa</span>
                        <span className="text-xs text-muted-foreground truncate block mt-0.5">
                          {hqStore?.address || 'No configurada en Matriz'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* TAB: CONTROLADOR */}
            {activeTab === 'wayne' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="col-span-full text-xs text-muted-foreground bg-primary/5 p-3.5 rounded-lg border border-primary/20 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-primary" />
                    Microservicio Controlador de Bombas
                  </div>
                  <div>
                    Parámetros de comunicación con el driver o microservicio controlador de pista (ej. Wayne Fusion).
                    La terminal POS utilizará estos datos para enviar autorizaciones y recibir despachos de combustible.
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="urlControlador" className="text-xs font-medium">URL del Controlador *</Label>
                  <Input
                    id="urlControlador"
                    placeholder="http://localhost:5008"
                    value={form.urlControlador || ''}
                    onChange={(e) => setForm({ ...form, urlControlador: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">URL base del microservicio puente de comunicación con las bombas.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="claveControlador" className="text-xs font-medium">Clave / Token del Controlador</Label>
                  <div className="relative">
                    <Input
                      id="claveControlador"
                      type={showControllerKey ? 'text' : 'password'}
                      placeholder="Token o Clave Secreta"
                      value={form.claveControlador || ''}
                      onChange={(e) => setForm({ ...form, claveControlador: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowControllerKey(!showControllerKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      title={showControllerKey ? 'Ocultar clave' : 'Mostrar clave'}
                    >
                      {showControllerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Clave de autenticación para enviar comandos directos al controlador.</p>
                </div>
              </div>
            )}

            {/* TAB: POS CONFIGURATION */}
            {activeTab === 'pos' && (
              <div className="space-y-4 py-4">
                <div className="col-span-full text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
                  Configuración operativa de la pantalla y terminal POS. Se sincroniza con la tabla <span className="font-mono text-primary">configuracion_pos</span> de la estación.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="codigoPos" className="text-xs font-medium">Código POS</Label>
                    <Input
                      id="codigoPos"
                      placeholder="01"
                      value={form.posConfig?.codigoPos || '01'}
                      onChange={(e) => setForm({
                        ...form,
                        posConfig: { ...form.posConfig, codigoPos: e.target.value } as PosConfigData
                      })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="numTransaccionesBombas" className="text-xs font-medium">Límite Despachos en Memoria</Label>
                    <Input
                      id="numTransaccionesBombas"
                      type="number"
                      placeholder="400"
                      value={form.posConfig?.numTransaccionesBombas ?? 400}
                      onChange={(e) => setForm({
                        ...form,
                        posConfig: { ...form.posConfig, numTransaccionesBombas: parseInt(e.target.value, 10) || 400 } as PosConfigData
                      })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="minutosAtrasada" className="text-xs font-medium">Tolerancia Atrasada (minutos)</Label>
                    <Input
                      id="minutosAtrasada"
                      type="number"
                      placeholder="60"
                      value={form.posConfig?.minutosAtrasada ?? 60}
                      onChange={(e) => setForm({
                        ...form,
                        posConfig: { ...form.posConfig, minutosAtrasada: parseInt(e.target.value, 10) || 60 } as PosConfigData
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { key: 'mostrarBombas', label: 'Mostrar Bombas en Pantalla', desc: 'Visualiza el panel de dispensadores y mangueras en el POS' },
                    { key: 'mostrarTeclado', label: 'Teclado Táctil en Pantalla', desc: 'Despliega el teclado en pantalla para terminales táctiles' },
                    { key: 'declararMontosIniciales', label: 'Declarar Fondos Iniciales', desc: 'Exige ingreso de fondo de caja al abrir turno' },
                    { key: 'ocultarBotonOtrasBombas', label: 'Ocultar Botón Otras Bombas', desc: 'Oculta dispensadores ajenos al turno asignado' },
                  ].map((toggle) => (
                    <label
                      key={toggle.key}
                      className="flex items-start justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 cursor-pointer gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold">{toggle.label}</div>
                        <div className="text-[11px] text-muted-foreground">{toggle.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean((form.posConfig as any)?.[toggle.key])}
                        onChange={(e) => setForm({
                          ...form,
                          posConfig: {
                            ...form.posConfig,
                            [toggle.key]: e.target.checked,
                          } as PosConfigData
                        })}
                        className="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary accent-primary"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: HOSES */}
            {activeTab === 'hoses' && (
              <div className="space-y-4 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold">Mangueras</h4>
                    <p className="text-xs text-muted-foreground">
                      Bombas, mangueras y combustibles asignados a {form.name || form.code}. Los cambios se reflejan inmediatamente en la pista.
                    </p>
                  </div>
                  {form.code && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleOpenAddHose}
                        className="gap-1.5 text-xs h-8"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Manguera
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => loadStoreHoses(form.code!)}
                        disabled={loadingHoses}
                        className="gap-1.5 text-xs h-8"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingHoses ? 'animate-spin' : ''}`} />
                        Actualizar
                      </Button>
                    </div>
                  )}
                </div>

                {/* CATÁLOGO DE PRODUCTOS DE LA ESTACIÓN */}
                {editingStore && (
                  <Card className="border border-border/60 bg-card shadow-sm mb-4">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
                      <div>
                        <CardTitle className="text-xs font-bold flex items-center gap-2">
                          <Fuel className="w-4 h-4 text-primary" />
                          Catálogo de Productos de Combustible
                        </CardTitle>
                        <CardDescription className="text-[11px]">
                          Productos definidos para esta estación. Se seleccionan directamente al registrar bombas y mangueras.
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleOpenAddCatalogProduct}
                        className="gap-1 text-xs h-7"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Producto
                      </Button>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {catalogProducts.map((prod) => (
                          <div key={prod.id} className="p-2.5 rounded-md border bg-muted/20 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                {prod.gradeName}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                POS: <span className="font-bold text-foreground">{prod.genericCode}</span> | Tanque: {prod.tankId ? `T-${prod.tankId}` : '-'}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => handleOpenEditCatalogProduct(prod)}
                                title="Editar producto del catálogo"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteCatalogProduct(prod.id)}
                                title="Eliminar producto del catálogo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!editingStore ? (
                  <div className="p-8 text-center border rounded-lg bg-muted/20 text-muted-foreground text-xs">
                    Guarde la tienda primero para poder consultar y configurar sus mangueras.
                  </div>
                ) : loadingHoses ? (
                  <div className="p-8 text-center flex flex-col items-center gap-2 text-muted-foreground text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    <span>Cargando mangueras de la estación...</span>
                  </div>
                ) : storeHoses.length === 0 ? (
                  <div className="p-8 text-center border rounded-lg bg-muted/20 text-muted-foreground text-xs flex flex-col items-center gap-3">
                    <Fuel className="w-8 h-8 opacity-40 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">No se encontraron mangueras registradas para esta estación.</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">Comience agregando los dispensadores y mangueras de la pista.</p>
                    </div>
                    {form.code && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleOpenAddHose}
                        className="gap-1.5 text-xs mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Manguera
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="py-2.5 px-3 text-left font-semibold">Bomba</th>
                          <th className="py-2.5 px-3 text-left font-semibold">Manguera</th>
                          <th className="py-2.5 px-3 text-left font-semibold">Combustible / Producto</th>
                          <th className="py-2.5 px-3 text-left font-semibold">Código POS</th>
                          <th className="py-2.5 px-3 text-left font-semibold">Tanque</th>
                          <th className="py-2.5 px-3 text-center font-semibold">Unidad</th>
                          <th className="py-2.5 px-3 text-center font-semibold">Estado</th>
                          <th className="py-2.5 px-3 text-center font-semibold w-24">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {storeHoses.map((h: any) => (
                          <tr key={h.id} className="hover:bg-muted/20">
                            <td className="py-2.5 px-3 font-mono font-medium">Bomba {h.pumpNumber ?? h.pumpId}</td>
                            <td className="py-2.5 px-3 font-mono">#{h.hoseNumber ?? h.hoseId}</td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1.5 font-medium">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  (h.fuelGradeName || h.productName || '').includes('SUPERIOR')
                                    ? 'bg-rose-500'
                                    : (h.fuelGradeName || h.productName || '').includes('REGULAR')
                                    ? 'bg-amber-500'
                                    : (h.fuelGradeName || h.productName || '').includes('DIESEL')
                                    ? 'bg-emerald-500'
                                    : 'bg-primary'
                                }`} />
                                {h.fuelGradeName || h.productName || 'Combustible'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono px-2 py-0.5 rounded bg-muted/60 text-foreground font-semibold text-[11px]">
                                {h.genericCode || h.posCode || '-'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{h.tankId ? `T-${h.tankId}` : '-'}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                {h.unitOfMeasure || 'GL'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${
                                h.active !== false
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                  : 'bg-muted text-muted-foreground border border-border'
                              }`}>
                                {h.active !== false ? 'Activa' : 'Inactiva'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                                  onClick={() => handleOpenEditHose(h)}
                                  title="Editar manguera"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    setHoseToDelete(h);
                                    setDeleteHoseModalOpen(true);
                                  }}
                                  title="Eliminar manguera"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: TPV CONNECTION (100% CLOUD HTTPS SYNC) */}
            {activeTab === 'db' && (
              <div className="space-y-4 py-4">
                <div className="text-xs text-muted-foreground bg-primary/5 p-3.5 rounded-lg border border-primary/20 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-primary" />
                    Conexión Cloud & Sincronización TPV
                  </div>
                  <div>
                    En la arquitectura Cloud, la base de datos local del TPV se mantiene aislada y segura. Configura aquí la URL del servicio HTTP local/túnel del TPV y la clave UUID de autenticación para la sincronización automática.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Endpoint Backend TPV */}
                  <div className="col-span-full space-y-1.5">
                    <Label htmlFor="apiUrl" className="text-xs font-medium">Endpoint / URL del Backend TPV (Cloud / Túnel) *</Label>
                    <Input
                      id="apiUrl"
                      placeholder="Ej. https://tpv-estacion01.mitunel.com/api o http://192.168.1.50:5012/api"
                      value={form.apiUrl || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          apiUrl: val,
                          ip: val ? (val.startsWith('http') ? 'cloudflared' : val) : 'cloudflared',
                        });
                      }}
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Dirección URL pública o túnel Cloudflare donde responde la API backend del TPV.
                    </p>
                  </div>

                  {/* Key UUID de Seguridad */}
                  <div className="col-span-full space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dbPassword" className="text-xs font-medium flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-500" />
                        Key de Seguridad del TPV (UUID)
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateUuidKey}
                        className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10"
                      >
                        <Zap className="w-3 h-3 text-amber-500" />
                        Generar Key UUID
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="dbPassword"
                          type={showTpvKey ? 'text' : 'password'}
                          placeholder={editingStore ? '•••••••••••••••• (Conservar actual o generar nueva)' : 'Haga clic en Generar Key UUID o ingrese una clave'}
                          value={form.dbPassword || ''}
                          onChange={(e) => setForm({ ...form, dbPassword: e.target.value })}
                          className="font-mono text-xs pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTpvKey(!showTpvKey)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          title={showTpvKey ? 'Ocultar' : 'Mostrar'}
                        >
                          {showTpvKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyTpvKey}
                        className="h-9 px-3 text-xs gap-1.5 shrink-0"
                        title="Copiar Key al portapapeles"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Token criptográfico UUID para identificar y autenticar el intercambio de datos entre este TPV y el servidor central.
                    </p>
                  </div>

                  {/* Intervalo Auto-Sync */}
                  <div className="col-span-full md:col-span-1 space-y-1.5">
                    <Label htmlFor="syncMinutes" className="text-xs font-medium">Intervalo de Sincronización (minutos)</Label>
                    <Input
                      id="syncMinutes"
                      type="number"
                      min="1"
                      max="1440"
                      placeholder="5"
                      value={form.SyncMinutes || 5}
                      onChange={(e) => setForm({ ...form, SyncMinutes: parseInt(e.target.value, 10) || 5 })}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Frecuencia automática con la que el TPV envía ventas y estado al Backoffice.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingStore ? 'Guardar Cambios' : 'Crear Tienda'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Eliminar Tienda
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la tienda "{storeToDelete?.name}" ({storeToDelete?.code})?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hose Edit / Add Dialog */}
      <Dialog open={hoseModalOpen} onOpenChange={setHoseModalOpen}>
        <DialogContent className="sm:max-w-lg z-[70]">
          <form onSubmit={handleSaveHoseForm}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-primary" />
                {editingHose ? 'Editar Bomba / Manguera' : 'Agregar Bomba y Manguera'}
              </DialogTitle>
              <DialogDescription>
                {editingHose
                  ? 'Modifica los parámetros del dispensador, manguera o combustible asignado.'
                  : 'Registra un dispensador / manguera con su combustible asociado para esta estación.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="pumpId" className="text-xs font-medium">Bomba / Dispensador # *</Label>
                <Input
                  id="pumpId"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={hoseForm.pumpId}
                  onChange={(e) => setHoseForm({ ...hoseForm, pumpId: parseInt(e.target.value, 10) || 1 })}
                  required
                />
                <p className="text-[11px] text-muted-foreground">Número de bomba (1, 2, 3...)</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hoseId" className="text-xs font-medium">Manguera # *</Label>
                <Input
                  id="hoseId"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={hoseForm.hoseId}
                  onChange={(e) => setHoseForm({ ...hoseForm, hoseId: parseInt(e.target.value, 10) || 1 })}
                  required
                />
                <p className="text-[11px] text-muted-foreground">Posición de la manguera</p>
              </div>

              <div className="col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="h-selectCatalog" className="text-xs font-medium">Producto / Combustible Asignado *</Label>
                  <span className="text-[10px] text-muted-foreground font-mono">Seleccionado del catálogo</span>
                </div>
                <select
                  id="h-selectCatalog"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={selectedCatalogId}
                  onChange={(e) => {
                    const prod = catalogProducts.find((p) => p.id === e.target.value);
                    if (prod) {
                      setSelectedCatalogId(prod.id);
                      setHoseForm({
                        ...hoseForm,
                        gradeName: prod.gradeName,
                        genericCode: prod.genericCode,
                        gradeId: prod.gradeId,
                        tankId: prod.tankId,
                      });
                    }
                  }}
                >
                  {catalogProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.gradeName} — ({p.genericCode} | Tanque {p.tankId ? `T-${p.tankId}` : '-'})
                    </option>
                  ))}
                </select>

                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs flex flex-col gap-1 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{hoseForm.gradeName}</span>
                    <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">
                      POS: {hoseForm.genericCode}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex gap-3 font-mono pt-0.5">
                    <span>Tanque: <strong className="text-foreground">{hoseForm.tankId ? `T-${hoseForm.tankId}` : '-'}</strong></span>
                    <span>Grado #: <strong className="text-foreground">{hoseForm.gradeId}</strong></span>
                  </div>
                </div>
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="h-unitOfMeasure" className="text-xs font-medium">Unidad de Medida *</Label>
                <select
                  id="h-unitOfMeasure"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={hoseForm.unitOfMeasure || 'GL'}
                  onChange={(e) => setHoseForm({ ...hoseForm, unitOfMeasure: e.target.value })}
                >
                  <option value="GL">Galones (GL)</option>
                  <option value="LT">Litros (LT)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">Unidad de volumen despachado por el surtidor</p>
              </div>

              <div className="col-span-2 flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold">Manguera Habilitada / Activa</div>
                  <div className="text-[11px] text-muted-foreground">Habilitar despacho en pista y controlador POS</div>
                </div>
                <input
                  type="checkbox"
                  checked={hoseForm.active}
                  onChange={(e) => setHoseForm({ ...hoseForm, active: e.target.checked })}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setHoseModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingHose}>
                {savingHose ? 'Guardando...' : editingHose ? 'Guardar Cambios' : 'Agregar Manguera'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Hose Confirmation Dialog */}
      <Dialog open={deleteHoseModalOpen} onOpenChange={setDeleteHoseModalOpen}>
        <DialogContent className="sm:max-w-md z-[70]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Eliminar Manguera
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la Manguera #{hoseToDelete?.hoseNumber ?? hoseToDelete?.hoseId} de la Bomba {hoseToDelete?.pumpNumber ?? hoseToDelete?.pumpId} ({hoseToDelete?.fuelGradeName || hoseToDelete?.productName || hoseToDelete?.gradeName})?
              Esta acción eliminará la manguera y su precio configurado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteHoseModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteHose} disabled={deletingHose}>
              {deletingHose ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Catalog Product Dialog */}
      <Dialog open={catalogModalOpen} onOpenChange={setCatalogModalOpen}>
        <DialogContent className="sm:max-w-md z-[75]">
          <form onSubmit={handleSaveCatalogProduct}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-primary" />
                {editingCatalogProd ? 'Editar Producto del Catálogo' : 'Agregar Producto al Catálogo'}
              </DialogTitle>
              <DialogDescription>
                Configure la descripción, código en el catálogo del POS y número de tanque para este combustible.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-gradeName" className="text-xs font-medium">Descripción del Producto / Combustible *</Label>
                <Input
                  id="cat-gradeName"
                  placeholder="Ej. GASOLINA SUPERIOR 95"
                  value={catalogForm.gradeName}
                  onChange={(e) => setCatalogForm({ ...catalogForm, gradeName: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-genericCode" className="text-xs font-medium">Código POS *</Label>
                  <Input
                    id="cat-genericCode"
                    placeholder="Ej. SUPER"
                    value={catalogForm.genericCode}
                    onChange={(e) => setCatalogForm({ ...catalogForm, genericCode: e.target.value.toUpperCase().trim() })}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">Código en catálogo POS</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cat-tankId" className="text-xs font-medium">Tanque Asociado *</Label>
                  <Input
                    id="cat-tankId"
                    placeholder="Ej. 1"
                    value={catalogForm.tankId}
                    onChange={(e) => setCatalogForm({ ...catalogForm, tankId: e.target.value })}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">ID Tanque (1, 2, 3...)</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-gradeId" className="text-xs font-medium">Número de Grado (Controlador Fusion)</Label>
                <Input
                  id="cat-gradeId"
                  type="number"
                  min="1"
                  max="10"
                  value={catalogForm.gradeId}
                  onChange={(e) => setCatalogForm({ ...catalogForm, gradeId: parseInt(e.target.value, 10) || 1 })}
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setCatalogModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCatalogProd ? 'Guardar Cambios' : 'Agregar al Catálogo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoresPage;
