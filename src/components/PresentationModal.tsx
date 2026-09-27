import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Shift } from '../types/api';
import { useAppStore } from '../store/useAppStore';
import { getPresentationExpected, savePresentation } from '../services/shift.service';
import { toast } from 'sonner';
import { formatNumberInput, parseCurrency, formatCurrency, formatShiftDate } from '../lib/format';

interface ExpectedItem {
    name: string;
    expected: number;
    type: string;
}

interface ExpectedTotals {
    list: ExpectedItem[];
    totals: { cash: number; card: number; other: number; total: number; }
}

interface PresentationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shift: Shift | null;
    onSuccess: () => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({ open, onOpenChange, shift, onSuccess }) => {
    const { selectedStore } = useAppStore();
    
    const [declaredValues, setDeclaredValues] = useState<Record<string, string>>({});
    
    const [expectedTotals, setExpectedTotals] = useState<ExpectedTotals | null>(null);
    const [isLoadingExpected, setIsLoadingExpected] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [comment, setComment] = useState("");

    useEffect(() => {
        if (open && shift && selectedStore) {
            setResult(null);
            setExpectedTotals(null);
            
            if (shift.isPresented && shift.presentationDetails) {
                try {
                    const existingDetails = typeof shift.presentationDetails === 'string' 
                        ? JSON.parse(shift.presentationDetails) 
                        : shift.presentationDetails;
                    
                    if (Array.isArray(existingDetails)) {
                        const prefilled: Record<string, string> = {};
                        existingDetails.forEach((d: any) => {
                            if (d.name) {
                                prefilled[d.name] = d.raw || formatNumberInput(String(d.declared || 0));
                            }
                        });
                        setDeclaredValues(prefilled);
                    } else {
                        setDeclaredValues({});
                    }
                    setComment(shift.presentationComment || "");
                } catch (e) {
                    setDeclaredValues({});
                    setComment("");
                }
            } else {
                setDeclaredValues({});
                setComment("");
            }

            fetchExpectedTotals();
        }
    }, [open, shift, selectedStore]);

    const fetchExpectedTotals = async () => {
        if (!shift || !selectedStore) return;
        setIsLoadingExpected(true);
        try {
            const result = await getPresentationExpected(shift.shiftDate, shift.shiftNo, shift.employeeName);
            if (result.success) {
                setExpectedTotals(result.expected);
            }
        } catch (error) {
            toast.error('No se pudieron obtener los valores esperados del sistema');
        } finally {
            setIsLoadingExpected(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shift || !selectedStore || !expectedTotals) return;

        setIsLoading(true);
        try {
            const details = expectedTotals.list.map(item => ({
                name: item.name,
                expected: item.expected,
                declared: parseCurrency(declaredValues[item.name] || '0'),
                raw: (declaredValues[item.name] || '').includes('+') || (declaredValues[item.name] || '').includes('-') ? declaredValues[item.name] : null,
                type: item.type
            }));

            const result = await savePresentation({
                shiftDate: shift.shiftDate,
                shiftNo: shift.shiftNo,
                employeeName: shift.employeeName,
                details,
                comment
            });

            setResult(result);
            if (result.success) {
                if (result.isBalanced) {
                    toast.success('Formas de pago cuadradas correctamente');
                } else {
                    toast.warning('Guardado con diferencias en el cuadre');
                }
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar la presentación');
        } finally {
            setIsLoading(false);
        }
    };

    const handleValueChange = (name: string, value: string) => {
        setDeclaredValues(prev => ({
            ...prev,
            [name]: formatNumberInput(value)
        }));
    };

    if (!shift) return null;

    const totalExpected = expectedTotals?.totals.total || 0;
    const totalDeclared = expectedTotals?.list.reduce((acc, item) => acc + parseCurrency(declaredValues[item.name] || '0'), 0) || 0;
    const totalDiff = totalDeclared - totalExpected;

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val && result) onSuccess();
            onOpenChange(val);
        }}>
            <DialogContent className={`${result ? 'sm:max-w-lg' : 'sm:max-w-[85vw]'} max-h-[90vh] overflow-y-auto p-0 gap-0`}>
                <DialogHeader className="px-6 pt-6 pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg">{shift.isPresented ? 'Editar Presentación' : 'Presentación de Formas de Pago'}</DialogTitle>
                            <DialogDescription className="mt-1">
                                Turno <span className="font-semibold text-foreground">#{shift.shiftNo}</span> — {formatShiftDate(shift.shiftDate)} — {shift.employeeName}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {!result ? (
                    isLoadingExpected ? (
                        <div className="py-16 flex justify-center items-center flex-col gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground font-medium">Obteniendo montos del sistema...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-4 space-y-4">
                                <div className="border rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/80 border-b">
                                                <th className="px-5 py-3 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Forma de Pago</th>
                                                <th className="px-5 py-3 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground w-36">Sistema</th>
                                                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Declarado</th>
                                                <th className="px-5 py-3 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground w-44">Acumulado</th>
                                                <th className="px-5 py-3 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground w-36">Diferencia</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {expectedTotals?.list.map((item, idx) => {
                                                const dec = parseCurrency(declaredValues[item.name] || '0');
                                                const cumulative = expectedTotals.list.slice(0, idx + 1).reduce((sum, i) =>
                                                    sum + parseCurrency(declaredValues[i.name] || '0'), 0);
                                                const diff = dec - item.expected;
                                                const isBalanced = Math.abs(diff) < 0.05;
                                                return (
                                                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.type === 'cash' ? 'bg-emerald-500' : item.type === 'card' ? 'bg-blue-500' : 'bg-violet-500'}`} />
                                                                <span className="font-semibold">{item.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-mono text-muted-foreground tabular-nums">{formatCurrency(item.expected)}</td>
                                                        <td className="px-3 py-2">
                                                            <div className="flex items-center gap-1 flex-wrap min-h-[40px] w-full border rounded-lg bg-background px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-primary/50 transition-all cursor-text"
                                                                onClick={(e) => {
                                                                    const input = e.currentTarget.querySelector('input');
                                                                    if (input) input.focus();
                                                                }}
                                                            >
                                                                {(() => {
                                                                    const parts = declaredValues[item.name] ? declaredValues[item.name].split(/([+\-])/).filter(Boolean) : [];
                                                                    const rendered = [];
                                                                    let numIdx = 0;
                                                                    for (let pi = 0; pi < parts.length; pi++) {
                                                                        const part = parts[pi];
                                                                        if (part === '+') {
                                                                            rendered.push(<span key={`op-${pi}`} className="text-emerald-600 font-bold text-sm mx-1">+</span>);
                                                                        } else if (part === '-') {
                                                                            rendered.push(<span key={`op-${pi}`} className="text-red-500 font-bold text-sm mx-1">−</span>);
                                                                        } else {
                                                                            const currentNumIdx = numIdx;
                                                                            rendered.push(
                                                                                <span key={`v-${pi}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-sm font-mono font-bold text-primary">
                                                                                    {Number(part).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            const allParts = declaredValues[item.name].split(/([+\-])/).filter(Boolean);
                                                                                            let targetIdx = -1;
                                                                                            let nIdx = 0;
                                                                                            for (let i = 0; i < allParts.length; i++) {
                                                                                                if (allParts[i] !== '+' && allParts[i] !== '-') {
                                                                                                    if (nIdx === currentNumIdx) { targetIdx = i; break; }
                                                                                                    nIdx++;
                                                                                                }
                                                                                            }
                                                                                            if (targetIdx >= 0) {
                                                                                                const newParts = [...allParts];
                                                                                                const start = Math.max(0, targetIdx - 1);
                                                                                                const count = targetIdx > 0 && (allParts[targetIdx - 1] === '+' || allParts[targetIdx - 1] === '-') ? 2 : 1;
                                                                                                newParts.splice(start, count);
                                                                                                handleValueChange(item.name, newParts.join(''));
                                                                                            }
                                                                                        }}
                                                                                        className="ml-0.5 text-muted-foreground/40 hover:text-destructive transition-colors leading-none text-xs"
                                                                                        aria-label="Eliminar"
                                                                                    >
                                                                                        <X className="h-3 w-3" />
                                                                                    </button>
                                                                                </span>
                                                                            );
                                                                            numIdx++;
                                                                        }
                                                                    }
                                                                    return rendered;
                                                                })()}
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    placeholder="0"
                                                                    className="flex-1 min-w-[60px] bg-transparent border-none outline-none text-right font-mono text-sm focus:ring-0 p-0 h-6"
                                                                    autoFocus={idx === 0}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' || e.key === '+' || e.key === '-') {
                                                                            e.preventDefault();
                                                                            const raw = e.currentTarget.value;
                                                                            if (e.key === '-' && !raw) {
                                                                                e.currentTarget.value = '-';
                                                                                return;
                                                                            }
                                                                            const val = raw.replace(/[^0-9.\-]/g, '');
                                                                            if (val && val !== '-') {
                                                                                const current = declaredValues[item.name] || '';
                                                                                if (current && val.startsWith('-')) {
                                                                                    handleValueChange(item.name, current + val);
                                                                                } else if (current) {
                                                                                    const sep = e.key === '-' ? '-' : '+';
                                                                                    handleValueChange(item.name, current + sep + val);
                                                                                } else {
                                                                                    handleValueChange(item.name, val);
                                                                                }
                                                                                e.currentTarget.value = '';
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-mono font-bold tabular-nums">
                                                            <span className="inline-flex items-center justify-end px-3 py-1 rounded-md bg-primary/10 border border-primary/20 text-sm min-w-[120px]">
                                                                {formatCurrency(cumulative)}
                                                            </span>
                                                        </td>
                                                        <td className={`px-5 py-3 text-right font-bold font-mono tabular-nums ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>
                                                            {Number(diff.toFixed(2)) > 0 ? '+' : ''}{formatCurrency(diff)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {expectedTotals?.list.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                                        No se encontraron formas de pago para este turno.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-muted/90 font-bold border-t-2 border-border">
                                                <td className="px-5 py-3.5 text-right text-sm uppercase tracking-wide font-bold">Totales</td>
                                                <td className="px-5 py-3.5 text-right text-primary font-mono text-base tabular-nums">{formatCurrency(totalExpected)}</td>
                                                <td className="px-5 py-3.5 text-right"></td>
                                                <td className="px-5 py-3.5 text-right text-primary font-mono text-base tabular-nums">{formatCurrency(totalDeclared)}</td>
                                                <td className={`px-5 py-3.5 text-right font-mono text-base tabular-nums ${Math.abs(totalDiff) < 0.05 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {Number(totalDiff.toFixed(2)) > 0 ? '+' : ''}{formatCurrency(totalDiff)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="comment" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Comentarios / Observaciones</Label>
                                    <Textarea
                                        id="comment"
                                        placeholder="Ingrese cualquier observación sobre esta conciliación..."
                                        className="min-h-[80px] text-sm resize-none border-primary/20 focus:border-primary shadow-inner bg-muted/5"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="px-6 pb-6 pt-2 gap-3">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isLoading || !expectedTotals || expectedTotals.list.length === 0} className="min-w-[180px]">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isLoading ? 'Guardando...' : 'Guardar Presentación'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )
                ) : (
                    <>
                        <div className={`px-6 py-10 ${result.isBalanced ? 'bg-emerald-500/5' : 'bg-amber-500/5'}`}>
                            <div className="flex flex-col items-center justify-center space-y-3 text-center max-w-md mx-auto">
                                {result.isBalanced ? (
                                    <>
                                        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <CheckCircle className="h-10 w-10 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">¡Cuadre Perfecto!</p>
                                            <p className="text-sm text-muted-foreground mt-1">Todas las formas de pago coinciden con el sistema.</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                            <AlertTriangle className="h-10 w-10 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">Diferencias Encontradas</p>
                                            <p className="text-sm text-muted-foreground mt-1">Hay discrepancias entre lo declarado y el sistema.</p>
                                        </div>
                                    </>
                                )}
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${Math.abs(result.differences?.total || 0) < 0.05 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                    Diferencia Total: {formatCurrency(result.differences?.total || 0)}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 space-y-1 max-h-[40vh] overflow-y-auto">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Desglose por Forma de Pago</h4>
                            {result.details?.map((d: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-2.5 px-4 rounded-lg hover:bg-muted/30 transition-colors">
                                    <span className="font-medium text-sm">{d.name}</span>
                                    <span className={`text-sm font-mono font-bold ${Math.abs(d.difference) < 0.05 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {Number(d.difference.toFixed(2)) > 0 ? '+' : ''}{formatCurrency(d.difference)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <DialogFooter className="px-6 pb-6 pt-2">
                            <Button type="button" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
                                Entendido
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
