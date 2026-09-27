import React from 'react';
import { useAppStore } from '../store/useAppStore';
import {
    Building2,
    MapPin,
    Fingerprint,
    ShieldCheck,
    Store as StoreIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";

export const Home: React.FC = () => {
    const { selectedStore, user } = useAppStore();

    if (!selectedStore) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="text-center space-y-4">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-full" />
                        <div className="h-4 w-48 bg-muted rounded" />
                    </div>
                    <p className="text-muted-foreground animate-pulse">Cargando información de sucursal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Bienvenida */}
            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight text-foreground">
                    ¡Bienvenido, <span className="text-primary">{user?.name || user?.username}</span>!
                </h1>
                <p className="text-muted-foreground text-lg">
                    Has ingresado al panel de administración de sucursal.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card Principal de la Estación */}
                <Card className="col-span-1 md:col-span-2 shadow-2xl border-primary/10 bg-gradient-to-br from-card to-primary/5 overflow-hidden group">
                    <CardHeader className="relative pb-0">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <StoreIcon className="w-32 h-32 rotate-12" />
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                <ShieldCheck className="h-8 w-8 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black tracking-tight uppercase italic italic">
                                    {selectedStore.titulo || 'BCPOS BACKOFFICE'}
                                </CardTitle>
                                <p className="text-primary font-bold tracking-widest text-xs uppercase opacity-80">
                                    Sucursal de Servicio Activa
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 relative">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex gap-4 items-start">
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <Building2 className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Nombre Comercial</p>
                                        <p className="text-lg font-semibold">{selectedStore.name}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Dirección Física</p>
                                        <p className="text-sm font-medium leading-relaxed max-w-xs">
                                            {selectedStore.address || 'Dirección no registrada en sistema'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 text-sm">
                                <div className="grid grid-cols-1 gap-4 bg-muted/20 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Fingerprint className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-tighter">ID Sucursal</span>
                                        </div>
                                        <Badge variant="secondary" className="font-mono">{selectedStore.code}</Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-tighter">RTN</span>
                                        </div>
                                        <span className="font-mono font-bold">{selectedStore.RTN || 'NO DISPONIBLE'}</span>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logo o Imagen de la tienda */}
            <div className="flex justify-center pt-8">
                <div className="relative group grayscale hover:grayscale-0 transition-all duration-700 opacity-40 hover:opacity-100">
                    <img
                        src={selectedStore.logoUrl || "/store.jpg"}
                        alt="Logo Sucursal"
                        className="h-24 w-auto object-contain"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                </div>
            </div>
        </div>
    );
};

