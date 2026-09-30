import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Plus,
    Trash2,
    User,
    FileText,
    Landmark,
    CreditCard,
    Search,
    Loader2,
    Check,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatIntInput, parseCurrency, formatCurrency } from '../lib/format';

interface Payment {
    paymentMethod: string;
    description: string;
    amount: string;
}

interface EditFormData {
    docType: number;
    customerNo: string;
    customerName: string;
    rtn: string;
    payments: Payment[];
    placa: string;
    chofer: string;
    km: string;
    orden: string;
    blocked?: number | boolean;
    usualBillingType?: number;
}

interface EditDocumentFormProps {
    doc: any;
    formData: EditFormData;
    setFormData: React.Dispatch<React.SetStateAction<EditFormData>>;
    chargeMethods: any[];
    fetchingMethods: boolean;
    customerSearch: string;
    setCustomerSearch: (val: string) => void;
    customers: any[];
    searchingCustomers: boolean;
    isCustomerPopoverOpen: boolean;
    setIsCustomerPopoverOpen: (val: boolean) => void;
    handleDocTypeChange: (val: string) => void;
    handleSearchCustomers: () => void;
    selectCustomer: (customer: any) => void;
    handleAddPayment: () => void;
    handleRemovePayment: (idx: number) => void;
    handlePaymentChange: (idx: number, field: string, value: any) => void;
}

export const EditDocumentForm: React.FC<EditDocumentFormProps> = ({
    doc,
    formData,
    setFormData,
    chargeMethods,
    fetchingMethods,
    customerSearch,
    setCustomerSearch,
    customers,
    searchingCustomers,
    isCustomerPopoverOpen,
    setIsCustomerPopoverOpen,
    handleDocTypeChange,
    handleSearchCustomers,
    selectCustomer,
    handleAddPayment,
    handleRemovePayment,
    handlePaymentChange,
}) => {
    const isRestrictedType = [3, 7].includes(doc.docType);

    return (
        <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 gap-4 p-4 bg-muted/20 rounded-lg border border-border/50">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" /> Tipo de Documento
                    </Label>
                    <Select
                        value={String(formData.docType)}
                        onValueChange={handleDocTypeChange}
                        disabled={isRestrictedType}
                    >
                        <SelectTrigger className={cn("w-full font-semibold", isRestrictedType ? "bg-muted" : "bg-background")}>
                            <SelectValue placeholder="Seleccione Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2].includes(doc.docType) ? (
                                <>
                                    <SelectItem value="1">Factura (Contado)</SelectItem>
                                    <SelectItem value="2">Factura (Crédito)</SelectItem>
                                </>
                            ) : doc.docType === 3 ? (
                                <SelectItem value="3">Nota de Crédito</SelectItem>
                            ) : (
                                <SelectItem value="7">Ticket</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border/50">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <User className="h-4 w-4" /> Información del Cliente
                    </Label>

                    <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2">
                                <Search className="h-3.5 w-3.5" /> Cambiar Cliente
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="end">
                            <div className="p-4 space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nombre, RTN o Cuenta..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomers()}
                                        className="h-9"
                                    />
                                    <Button size="sm" onClick={handleSearchCustomers} disabled={searchingCustomers}>
                                        {searchingCustomers ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                                    </Button>
                                </div>

                                <div className="max-h-[300px] overflow-y-auto rounded-md border overscroll-contain"
                                    onWheel={(e) => e.stopPropagation()}>
                                    <Table>
                                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                            <TableRow>
                                                <TableHead className="text-[10px] font-bold">Cliente</TableHead>
                                                <TableHead className="text-[10px] font-bold text-right">Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customers.map((c) => (
                                                <TableRow key={c.customerNo} className="hover:bg-primary/5 cursor-pointer" onClick={() => selectCustomer(c)}>
                                                    <TableCell className="py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-bold text-xs">{c.customerName}</div>
                                                            <span className={cn(
                                                                "text-[9px] font-bold px-1.5 py-0.5 rounded border",
                                                                c.usualBillingType === 0
                                                                    ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
                                                                    : "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                                                            )}>
                                                                {c.usualBillingType === 0 ? 'CRÉDITO' : 'CONTADO'}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">
                                                            Cta: {c.customerNo} • RTN: {c.rtn}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-2">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Seleccionar cliente">
                                                            <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {customers.length === 0 && !searchingCustomers && (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground text-xs italic">
                                                        Use el buscador para encontrar clientes
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Landmark className="h-3.5 w-3.5" /> Nº de Cuenta
                        </Label>
                        <Input
                            value={formData.customerNo}
                            readOnly
                            className="bg-muted/30 font-mono"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <User className="h-3.5 w-3.5" /> Nombre de Cliente
                        </Label>
                        <Input
                            value={formData.customerName}
                            readOnly
                            className="bg-muted/30 font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Landmark className="h-3.5 w-3.5" /> RTN
                        </Label>
                        <Input
                            value={formData.rtn}
                            readOnly
                            className="bg-muted/30 font-mono"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border/50">
                <Label className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Landmark className="h-4 w-4" /> Datos de Vehículo / Orden
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Placa</Label>
                        <Input
                            value={formData.placa}
                            onChange={(e) => setFormData(prev => ({ ...prev, placa: e.target.value.toUpperCase() }))}
                            placeholder="Nº PLACA"
                            className="bg-background font-mono uppercase"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chofer</Label>
                        <Input
                            value={formData.chofer}
                            onChange={(e) => setFormData(prev => ({ ...prev, chofer: e.target.value.toUpperCase() }))}
                            placeholder="NOMBRE CHOFER"
                            className="bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">KM</Label>
                        <Input
                            value={formData.km}
                            onChange={(e) => setFormData(prev => ({ ...prev, km: formatIntInput(e.target.value) }))}
                            onBlur={(e) => {
                                const val = parseInt(e.target.value.replace(/,/g, '') || '0');
                                setFormData(prev => ({ ...prev, km: val > 0 ? formatIntInput(String(val)) : '' }));
                            }}
                            placeholder="KILOMETRAJE"
                            className="bg-background font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Orden</Label>
                        <Input
                            value={formData.orden}
                            onChange={(e) => setFormData(prev => ({ ...prev, orden: e.target.value.toUpperCase() }))}
                            placeholder="Nº ORDEN"
                            className="bg-background font-mono"
                        />
                    </div>
                </div>
            </div>

            {!isRestrictedType && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> Formas de Pago
                        </Label>
                        {formData.docType !== 2 && (
                            <Button size="sm" variant="outline" onClick={handleAddPayment} className="h-8 gap-1.5 border-dashed">
                                <Plus className="h-3.5 w-3.5" /> Agregar Pago
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {formData.payments.map((pay: Payment, idx: number) => (
                            <div key={idx} className="flex gap-2 items-end bg-background border rounded-lg p-3 shadow-sm group">
                                <div className="flex-1 space-y-1.5">
                                    <Label className="text-[10px] text-muted-foreground font-bold">MÉTODO</Label>
                                    <Select
                                        value={pay.paymentMethod}
                                        disabled={formData.docType === 2 || fetchingMethods}
                                        onValueChange={(v) => handlePaymentChange(idx, 'paymentMethod', v)}
                                    >
                                        <SelectTrigger className="h-9 bg-muted/30">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {chargeMethods.length > 0 ? (
                                                chargeMethods.map((m: any) => (
                                                    <SelectItem key={m.code} value={m.code}>{m.description}</SelectItem>
                                                ))
                                            ) : (
                                                <>
                                                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                                    <SelectItem value="TARJETA">Tarjeta</SelectItem>
                                                    <SelectItem value="CREDITO">Crédito</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-[2] space-y-1.5">
                                    <Label className="text-[10px] text-muted-foreground font-bold">DESCRIPCIÓN</Label>
                                    <Input
                                        value={pay.description}
                                        placeholder="Descripción"
                                        className="font-semibold uppercase"
                                        readOnly
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <Label className="text-[10px] text-muted-foreground font-bold text-right block">MONTO</Label>
                                    <Input
                                        type="text"
                                        value={pay.amount}
                                        disabled={formData.docType === 2}
                                        onChange={(e) => handlePaymentChange(idx, 'amount', e.target.value)}
                                        onBlur={(e) => {
                                            const val = parseCurrency(e.target.value);
                                            handlePaymentChange(idx, 'amount', val.toFixed(2));
                                        }}
                                        className="h-9 bg-muted/30 text-right font-mono font-bold"
                                    />
                                </div>
                                {formData.docType !== 2 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemovePayment(idx)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}

                        {formData.payments.length === 0 && (
                            <div className="text-center py-8 bg-muted/10 rounded-lg border-2 border-dashed border-muted text-muted-foreground">
                                No hay formas de pago configuradas
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <span className="text-sm font-medium text-muted-foreground">Total Documento:</span>
                        <div className="flex flex-col items-end">
                            <span className="text-lg font-black font-mono text-primary">{formatCurrency(doc.totalAmount)}</span>
                            <span className={cn(
                                "text-[10px] font-bold",
                                Math.abs(formData.payments.reduce((sum: number, p: Payment) => sum + parseCurrency(p.amount), 0) - doc.totalAmount) < 0.01
                                    ? "text-green-600"
                                    : "text-red-600"
                            )}>
                                Cuadre: {formatCurrency(formData.payments.reduce((sum: number, p: Payment) => sum + parseCurrency(p.amount), 0))}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
