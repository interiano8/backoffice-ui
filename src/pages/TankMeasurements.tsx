import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';
import { getAvailableTanks, getTankMeasurements, saveTankMeasurement } from '../services/tank.service';
import { Loader2, Save, Ruler } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils";

interface Measurement {
    id?: string;
    tankId: string;
    gradeName: string;
    height: string;
    volume: string;
    waterLevel: string;
    temperature: string;
}

export const TankMeasurements = () => {
    const { selectedStore, globalDate } = useAppStore();
    // const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]); // Removed local state
    const [shiftNo, setShiftNo] = useState<string>('');
    const [measureType, setMeasureType] = useState<string>('STICK'); // STICK or PROBE
    const [isLoading, setIsLoading] = useState(false);
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [savedMeasurements, setSavedMeasurements] = useState<any[]>([]);

    useEffect(() => {
        const fetchTanks = async () => {
            if (!selectedStore) return;
            try {
                const tanks: { tankId: string; gradeName: string }[] = await getAvailableTanks();

                const initialMeasurements = tanks.map(t => ({
                    tankId: t.tankId,
                    gradeName: t.gradeName,
                    height: '',
                    volume: '',
                    waterLevel: '0',
                    temperature: '0'
                }));
                // Sort by tankId just in case
                initialMeasurements.sort((a, b) => a.tankId.localeCompare(b.tankId, undefined, { numeric: true }));

                setMeasurements(initialMeasurements as Measurement[]);
            } catch (error) {
                toast.error("Error al cargar configuración de tanques");
            }
        };

        fetchTanks();
    }, [selectedStore]);

    const fetchMeasurements = async () => {
        if (!selectedStore || !globalDate) return;
        try {
            setIsLoading(true);
            const data = await getTankMeasurements(globalDate, shiftNo);
            setSavedMeasurements(data || []);
        } catch (error) {
            toast.error('Error al cargar mediciones');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMeasurements();
    }, [globalDate, shiftNo, selectedStore]);

    const handleInputChange = (tankId: string, field: keyof Measurement, value: string) => {
        // Allow only numbers and dots/commas
        const cleanValue = value.replace(/[^0-9.]/g, '');

        setMeasurements(prev => prev.map(m =>
            m.tankId === tankId ? { ...m, [field]: cleanValue } : m
        ));
    };

    const handleSave = async () => {
        if (!selectedStore || !shiftNo) {
            toast.warning('Seleccione un turno');
            return;
        }

        const validMeasurements = measurements.filter(m => m.height && m.volume);
        if (validMeasurements.length === 0) {
            toast.warning('Ingrese al menos una medición con altura y volumen');
            return;
        }

        try {
            setIsLoading(true);
            await Promise.all(validMeasurements.map(m =>
                saveTankMeasurement({
                    shiftDate: globalDate,
                    shiftNo: shiftNo,
                    tankId: m.tankId,
                    measureType,
                    height: parseFloat(m.height),
                    volume: parseFloat(m.volume),
                    waterLevel: parseFloat(m.waterLevel || '0'),
                    temperature: parseFloat(m.temperature || '0')
                })
            ));

            toast.success('Mediciones guardadas correctamente');
            fetchMeasurements();

            // Reset inputs but keep structure
            setMeasurements(prev => prev.map(m => ({
                ...m,
                height: '',
                volume: '',
                waterLevel: '0',
                temperature: '0'
            })));

        } catch (error) {
            toast.error('Error al guardar mediciones');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && measurements.length === 0) {
        return (
            <div className="space-y-6 p-6 animate-in fade-in duration-500">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-start items-center gap-12">
                <h2 className="text-3xl font-bold tracking-tight text-foreground/90">Medición de Tanques</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Ruler className="h-5 w-5" />
                        Registro de Mediciones
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex gap-4 items-end">
                        <div className="space-y-2">
                            {/* Date moved to global header */}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Turno</label>
                            <Input
                                placeholder="Ej: 1"
                                value={shiftNo}
                                onChange={(e) => setShiftNo(e.target.value)}
                                className="w-[100px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Tipo Medición</label>
                            <div className="flex items-center space-x-1 rounded-xl border border-border/60 p-1 bg-muted/30 backdrop-blur-sm w-[180px]">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "flex-1 rounded-lg text-xs font-bold transition-all", 
                                        measureType === 'STICK' ? "bg-card text-primary shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                    )}
                                    onClick={() => setMeasureType('STICK')}
                                >
                                    Vara
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "flex-1 rounded-lg text-xs font-bold transition-all", 
                                        measureType === 'PROBE' ? "bg-card text-primary shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                    )}
                                    onClick={() => setMeasureType('PROBE')}
                                >
                                    Sonda
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[200px] font-bold text-xs uppercase tracking-wider">Tanque</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Altura (pulg)</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Volumen (gls)</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Nivel Agua</TableHead>
                                    {measureType === 'PROBE' && <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Temperatura</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {measurements.map((m) => (
                                    <TableRow key={m.tankId} className="hover:bg-muted/5">
                                        <TableCell className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">Tanque {m.tankId}</span>
                                                <span className="text-[11px] text-muted-foreground font-medium">{m.gradeName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={m.height}
                                                onChange={(e) => handleInputChange(m.tankId, 'height', e.target.value)}
                                                className="w-full font-mono font-bold text-lg text-center bg-muted/10 border-border/40 focus:bg-background transition-all h-11"
                                                placeholder="0.00"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={m.volume}
                                                onChange={(e) => handleInputChange(m.tankId, 'volume', e.target.value)}
                                                className="w-full font-mono font-bold text-lg text-center bg-muted/10 border-border/40 focus:bg-background transition-all h-11"
                                                placeholder="0.00"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={m.waterLevel}
                                                onChange={(e) => handleInputChange(m.tankId, 'waterLevel', e.target.value)}
                                                className="w-full font-mono font-medium text-lg text-center bg-muted/10 border-border/40 focus:bg-background transition-all h-11"
                                                placeholder="0.00"
                                            />
                                        </TableCell>
                                        {measureType === 'PROBE' && (
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={m.temperature}
                                                    onChange={(e) => handleInputChange(m.tankId, 'temperature', e.target.value)}
                                                    className="w-full font-mono font-medium text-lg text-center bg-muted/10 border-border/40 focus:bg-background transition-all h-11"
                                                    placeholder="0.00"
                                                />
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isLoading} className="w-[200px]">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Mediciones
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {savedMeasurements.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Mediciones (Fecha Seleccionada)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Turno</TableHead>
                                    <TableHead>Tanque</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Altura</TableHead>
                                    <TableHead>Volumen</TableHead>
                                    <TableHead>Agua</TableHead>
                                    <TableHead>Temp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {savedMeasurements.map((sm: any) => (
                                    <TableRow key={sm.id}>
                                        <TableCell>{new Date(new Date(sm.shiftDate).getTime() + new Date(sm.shiftDate).getTimezoneOffset() * 60000).toLocaleDateString('es-HN')}</TableCell>
                                        <TableCell>{sm.shiftNo}</TableCell>
                                        <TableCell>Tanque {sm.tankId}</TableCell>
                                        <TableCell>{sm.measureType === 'STICK' ? 'Vara' : 'Sonda'}</TableCell>
                                        <TableCell className="font-bold">{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(Number(sm.height))}</TableCell>
                                        <TableCell className="font-bold">{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(Number(sm.volume))}</TableCell>
                                        <TableCell>{sm.waterLevel}</TableCell>
                                        <TableCell>{sm.temperature || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
