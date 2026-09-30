import React, { useState, useCallback, useEffect } from 'react';
import { 
    Users, 
    Search, 
    Loader2,
    Pencil,
    ToggleLeft,
    ToggleRight,
    X,
    AlertCircle,
    Check,
    Plus
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useCustomerStore } from '@/store/useCustomerStore';
import type { Customer } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

const formatRtn = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    if (digits.length > 8) return digits.slice(0, 4) + '-' + digits.slice(4, 8) + '-' + digits.slice(8);
    if (digits.length > 4) return digits.slice(0, 4) + '-' + digits.slice(4);
    return digits;
};

const Customers: React.FC = () => {
    const { getCustomers, getNextCustomerCode, createCustomer, updateCustomer, toggleCustomerStatus } = useCustomerStore();
    const { selectedStore } = useAppStore();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [loadingCode, setLoadingCode] = useState(false);
    const [createForm, setCreateForm] = useState({
        customerNo: '',
        customerName: '',
        rtn: '',
        billingType: 1, // 1 = Contado, 0 = Crédito
        creditLimit: '',
        notes: ''
    });
    const [creatingCustomer, setCreatingCustomer] = useState(false);

    const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        billingType: 'all',
        page: 1
    });

    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [editForm, setEditForm] = useState({ customerName: '', rtn: '' });
    const [savingCustomer, setSavingCustomer] = useState(false);

    const [togglingCustomer, setTogglingCustomer] = useState<string | null>(null);

    const fetchNextCode = useCallback(async (billingType: number) => {
        setLoadingCode(true);
        try {
            const res = await getNextCustomerCode(billingType);
            if (res && res.customerNo) {
                setCreateForm(prev => ({ ...prev, customerNo: res.customerNo }));
            }
        } catch (err) {
            console.error('Error fetching next customer code', err);
        } finally {
            setLoadingCode(false);
        }
    }, [getNextCustomerCode]);

    useEffect(() => {
        if (isCreateOpen) {
            fetchNextCode(createForm.billingType);
        }
    }, [isCreateOpen, createForm.billingType, fetchNextCode]);

    const fetchCustomers = useCallback(async (isManual = false, overrideFilters?: any) => {
        if (isManual) setIsRefreshing(true);
        else setLoading(true);

        try {
            setHasSearched(true);
            const apiFilters: any = { ...filters, ...overrideFilters };
            if (apiFilters.billingType === 'all') delete apiFilters.billingType;
            
            const res = await getCustomers(apiFilters);
            if (res && res.data) {
                setCustomers(res.data);
                setTotalCustomers(res.total || 0);
            } else {
                setCustomers([]);
                setTotalCustomers(0);
            }
        } catch (error) {
            toast.error('Error al cargar clientes');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [getCustomers, filters]);

    const isGlobalMode = !selectedStore || selectedStore.code === 'GLOBAL' || selectedStore.code === '000';

    useEffect(() => {
        fetchCustomers();
    }, [selectedStore?.code]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleEditClick = (customer: Customer) => {
        if (!isGlobalMode) {
            toast.warning('La modificación de clientes solo está permitida desde la Administración Global (Matriz).');
            return;
        }
        setEditingCustomer(customer);
        setEditForm({
            customerName: customer.customerName,
            rtn: formatRtn(customer.rtn || '')
        });
    };

    const handleEditSave = async () => {
        if (!editingCustomer) return;
        setSavingCustomer(true);

        try {
            const res = await updateCustomer(editingCustomer.customerNo, {
                customerName: editForm.customerName,
                rtn: editForm.rtn.replace(/\D/g, '')
            });

            if (res.success) {
                toast.success('Cliente actualizado correctamente');
                setEditingCustomer(null);
                fetchCustomers(true);
            } else {
                toast.error(res.error || 'Error al actualizar cliente');
            }
        } catch (error) {
            toast.error('Error al actualizar cliente');
        } finally {
            setSavingCustomer(false);
        }
    };

    const handleToggleStatus = async (customer: Customer) => {
        if (!isGlobalMode) {
            toast.warning('La modificación de estado de clientes solo está permitida desde la Administración Global (Matriz).');
            return;
        }
        setTogglingCustomer(customer.customerNo);
        try {
            const res = await toggleCustomerStatus(customer.customerNo);
            if (res.success) {
                toast.success(`Cliente ${res.blocked ? 'deshabilitado' : 'habilitado'} correctamente`);
                fetchCustomers(true);
            } else {
                toast.error(res.error || 'Error al cambiar estado');
            }
        } catch (error) {
            toast.error('Error al cambiar estado del cliente');
        } finally {
            setTogglingCustomer(null);
        }
    };

    const changePage = (newPage: number) => {
        if (newPage < 1) return;
        setFilters(prev => ({ ...prev, page: newPage }));
        fetchCustomers(true, { page: newPage });
    };

    const handleCreateCustomer = async () => {
        if (!createForm.customerNo.trim() || !createForm.customerName.trim()) {
            toast.error('El código y el nombre del cliente son obligatorios');
            return;
        }
        setCreatingCustomer(true);
        try {
            const res = await createCustomer({
                customerNo: createForm.customerNo.trim(),
                customerName: createForm.customerName.trim(),
                rtn: createForm.rtn.replace(/\D/g, ''),
                billingType: Number(createForm.billingType),
                creditLimit: createForm.billingType === 0 ? Number(createForm.creditLimit || 0) : 0,
                notes: createForm.billingType === 0 ? createForm.notes : undefined,
            });

            if (res.success) {
                setIsCreateOpen(false);
                const newCustomerData: Customer = res.customer || {
                    customerNo: createForm.customerNo.trim(),
                    customerName: createForm.customerName.trim(),
                    rtn: createForm.rtn.replace(/\D/g, ''),
                    billingType: Number(createForm.billingType),
                    billingTypeLabel: Number(createForm.billingType) === 0 ? 'Credito' : 'Contado',
                    blocked: false,
                    creditLimit: Number(createForm.creditLimit || 0),
                    notes: createForm.notes,
                };
                setCreatedCustomer(newCustomerData);
                setIsSuccessOpen(true);
                setCreateForm({ customerNo: '', customerName: '', rtn: '', billingType: 1, creditLimit: '', notes: '' });
                fetchCustomers(true);
            } else {
                toast.error(res.error || 'Error al registrar cliente');
            }
        } catch (error) {
            toast.error('Error al registrar cliente');
        } finally {
            setCreatingCustomer(false);
        }
    };

    const billingTypes = [
        { id: 'all', label: 'Todos' },
        { id: '1', label: 'Contado' },
        { id: '0', label: 'Credito' },
    ];

    return (
        <div className="flex flex-col h-full space-y-4">
            {!isGlobalMode && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs px-3 py-2 rounded-md flex items-center justify-between shrink-0">
                    <span>Modo Sucursal ({selectedStore?.name}): Los clientes se administran centralmente desde la Matriz Global. (Solo lectura en sucursales)</span>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-start items-start md:items-center gap-12 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-xl border border-border/50 sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Modulo de Clientes
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Gestion de clientes de {selectedStore?.name}.
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => fetchCustomers(true)}
                        disabled={loading || isRefreshing}
                        className="gap-2"
                    >
                        {isRefreshing || loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        {isRefreshing || loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (!isGlobalMode) {
                                toast.warning('La creación de clientes solo está permitida desde la Matriz Global.');
                                return;
                            }
                            setIsCreateOpen(true);
                        }}
                        disabled={!isGlobalMode}
                        className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                        title={!isGlobalMode ? 'La creación de clientes solo está permitida desde la Matriz Global' : undefined}
                    >
                        <Plus className="h-4 w-4" /> Nuevo Cliente
                    </Button>
                </div>
            </div>

            <Card className="border-border/50 shadow-sm bg-muted/20">
                <CardContent className="p-3 border-b">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input 
                                    placeholder="Nombre, codigo o RTN..." 
                                    className="pl-8 h-9 text-xs"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchCustomers(true)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Tipo de Cliente</label>
                            <Select 
                                value={filters.billingType} 
                                onValueChange={(v) => handleFilterChange('billingType', v)}
                            >
                                <SelectTrigger className="h-9 text-xs bg-background">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {billingTypes.map(t => (
                                        <SelectItem key={t.id} value={t.id} className="text-xs">
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
                            <span className="text-xs text-muted-foreground">
                                Total: <span className="font-bold text-foreground">{totalCustomers.toLocaleString('en-US')}</span> clientes
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex-1 overflow-auto pr-2 custom-scrollbar min-h-0">
                {!hasSearched ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
                        <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium">Busqueda de Clientes</h3>
                        <p className="text-muted-foreground text-center max-w-xs mb-4">
                            Utiliza los filtros de arriba y haz clic en "Buscar" para consultar los clientes.
                        </p>
                        <Button onClick={() => fetchCustomers(true)} variant="outline" className="gap-2">
                            <Search className="h-4 w-4" />
                            Buscar Clientes
                        </Button>
                    </div>
                ) : loading && customers.length === 0 ? (
                    <div className="space-y-3 py-10">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <div className="space-y-2">
                            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                        </div>
                    </div>
                ) : customers.length > 0 ? (
                    <div className="flex flex-col pb-4">
                        <div className="rounded-lg border bg-card">
                            <div className="grid grid-cols-12 gap-2 p-3 bg-muted/40 border-b text-[11px] font-black uppercase text-muted-foreground tracking-tight">
                                <div className="col-span-2">Codigo</div>
                                <div className="col-span-4">Nombre Completo</div>
                                <div className="col-span-2">RTN</div>
                                <div className="col-span-2 text-center">Tipo Cuenta</div>
                                <div className="col-span-1 text-center">Estado</div>
                                <div className="col-span-1 text-center">Acciones</div>
                            </div>
                            <div className="divide-y">
                                {customers.map((customer) => (
                                    <div key={customer.customerNo} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-muted/10 transition-colors">
                                        <div className="col-span-2 font-mono text-xs font-semibold text-primary">
                                            {customer.customerNo}
                                        </div>
                                        <div className="col-span-4 text-sm font-medium truncate" title={customer.customerName}>
                                            {customer.customerName}
                                        </div>
                                        <div className="col-span-2 font-mono text-sm text-muted-foreground tabular-nums">
                                            {customer.rtn ? formatRtn(customer.rtn) : '-'}
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <Badge 
                                                variant={customer.billingType === 0 ? "default" : "secondary"}
                                                className={`text-[10px] uppercase font-bold px-2 py-0.5 ${
                                                    customer.billingType === 0 
                                                        ? 'bg-primary text-primary-foreground shadow-sm' 
                                                        : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                                                }`}
                                            >
                                                {customer.billingTypeLabel}
                                            </Badge>
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <Badge 
                                                variant="outline"
                                                className={`text-[9px] uppercase font-black px-1.5 py-0 ${
                                                    customer.blocked 
                                                        ? 'text-red-600 border-red-200 bg-red-50' 
                                                        : 'text-emerald-600 border-emerald-200 bg-emerald-50'
                                                }`}
                                            >
                                                {customer.blocked ? 'Bloqueado' : 'Activo'}
                                            </Badge>
                                        </div>
                                        <div className="col-span-1 flex items-center justify-center gap-1">
                                            <div className="flex bg-muted/50 rounded-md p-0.5 border">
                                                {customer.billingType === 1 ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditClick(customer)}
                                                        disabled={!isGlobalMode}
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
                                                        title={!isGlobalMode ? "Edición deshabilitada en modo sucursal" : "Editar datos del cliente"}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                ) : (
                                                    <div className="h-6 w-6 flex items-center justify-center" title="Clientes de crédito no son editables">
                                                        <AlertCircle className="h-3 w-3 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(customer)}
                                                    disabled={!isGlobalMode || togglingCustomer === customer.customerNo}
                                                    className={`h-6 w-6 p-0 ${customer.blocked ? 'text-red-500 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-600'} transition-all disabled:opacity-30`}
                                                    title={!isGlobalMode ? "Cambio de estado deshabilitado en modo sucursal" : (customer.blocked ? 'Habilitar este cliente' : 'Bloquear este cliente')}
                                                >
                                                    {togglingCustomer === customer.customerNo ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : customer.blocked ? (
                                                        <ToggleLeft className="h-4 w-4" />
                                                    ) : (
                                                        <ToggleRight className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-center mt-4 gap-2 items-center">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => changePage(filters.page - 1)}
                                disabled={filters.page === 1 || loading}
                            >
                                Anterior
                            </Button>
                            <span className="text-xs text-muted-foreground font-mono px-3">
                                Pagina {filters.page}
                            </span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => changePage(filters.page + 1)}
                                disabled={customers.length < 50 || loading}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
                        <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium">No se encontraron clientes</h3>
                        <p className="text-muted-foreground text-center max-w-xs">
                            No hay registros que coincidan con los filtros aplicados.
                        </p>
                    </div>
                )}
            </div>

            {editingCustomer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-[450px] max-h-[90vh] overflow-auto">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Editar Cliente</CardTitle>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setEditingCustomer(null)}
                                    className="h-7 w-7 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-mono text-base">Cuenta: {editingCustomer.customerNo}</span>
                                <Badge 
                                    variant={editingCustomer.billingType === 0 ? "default" : "secondary"}
                                    className={`text-[10px] uppercase font-bold ${
                                        editingCustomer.billingType === 0 
                                            ? 'bg-primary text-primary-foreground' 
                                            : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                                    }`}
                                >
                                    {editingCustomer.billingTypeLabel}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Nombre</label>
                                <Input 
                                    value={editForm.customerName}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, customerName: e.target.value }))}
                                    placeholder="Nombre del cliente"
                                    className="text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">RTN</label>
                                <Input 
                                    value={editForm.rtn}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, rtn: formatRtn(e.target.value) }))}
                                    placeholder="0501-2000-15151515"
                                    className="text-sm font-mono"
                                    maxLength={18}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => setEditingCustomer(null)}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    className="flex-1 gap-1"
                                    onClick={handleEditSave}
                                    disabled={savingCustomer || !editForm.customerName.trim()}
                                >
                                    {savingCustomer ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    Guardar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Nuevo Cliente (Matriz Global)</DialogTitle>
                        <DialogDescription>
                            Registra un nuevo cliente centralizado en la base de datos de la Matriz.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Tipo de Cuenta</label>
                            <Select 
                                value={String(createForm.billingType)}
                                onValueChange={(v) => {
                                    const newType = Number(v);
                                    setCreateForm(prev => ({ ...prev, billingType: newType }));
                                }}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Seleccione tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1" className="text-xs">Contado (CCO-XXXXX)</SelectItem>
                                    <SelectItem value="0" className="text-xs">Crédito (CC-XXXXX)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Código de Cliente *</label>
                                <span className="text-[10px] text-muted-foreground italic">Correlativo automático</span>
                            </div>
                            <div className="relative">
                                <Input 
                                    value={createForm.customerNo}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, customerNo: e.target.value }))}
                                    placeholder="Cargando código..."
                                    className="text-sm font-mono pr-8"
                                />
                                {loadingCode && (
                                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Nombre Completo *</label>
                            <Input 
                                value={createForm.customerName}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, customerName: e.target.value }))}
                                placeholder="Nombre o Razón Social"
                                className="text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-muted-foreground">RTN</label>
                            <Input 
                                value={createForm.rtn}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, rtn: formatRtn(e.target.value) }))}
                                placeholder="0501-2000-15151515"
                                className="text-sm font-mono"
                                maxLength={18}
                            />
                        </div>

                        {createForm.billingType === 0 && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Límite de Crédito (Lempiras L.)</label>
                                    <Input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={createForm.creditLimit}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, creditLimit: e.target.value }))}
                                        placeholder="0.00"
                                        className="text-sm font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Observaciones / Notas</label>
                                    <Input 
                                        value={createForm.notes}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Términos de crédito u observaciones..."
                                        className="text-sm"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleCreateCustomer} 
                            disabled={creatingCustomer || loadingCode || !createForm.customerNo.trim() || !createForm.customerName.trim()}
                            className="gap-2"
                        >
                            {creatingCustomer && <Loader2 className="h-4 w-4 animate-spin" />}
                            Registrar Cliente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 shrink-0">
                                <Check className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-emerald-600">¡Cliente Creado Exitosamente!</DialogTitle>
                                <DialogDescription className="text-xs">
                                    Registrado en la Administración Centralizada de la Matriz.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {createdCustomer && (
                        <div className="space-y-2.5 py-3 bg-muted/40 p-4 rounded-xl border text-xs">
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground font-medium">Código:</span>
                                <span className="col-span-2 font-mono font-bold text-primary">{createdCustomer.customerNo}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground font-medium">Nombre:</span>
                                <span className="col-span-2 font-semibold text-foreground">{createdCustomer.customerName}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground font-medium">RTN:</span>
                                <span className="col-span-2 font-mono tabular-nums">{createdCustomer.rtn ? formatRtn(createdCustomer.rtn) : 'Sin RTN'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground font-medium">Tipo de Cuenta:</span>
                                <span className="col-span-2">
                                    <Badge 
                                        variant={createdCustomer.billingType === 0 ? "default" : "secondary"}
                                        className="text-[10px] uppercase font-bold"
                                    >
                                        {createdCustomer.billingTypeLabel || (createdCustomer.billingType === 0 ? 'Credito' : 'Contado')}
                                    </Badge>
                                </span>
                            </div>
                            {createdCustomer.billingType === 0 && (
                                <>
                                    <div className="grid grid-cols-3 gap-1">
                                        <span className="text-muted-foreground font-medium">Límite Crédito:</span>
                                        <span className="col-span-2 font-mono font-bold text-emerald-600">
                                            L. {Number(createdCustomer.creditLimit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    {createdCustomer.notes && (
                                        <div className="grid grid-cols-3 gap-1">
                                            <span className="text-muted-foreground font-medium">Observaciones:</span>
                                            <span className="col-span-2 text-muted-foreground italic">{createdCustomer.notes}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="grid grid-cols-3 gap-1 border-t pt-2 mt-1">
                                <span className="text-muted-foreground font-medium">Estado:</span>
                                <span className="col-span-2 text-emerald-600 font-bold">ACTIVO</span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button className="w-full" onClick={() => setIsSuccessOpen(false)}>
                            Entendido / Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Customers;