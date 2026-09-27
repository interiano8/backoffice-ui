import React from 'react';
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { getDocTypeLabel, isEfectivo, isTarjeta, isCredito, GALLON_TO_LITER } from "@/lib/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Pencil, FileText, CreditCard, Receipt, Ticket, User, Monitor, Calendar, Award, ArrowUpRight, ArrowDownRight, RotateCcw } from "lucide-react";
import { EditDocumentModal } from './EditDocumentModal';
import { Button } from '@/components/ui/button';

interface TransactionCardProps {
    doc: any;
    variant?: 'default' | 'success' | 'info' | 'warning' | 'destructive';
    compact?: boolean;
    onRefresh?: () => void;
}

const getDocTypeIcon = (docType: number) => {
    switch (docType) {
        case 1: return <FileText className="h-3.5 w-3.5" />;
        case 2: return <CreditCard className="h-3.5 w-3.5" />;
        case 3: return <Receipt className="h-3.5 w-3.5" />;
        case 7: return <Ticket className="h-3.5 w-3.5" />;
        default: return <FileText className="h-3.5 w-3.5" />;
    }
};

const getVariantStyles = (variant: string = 'default') => {
    switch (variant) {
        case 'success': return 'border-l-green-500 bg-card hover:shadow-md hover:shadow-green-500/5';
        case 'info': return 'border-l-sky-400 bg-card hover:shadow-md hover:shadow-sky-500/5';
        case 'warning': return 'border-l-amber-400 bg-card hover:shadow-md hover:shadow-amber-500/5';
        case 'destructive': return 'border-l-red-500 bg-card hover:shadow-md hover:shadow-red-500/5';
        default: return 'border-l-primary/40 bg-card hover:shadow-md';
    }
};

const getDocTypeBadgeVariant = (variant: string = 'default') => {
    switch (variant) {
        case 'success': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30';
        case 'info': return 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30';
        case 'warning': return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30';
        case 'destructive': return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30';
        default: return 'bg-muted text-muted-foreground border-border';
    }
};

export const TransactionCard: React.FC<TransactionCardProps> = ({ doc, variant = 'default', compact = false, onRefresh }) => {
    const [isEditOpen, setIsEditOpen] = React.useState(false);

    const formatQuantity = (qty: number) =>
        (Number(qty || 0)).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 });

    const formatDNI = (dni: string) => {
        if (!dni) return '';
        const cleaned = dni.replace(/\D/g, '');
        if (cleaned.length <= 4) return cleaned;
        if (cleaned.length <= 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    };

    const badgeStyle = getDocTypeBadgeVariant(variant);

    return (
        <Card className={cn(
            "overflow-hidden border-l-4 shadow-sm transition-all duration-200",
            getVariantStyles(variant),
            compact ? "" : ""
        )}>
            <CardHeader className={cn("bg-muted/30 border-b", compact ? 'px-3 py-2' : 'px-4 py-3')}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide", badgeStyle)}>
                                {getDocTypeIcon(doc.docType)}
                                {getDocTypeLabel(doc.docType)}
                            </span>
                        </div>
                        <div className={cn("font-bold font-mono text-foreground", compact ? 'text-sm' : 'text-base')}>
                            {doc.docNo}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {doc.staff && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
                                    <User className="h-2.5 w-2.5" /> {doc.staff}
                                </span>
                            )}
                            {doc.posTerminal && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
                                    <Monitor className="h-2.5 w-2.5" /> POS {doc.posTerminal}
                                </span>
                            )}
                            {doc.shiftDate && (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
                                    <Calendar className="h-2.5 w-2.5" /> Fecha turno: {String(doc.shiftDate).replace(/-/g, '/')}
                                </span>
                            )}
                            {doc.shiftNo && (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
                                    Turno: #{doc.shiftNo}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className={cn("font-mono font-bold", compact ? 'text-base' : 'text-lg')}>
                            {formatCurrency(doc.totalAmount)}
                        </div>
                        <Badge 
                            variant={doc.status === 1 ? "outline" : "secondary"}
                            className={cn(
                                "gap-1 font-bold uppercase tracking-tighter mt-1",
                                compact ? "text-[8px] px-1.5 py-0 h-4" : "text-[10px] px-2 py-0.5",
                                doc.status === 1 
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30" 
                                    : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                            )}
                        >
                            {doc.status === 1 ? (
                                <><Check className={compact ? "h-2 w-2" : "h-3 w-3"} /> Enviado</>
                            ) : (
                                <><Clock className={compact ? "h-2 w-2" : "h-3 w-3"} /> Pendiente</>
                            )}
                        </Badge>
                        {doc.date && (
                            <div className={cn("text-muted-foreground mt-1 font-mono whitespace-nowrap", compact ? 'text-xs' : 'text-sm')}>
                                {String(doc.date).replace(/-/g, '/')}
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className={cn("text-sm space-y-3", compact ? 'p-2' : 'p-4')}>
                {(doc.customerName || doc.rtn || doc.customerNo) && (
                    <div className={cn("rounded-lg border bg-muted/20", compact ? 'p-2 grid grid-cols-2 gap-1.5' : 'p-3 grid grid-cols-2 md:grid-cols-3 gap-3')}>
                        {doc.customerName && (
                            <div className={compact ? 'col-span-2' : ''}>
                                <span className={cn("font-bold text-muted-foreground uppercase tracking-wider block", compact ? 'text-[8px] mb-0.5' : 'text-[10px] mb-1')}>Cliente</span>
                                <span className={cn("font-medium text-foreground truncate block", compact ? 'text-[10px]' : 'text-sm')} title={doc.customerName}>{doc.customerName}</span>
                            </div>
                        )}
                        {doc.rtn && (
                            <div>
                                <span className={cn("font-bold text-muted-foreground uppercase tracking-wider block", compact ? 'text-[8px] mb-0.5' : 'text-[10px] mb-1')}>RTN</span>
                                <span className={cn("font-mono bg-background/50 rounded border px-1.5 py-0.5", compact ? 'text-[9px]' : 'text-xs')}>{doc.rtn}</span>
                            </div>
                        )}
                        {doc.customerNo && (
                            <div>
                                <span className={cn("font-bold text-muted-foreground uppercase tracking-wider block", compact ? 'text-[8px] mb-0.5' : 'text-[10px] mb-1')}>Cuenta</span>
                                <span className="font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded border border-amber-500/20 px-1.5 py-0.5">{doc.customerNo}</span>
                            </div>
                        )}
                    </div>
                )}

                {doc.leal && (
                    <div className={cn(
                        "rounded-lg border p-3 flex flex-wrap items-center gap-x-4 gap-y-1",
                        doc.leal.type === 0 ? "bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/20" :
                        doc.leal.type === 1 ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20" :
                        "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20"
                    )}>
                        <div className="flex items-center gap-2">
                            {doc.leal.type === 0 ? <ArrowUpRight className="h-4 w-4 text-violet-600 dark:text-violet-400" /> :
                             doc.leal.type === 1 ? <ArrowDownRight className="h-4 w-4 text-rose-600 dark:text-rose-400" /> :
                             <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                            <span className={cn("font-bold text-xs uppercase",
                                doc.leal.type === 0 ? "text-violet-700 dark:text-violet-300" :
                                doc.leal.type === 1 ? "text-rose-700 dark:text-rose-300" :
                                "text-amber-700 dark:text-amber-300"
                            )}>
                                Leal: {doc.leal.type === 0 ? 'Acumulación' : doc.leal.type === 1 ? 'Redención' : 'Reversión'}
                            </span>
                        </div>
                        <span className={cn("text-xs", doc.leal.type === 0 ? "text-violet-600 dark:text-violet-400" : doc.leal.type === 1 ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400")}>
                            <Award className="h-3.5 w-3.5 inline mr-1" />
                            <strong>{doc.leal.points.toLocaleString()}</strong> pts {doc.leal.type === 0 ? 'acumulados' : doc.leal.type === 1 ? 'redimidos' : 'revertidos'} 
                            {doc.leal.activePoints > 0 && (
                                <> · <strong>{doc.leal.activePoints.toLocaleString()}</strong> activos</>
                            )}
                        </span>
                        {doc.leal.name && (
                            <span className="text-xs text-muted-foreground">{doc.leal.name} · {formatDNI(doc.leal.dni)}</span>
                        )}
                    </div>
                )}

                {(doc.placa || doc.chofer || doc.km || doc.orden || doc.appliedDocNo) && (
                    <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground border-b pb-2", compact ? 'text-[10px]' : 'text-xs')}>
                        {doc.placa && <span><strong>Placa:</strong> {doc.placa}</span>}
                        {doc.chofer && <span><strong>Chofer:</strong> {doc.chofer}</span>}
                        {doc.km && <span><strong>KM:</strong> {doc.km}</span>}
                        {doc.orden && <span><strong>Orden:</strong> {doc.orden}</span>}
                        {doc.appliedDocNo && (
                            <span className="text-primary"><strong>Afecta a:</strong> <span className="px-1.5 py-0.5 bg-primary/10 rounded border border-primary/20 font-bold">{doc.appliedDocNo}</span></span>
                        )}
                    </div>
                )}

                <div className="rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className={cn("bg-muted/50 hover:bg-muted/50", compact ? "h-6" : "h-8")}>
                                <TableHead className={cn("font-semibold", compact ? 'h-6 py-0 px-1 text-[9px] w-[40%]' : 'h-8 py-1 text-xs w-[35%]')}>Descripción</TableHead>
                                <TableHead className={cn("font-semibold text-right", compact ? 'h-6 py-0 px-1 text-[9px]' : 'h-8 py-1 text-xs')}>Cant.</TableHead>
                                <TableHead className={cn("font-semibold text-right", compact ? 'h-6 py-0 px-1 text-[9px] w-[100px]' : 'h-8 py-1 text-xs w-[110px]')}>Precio</TableHead>
                                <TableHead className={cn("font-semibold text-right", compact ? 'h-6 py-0 px-1 text-[9px]' : 'h-8 py-1 text-xs')}>Desc.</TableHead>
                                <TableHead className={cn("font-semibold text-right", compact ? 'h-6 py-0 px-1 text-[9px]' : 'h-8 py-1 text-xs')}>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {doc.lines?.map((line: any, idx: number) => (
                                <TableRow key={idx} className="hover:bg-muted/20 border-b border-border/20 last:border-0">
                                    <TableCell className={cn(compact ? 'py-1 px-1 text-[10px]' : 'py-2 text-xs')}>
                                        <span className="font-medium">{line.productName || line.description}</span>
                                        {(line.pumpId || line.hoseId) && (
                                            <span className={cn("text-muted-foreground block mt-0.5", compact ? 'text-[8px]' : 'text-[10px]')}>
                                                {line.pumpId ? `B: ${line.pumpId}` : ''} {line.hoseId ? `M: ${line.hoseId}` : ''}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className={cn("text-right font-mono", compact ? 'py-1 px-1 text-[10px]' : 'py-2 px-2 text-xs')}>
                                        {(line.pumpId || line.hoseId) ? (
                                            <div className="inline-flex flex-col items-end">
                                                <span className="font-mono whitespace-nowrap">
                                                    {Number(line.volumeLT || line.quantity || 0).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
                                                    <span className="text-muted-foreground ml-0.5">LT</span>
                                                </span>
                                                <span className={cn("font-mono text-muted-foreground whitespace-nowrap", compact ? 'text-[8px]' : 'text-[10px]')}>
                                                    {Number(line.volumeGL || (Number(line.volumeLT || line.quantity || 0) / GALLON_TO_LITER)).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
                                                    <span className="text-muted-foreground ml-0.5">GL</span>
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="font-mono">{formatQuantity(line.quantity)}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className={cn("text-right font-mono text-muted-foreground whitespace-nowrap", compact ? 'py-1 px-1 text-[10px]' : 'py-2 px-2 text-xs')}>
                                        {formatCurrency(line.unitPrice)}
                                    </TableCell>
                                    <TableCell className={cn("text-right font-mono whitespace-nowrap", compact ? 'py-1 px-1 text-[10px]' : 'py-2 text-xs')}>
                                        {(() => {
                                            const d = line.discount ? Number(line.discount) : 0;
                                            if (d > 0) return <span className="text-red-600 dark:text-red-400">-{formatCurrency(d)}</span>;
                                            return <span className="text-muted-foreground">-</span>;
                                        })()}
                                    </TableCell>
                                    <TableCell className={cn("text-right font-mono font-semibold whitespace-nowrap", compact ? 'py-1 px-1 text-[10px]' : 'py-2 text-xs')}>
                                        {formatCurrency(line.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {(doc.payments?.length > 0 || doc.docType === 2 || isCredito(doc.billingType || '')) && (
                    <div className="space-y-2 pt-1">
                        <span className={cn("font-bold text-muted-foreground uppercase tracking-widest", compact ? 'text-[8px]' : 'text-[10px]')}>
                            Forma de Pago
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {doc.payments?.length > 0 ? (
                                doc.payments.map((pay: any) => {
                                    const desc = pay.description || pay.paymentMethod || '';
                                    const efectivo = isEfectivo(desc);
                                    const tarjeta = isTarjeta(desc);
                                    return (
                                        <div 
                                            key={desc} 
                                            className={cn(
                                                "inline-flex items-center gap-1.5 rounded-md border font-medium shadow-sm",
                                                compact ? "text-[9px] px-2 py-0.5" : "text-[11px] px-2.5 py-1",
                                                efectivo ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" :
                                                tarjeta ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400" :
                                                "bg-muted/50 border-border text-foreground"
                                            )}
                                        >
                                            {efectivo && <span className="text-emerald-500 font-black text-xs">$</span>}
                                            {tarjeta && <span className="text-blue-500 font-black text-xs">&#x1F4B3;</span>}
                                            {desc}
                                            <span className="font-bold">{formatCurrency(pay.amount)}</span>
                                        </div>
                                    );
                                })
                            ) : (doc.docType === 2 || isCredito(doc.billingType || '')) && (
                                <div className={cn(
                                    "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400",
                                    compact ? "text-[9px]" : "text-[11px]"
                                )}>
                                    <span className="font-black text-xs">CR</span>
                                    Venta a Crédito
                                    <span className="font-bold ml-1">{formatCurrency(doc.totalAmount)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {doc.status === 0 && (
                    <div className="flex justify-end pt-2 border-t border-border/30">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsEditOpen(true)}
                            className="h-7 gap-1.5 px-3 text-[11px] font-medium border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        >
                            <Pencil className="h-3 w-3" /> Editar
                        </Button>
                    </div>
                )}
            </CardContent>

            <EditDocumentModal 
                open={isEditOpen} 
                onOpenChange={setIsEditOpen} 
                doc={doc} 
                onSuccess={() => {
                    onRefresh && onRefresh();
                }}
            />
        </Card>
    );
};
