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
  Check,
  Pencil,
  X,
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
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncingStore, setSyncingStore] = useState<string | null>(null);
  const [pingingStore, setPingingStore] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StoreItem | null>(null);

  const { getStores: refreshAppStores } = useAppStore();
  const canManageStores = isAdmin() || can('storesManage');

  const [activeTab, setActiveTab] = useState<'general' | 'wayne' | 'pos' | 'hoses' | 'db'>('general');
  const [storeHoses, setStoreHoses] = useState<any[]>([]);
  const [loadingHoses, setLoadingHoses] = useState<boolean>(false);
  const [editingHoseId, setEditingHoseId] = useState<string | null>(null);
  const [editHosePrice, setEditHosePrice] = useState<string>('');

  // Hose modal state
  const [hoseModalOpen, setHoseModalOpen] = useState(false);
  const [editingHose, setEditingHose] = useState<any | null>(null);
  const [savingHose, setSavingHose] = useState(false);
  const [hoseForm, setHoseForm] = useState({
    pumpId: 1,
    hoseId: 1,
    gradeName: 'GASOLINA SUPERIOR',
    tankId: '1',
    unitPrice: '',
    active: true,
  });
  const [deleteHoseModalOpen, setDeleteHoseModalOpen] = useState(false);
  const [hoseToDelete, setHoseToDelete] = useState<any | null>(null);
  const [deletingHose, setDeletingHose] = useState(false);

  const [form, setForm] = useState<Partial<StoreItem>>({
    code: '',
    name: '',
    titulo: '',
    RTN: '',
    address: '',
    ip: '127.0.0.1',
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
    posConfig: {
      codigoPos: '01',
      pantallaEnBomba: false,
      bloquearSoloPos: false,
      mostrarVideoPublicidad: false,
      reimprimirVarios: true,
      facturarVariasLineas: true,
      descuentoManual: true,
      ocultarBotonOtrasBombas: false,
      ocultarInformacionTurnos: false,
      mostrarBombas: true,
      numTransaccionesBombas: 400,
      minutosAtrasada: 60,
      mostrarTeclado: true,
      declararMontosIniciales: true,
    },
  });

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

  const handleSaveHosePrice = async (hoseId: string) => {
    const price = parseFloat(editHosePrice);
    if (isNaN(price) || price < 0) {
      toast.error('Ingrese un precio válido');
      return;
    }
    try {
      await api.patch(`/hoses/${hoseId}/price`, { unitPrice: price });
      toast.success('Precio de combustible actualizado');
      setEditingHoseId(null);
      if (form.code) {
        await loadStoreHoses(form.code);
      }
    } catch (err: any) {
      toast.error('Error al actualizar precio: ' + (err.response?.data?.message || err.message));
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
    setEditingHose(null);
    setHoseForm({
      pumpId: nextPump,
      hoseId: nextHose,
      gradeName: 'GASOLINA SUPERIOR',
      tankId: String(nextHose),
      unitPrice: '',
      active: true,
    });
    setHoseModalOpen(true);
  };

  const handleOpenEditHose = (hose: any) => {
    setEditingHose(hose);
    setHoseForm({
      pumpId: hose.pumpId ?? hose.pumpNumber ?? 1,
      hoseId: hose.hoseId ?? hose.hoseNumber ?? 1,
      gradeName: hose.fuelGradeName || hose.productName || hose.gradeName || 'GASOLINA SUPERIOR',
      tankId: hose.tankId ? String(hose.tankId) : '',
      unitPrice: hose.unitPrice != null ? String(hose.unitPrice) : '',
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
      const payload: any = {
        storeCode,
        pumpId,
        hoseId,
        gradeName: hoseForm.gradeName.trim(),
        tankId: hoseForm.tankId ? String(hoseForm.tankId).trim() : null,
        active: Boolean(hoseForm.active),
      };
      if (hoseForm.unitPrice !== '') {
        const price = parseFloat(String(hoseForm.unitPrice));
        if (!isNaN(price) && price >= 0) {
          payload.unitPrice = price;
        }
      }

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
        pantallaEnBomba: false,
        bloquearSoloPos: false,
        mostrarVideoPublicidad: false,
        reimprimirVarios: true,
        facturarVariasLineas: true,
        descuentoManual: true,
        ocultarBotonOtrasBombas: false,
        ocultarInformacionTurnos: false,
        mostrarBombas: true,
        numTransaccionesBombas: 400,
        minutosAtrasada: 60,
        mostrarTeclado: true,
        declararMontosIniciales: true,
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
      dbPort: store.dbPort || 5432,
      dbName: store.dbName || 'prisma',
      dbUser: store.dbUser || 'postgres',
      dbPassword: '',
      SyncMinutes: store.SyncMinutes || 5,
      posConfig: store.posConfig || {
        codigoPos: '01',
        pantallaEnBomba: false,
        bloquearSoloPos: false,
        mostrarVideoPublicidad: false,
        reimprimirVarios: true,
        facturarVariasLineas: true,
        descuentoManual: true,
        ocultarBotonOtrasBombas: false,
        ocultarInformacionTurnos: false,
        mostrarBombas: true,
        numTransaccionesBombas: 400,
        minutosAtrasada: 60,
        mostrarTeclado: true,
        declararMontosIniciales: true,
      },
    });
    setActiveTab('general');
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

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await api.post('/stores/test-connection', {
        ip: form.ip,
        dbPort: form.dbPort,
        dbName: form.dbName,
        dbUser: form.dbUser,
        dbPassword: form.dbPassword,
        dbSsl: form.dbSsl,
      });
      if (res.data?.success) {
        toast.success('¡Conexión exitosa a PostgreSQL!');
      } else {
        toast.error('Fallo de conexión: ' + (res.data?.error || 'No se pudo conectar'));
      }
    } catch (err: any) {
      toast.error('Error al probar conexión: ' + (err.response?.data?.message || err.message));
    } finally {
      setTestingConnection(false);
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
              <Card key={store.id} className="relative overflow-hidden border-border/60 hover:shadow-lg transition-all">
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
                <Building2 className="w-5 h-5 text-primary" />
                {editingStore ? 'Editar Tienda' : 'Nueva Tienda POS'}
              </DialogTitle>
              <DialogDescription>
                Aprovisionamiento y configuración centralizada de la estación de servicio y POS local.
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
                Wayne Fusion
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
                Mangueras & Precios
              </Button>
              <Button
                type="button"
                variant={activeTab === 'db' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 text-xs h-8 shrink-0"
                onClick={() => setActiveTab('db')}
              >
                <Database className="w-3.5 h-3.5" />
                Conexión BD
              </Button>
            </div>

            {/* TAB: GENERAL */}
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {/* ===== Sección: Identidad de la Tienda (propia de la sucursal) ===== */}
                <div className="col-span-full text-[11px] font-bold uppercase tracking-wider text-primary">◇ Identidad de la Tienda</div>

                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs font-medium">Código de Tienda *</Label>
                  <Input
                    id="code"
                    placeholder="Ej. 001"
                    value={form.code}
                    disabled={!!editingStore}
                    onChange={(e) => setForm({ ...form, code: e.target.value.trim() })}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">Identificador único asignado al POS (STORE_CODE).</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">Nombre de Tienda *</Label>
                  <Input
                    id="name"
                    placeholder="Ej. ESTACIÓN EL RECREO"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                {/*
                  ==================================================
                  Sección: Datos de la Empresa (Casa Matriz 000)
                  Heredados de la casa matriz al crear la tienda;
                  editables solo si esta tienda difiere de la empresa.
                  ==================================================
                */}
                <div className="col-span-full mt-4 border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">◆ Datos de la Empresa</span>
                    <span className="rounded bg-amber-500/10 text-amber-600 border border-amber-500/30 px-2 py-0.5 text-[10px] font-medium">
                      Heredado de la Casa Matriz (000) · opcional
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rtn" className="text-xs font-medium">RTN</Label>
                  <Input
                    id="rtn"
                    placeholder="Ej. 06019995197170"
                    value={form.RTN || ''}
                    onChange={(e) => setForm({ ...form, RTN: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emisor" className="text-xs font-medium">Emisor / Razón Social</Label>
                  <Input
                    id="emisor"
                    placeholder="Ej. INVERSIONES EL RECREO S.A."
                    value={form.emisor || ''}
                    onChange={(e) => setForm({ ...form, emisor: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="titulo" className="text-xs font-medium">Título Comercial</Label>
                  <Input
                    id="titulo"
                    placeholder="Ej. Gasolinera Shell Recreo"
                    value={form.titulo || ''}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telefono" className="text-xs font-medium">Teléfono</Label>
                  <Input
                    id="telefono"
                    placeholder="Ej. +504 2234-5678"
                    value={form.telefono || ''}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="correo" className="text-xs font-medium">Correo Electrónico</Label>
                  <Input
                    id="correo"
                    type="email"
                    placeholder="Ej. administracion@estacion.com"
                    value={form.correo || ''}
                    onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="moneda" className="text-xs font-medium">Moneda / Símbolo</Label>
                  <Input
                    id="moneda"
                    placeholder="HNL"
                    value={form.moneda || 'HNL'}
                    onChange={(e) => setForm({ ...form, moneda: e.target.value, codigoMoneda: e.target.value })}
                  />
                </div>

                <div className="col-span-full space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-medium">Dirección</Label>
                  <Input
                    id="address"
                    placeholder="Ej. Barrio El Recreo, Tegucigalpa"
                    value={form.address || ''}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="col-span-full flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Estado de la Estación</div>
                    <div className="text-xs text-muted-foreground">Habilita o deshabilita la estación en el ecosistema Matriz</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.isActive ?? true}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary"
                  />
                </div>

                {/* ===== Sección: Módulos Opcionales del Sistema ===== */}
                <div className="col-span-full mt-4 border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">◇ Módulos Habilitados en Backoffice</span>
                  </div>
                </div>

                <div className="col-span-full flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      Módulo de Contabilidad General
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Habilita o deshabilita la contabilidad, libro diario, partidas automáticas y estados financieros para esta estación
                    </div>
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
                    <div className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      Módulo de Clientes & Créditos (CxC)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Habilita o deshabilita la gestión de clientes a crédito y estados de cuenta en el panel
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.moduleCustomers !== 0}
                    onChange={(e) => setForm({ ...form, moduleCustomers: e.target.checked ? 1 : 0 })}
                    className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary"
                  />
                </div>
              </div>
            )}

            {/* TAB: WAYNE FUSION */}
            {activeTab === 'wayne' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="col-span-full text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
                  Parámetros de comunicación con el controlador Wayne Fusion en la pista local. La estación descargará estos parámetros automáticamente al iniciar.
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ipFusion" className="text-xs font-medium">IP Wayne Fusion (Pista)</Label>
                  <Input
                    id="ipFusion"
                    placeholder="192.168.10.51"
                    value={form.ipFusion || ''}
                    onChange={(e) => setForm({ ...form, ipFusion: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">Dirección IP de la red local del controlador Wayne Fusion.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="urlControlador" className="text-xs font-medium">URL Microservicio Controlador</Label>
                  <Input
                    id="urlControlador"
                    placeholder="http://localhost:5008"
                    value={form.urlControlador || ''}
                    onChange={(e) => setForm({ ...form, urlControlador: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">URL base del puente o driver de comunicación con bombas.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="claveControlador" className="text-xs font-medium">Clave / Token del Controlador</Label>
                  <Input
                    id="claveControlador"
                    type="password"
                    placeholder="Token o Clave Secreta"
                    value={form.claveControlador || ''}
                    onChange={(e) => setForm({ ...form, claveControlador: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">Clave de autenticación para comandos directos al controlador.</p>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border h-[62px]">
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium">Es Controlador Gas</div>
                      <div className="text-[10px] text-muted-foreground">Activar si gestiona dispensadores de GLP</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.esControladorGas ?? false}
                      onChange={(e) => setForm({ ...form, esControladorGas: e.target.checked })}
                      className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary"
                    />
                  </div>
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
                    { key: 'pantallaEnBomba', label: 'Pantalla en Bomba', desc: 'Permite seleccionar bomba directamente en pantalla' },
                    { key: 'mostrarBombas', label: 'Mostrar Bombas', desc: 'Muestra el panel visual de dispensadores y mangueras' },
                    { key: 'bloquearSoloPos', label: 'Bloquear Solo POS', desc: 'Restringe la máquina para ejecutar únicamente el POS' },
                    { key: 'mostrarVideoPublicidad', label: 'Video de Publicidad', desc: 'Reproduce videos comerciales en modo reposo' },
                    { key: 'mostrarTeclado', label: 'Teclado Táctil', desc: 'Despliega teclado en pantalla para terminales táctiles' },
                    { key: 'reimprimirVarios', label: 'Reimpresión Múltiple', desc: 'Permite reimprimir comprobantes de venta' },
                    { key: 'facturarVariasLineas', label: 'Facturar Múltiples Líneas', desc: 'Permite agregar lubricantes y otros ítems con combustible' },
                    { key: 'descuentoManual', label: 'Descuento Manual', desc: 'Habilita al cajero aplicar descuentos manuales autorizados' },
                    { key: 'declararMontosIniciales', label: 'Declarar Fondos Iniciales', desc: 'Exige ingreso de fondo de caja al abrir turno' },
                    { key: 'ocultarBotonOtrasBombas', label: 'Ocultar Otras Bombas', desc: 'Oculta botones de dispensadores ajenos al turno' },
                    { key: 'ocultarInformacionTurnos', label: 'Ocultar Info de Turnos', desc: 'Oculta cifras del turno en curso al despachador' },
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

            {/* TAB: HOSES & PRICES */}
            {activeTab === 'hoses' && (
              <div className="space-y-4 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold">Mangueras y Precios de Combustible</h4>
                    <p className="text-xs text-muted-foreground">
                      Bombas y mangueras configuradas para {form.name || form.code}. Los cambios se reflejan inmediatamente en pista.
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
                        Agregar Bomba / Manguera
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

                {!editingStore ? (
                  <div className="p-8 text-center border rounded-lg bg-muted/20 text-muted-foreground text-xs">
                    Guarde la tienda primero para poder consultar y configurar sus mangueras y precios.
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
                        Agregar Bomba / Manguera
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
                          <th className="py-2.5 px-3 text-left font-semibold">Combustible</th>
                          <th className="py-2.5 px-3 text-left font-semibold">Tanque</th>
                          <th className="py-2.5 px-3 text-right font-semibold">Precio Unit. (L.)</th>
                          <th className="py-2.5 px-3 text-center font-semibold">Estado</th>
                          <th className="py-2.5 px-3 text-center font-semibold w-28">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {storeHoses.map((h: any) => (
                          <tr key={h.id} className="hover:bg-muted/20">
                            <td className="py-2 px-3 font-mono font-medium">Bomba {h.pumpNumber ?? h.pumpId}</td>
                            <td className="py-2 px-3 font-mono">#{h.hoseNumber ?? h.hoseId}</td>
                            <td className="py-2 px-3">
                              <span className="inline-flex items-center gap-1.5 font-medium">
                                <span className={`w-2 h-2 rounded-full ${
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
                            <td className="py-2 px-3 font-mono text-muted-foreground">{h.tankId ? `T-${h.tankId}` : '-'}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              {editingHoseId === h.id ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editHosePrice}
                                  onChange={(e) => setEditHosePrice(e.target.value)}
                                  className="h-7 w-24 text-right inline-block font-mono text-xs"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveHosePrice(h.id);
                                    if (e.key === 'Escape') setEditingHoseId(null);
                                  }}
                                />
                              ) : (
                                `L. ${Number(h.unitPrice ?? h.price ?? 0).toFixed(2)}`
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                h.active !== false
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                  : 'bg-muted text-muted-foreground border border-border'
                              }`}>
                                {h.active !== false ? 'Activa' : 'Inactiva'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {editingHoseId === h.id ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                                    onClick={() => handleSaveHosePrice(h.id)}
                                    title="Guardar precio"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:bg-muted"
                                    onClick={() => setEditingHoseId(null)}
                                    title="Cancelar"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                      setEditingHoseId(h.id);
                                      setEditHosePrice(String(h.unitPrice ?? h.price ?? 0));
                                    }}
                                    title="Editar precio rápido"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                    onClick={() => handleOpenEditHose(h)}
                                    title="Editar configuración completa"
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
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: DATABASE CONNECTION */}
            {activeTab === 'db' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="col-span-full text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
                  Parámetros de conexión directa PostgreSQL hacia la base de datos de la estación local para sincronización ETL periódica.
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ip" className="text-xs font-medium">IP o Host del POS *</Label>
                  <Input
                    id="ip"
                    placeholder="127.0.0.1 o IP LAN"
                    value={form.ip || ''}
                    onChange={(e) => setForm({ ...form, ip: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dbPort" className="text-xs font-medium">Puerto PostgreSQL</Label>
                  <Input
                    id="dbPort"
                    type="number"
                    placeholder="5432"
                    value={form.dbPort || 5432}
                    onChange={(e) => setForm({ ...form, dbPort: parseInt(e.target.value, 10) || 5432 })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dbName" className="text-xs font-medium">Nombre Base de Datos</Label>
                  <Input
                    id="dbName"
                    placeholder="prisma"
                    value={form.dbName || ''}
                    onChange={(e) => setForm({ ...form, dbName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dbUser" className="text-xs font-medium">Usuario PostgreSQL</Label>
                  <Input
                    id="dbUser"
                    placeholder="postgres"
                    value={form.dbUser || ''}
                    onChange={(e) => setForm({ ...form, dbUser: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dbPassword" className="text-xs font-medium">Contraseña PostgreSQL</Label>
                  <Input
                    id="dbPassword"
                    type="password"
                    placeholder={editingStore ? '•••••••• (Sin cambios)' : '••••••••'}
                    value={form.dbPassword || ''}
                    onChange={(e) => setForm({ ...form, dbPassword: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="syncMinutes" className="text-xs font-medium">Intervalo Auto-Sync (minutos)</Label>
                  <Input
                    id="syncMinutes"
                    type="number"
                    placeholder="5"
                    value={form.SyncMinutes || 5}
                    onChange={(e) => setForm({ ...form, SyncMinutes: parseInt(e.target.value, 10) || 5 })}
                  />
                </div>

                <div className="col-span-full pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="gap-2 text-xs"
                  >
                    <Database className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
                    {testingConnection ? 'Probando conexión...' : 'Probar Conexión con PostgreSQL'}
                  </Button>
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
                <Label htmlFor="gradeName" className="text-xs font-medium">Combustible / Producto *</Label>
                <Input
                  id="gradeName"
                  list="store-fuel-grades-list"
                  placeholder="Ej. GASOLINA SUPERIOR"
                  value={hoseForm.gradeName}
                  onChange={(e) => setHoseForm({ ...hoseForm, gradeName: e.target.value.toUpperCase() })}
                  required
                />
                <datalist id="store-fuel-grades-list">
                  <option value="GASOLINA SUPERIOR" />
                  <option value="GASOLINA REGULAR" />
                  <option value="DIESEL 50PPM" />
                  <option value="DIESEL" />
                  <option value="KEROSENE" />
                  <option value="GLP" />
                </datalist>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['GASOLINA SUPERIOR', 'GASOLINA REGULAR', 'DIESEL 50PPM', 'DIESEL', 'KEROSENE', 'GLP'].map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setHoseForm({ ...hoseForm, gradeName: grade })}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                        hoseForm.gradeName === grade
                          ? 'bg-primary text-primary-foreground border-primary font-medium'
                          : 'bg-muted/40 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tankId" className="text-xs font-medium">Tanque Asociado</Label>
                <Input
                  id="tankId"
                  placeholder="1"
                  value={hoseForm.tankId}
                  onChange={(e) => setHoseForm({ ...hoseForm, tankId: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">Ej. 1, 2, o T-1 (Opcional)</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unitPrice" className="text-xs font-medium">Precio por Galón (L.)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={hoseForm.unitPrice}
                  onChange={(e) => setHoseForm({ ...hoseForm, unitPrice: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">Precio en Lempiras</p>
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
    </div>
  );
};

export default StoresPage;
