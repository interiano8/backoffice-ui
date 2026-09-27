import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_STORE, useAppStore } from '../store/useAppStore';
import type { Store } from '../types/api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@radix-ui/react-label"
import { Cloud, Server, MapPin, ExternalLink, Eye, EyeOff } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../lib/motion';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [redirectModalOpen, setRedirectModalOpen] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [pendingRedirectStore, setPendingRedirectStore] = useState<Store | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuthStore();
    const { getStores, stores, selectedStore, setSelectedStore, isLocalMode } = useAppStore();
    const navigate = useNavigate();

    useEffect(() => {
        getStores();
        const savedUser = localStorage.getItem('remembered_username');
        if (savedUser) {
            setUsername(savedUser);
            setRememberMe(true);
        }
    }, []);

    useEffect(() => {
        // No se auto-selecciona tienda en el login: el usuario entra al HUB de la
        // matriz y elige la tienda después. Solo se limpia la guardada si no existe.
        const saved = sessionStorage.getItem('selectedStore');
        if (!saved) {
            sessionStorage.removeItem('activeApiUrl');
        }
    }, []);

    const handleStoreSelect = (store: Store) => {
        if (store.code === 'GLOBAL' || store.code === '000') {
            setSelectedStore(GLOBAL_STORE);
            setError('');
            return;
        }
        if (store.isLocalStore === true) {
            setSelectedStore(store);
            setError('');
        } else if (store.frontendUrl) {
            setPendingRedirectStore(store);
            setRedirectModalOpen(true);
        } else {
            setSelectedStore(store);
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStore) { setError('Debe seleccionar una tienda'); return; }
        setError('');
        setLoading(true);
        try {
            const success = await login(username, password);
            if (success) {
                if (rememberMe) localStorage.setItem('remembered_username', username);
                else localStorage.removeItem('remembered_username');
                // El HUB de la matriz: tras login se va a la vista global de tiendas.
                navigate('/tiendas');
            }
        } catch (error: any) {
            if (error?.message === 'NETWORK_ERROR') {
                setError('No se puede conectar al servidor. Verifica que el backend esté corriendo en el puerto correcto.');
            } else if (error?.message === 'UNAUTHORIZED') {
                setError('El usuario o la contraseña son incorrectos.');
            } else if (error?.message) {
                setError(error.message);
            } else {
                setError('Error de conexión. Intente de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="w-full max-w-md relative z-10"
            >
                <motion.div variants={fadeUp}>
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 rounded-2xl blur-xl opacity-50" />
                        <Card className="relative border-border/50 shadow-2xl shadow-primary/10 backdrop-blur-sm bg-card/95">
                        <div className="flex flex-col items-center pt-10 pb-4 px-6 text-center">
                            <motion.div
                                key={selectedStore?.id || 'default'}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                                className="w-24 h-24 rounded-2xl bg-primary/5 border border-primary/10 mb-5 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/5"
                            >
                                {selectedStore?.logoUrl ? (
                                    <img src={selectedStore.logoUrl} alt={selectedStore.name} className="w-full h-full object-contain p-3" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary/60">
                                        <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                                    </svg>
                                )}
                            </motion.div>
                            <h1 className="text-2xl font-bold tracking-tight">BackOffice BCPOS</h1>
                            <p className="text-sm text-muted-foreground mt-1.5">Ingrese sus credenciales</p>
                        </div>
                        <CardContent className="p-6 pt-2">

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-start gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="store" className="text-sm font-medium flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                        Tienda / Sucursal
                                    </Label>
                                    <div className="relative">
                                        <select
                                            id="store"
                                            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 appearance-none"
                                            value={selectedStore?.id || (selectedStore?.code === 'GLOBAL' ? 'GLOBAL' : '')}
                                            onChange={(e) => {
                                                const store = stores.find(s => s.id === e.target.value || s.code === e.target.value);
                                                if (store) handleStoreSelect(store);
                                                else if (e.target.value === 'GLOBAL') handleStoreSelect(GLOBAL_STORE);
                                            }}
                                            required
                                        >
                                            <option value="" disabled>Seleccione una tienda</option>
                                            <option value="GLOBAL">🏢 {GLOBAL_STORE.name}</option>
                                            {stores.map((store: Store) => (
                                                <option key={store.id} value={store.id}>
                                                    {store.code} - {store.name}{store.isLocalStore ? ' (Local)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                                            {isLocalMode ? (
                                                <Server className="w-3.5 h-3.5 text-emerald-500" />
                                            ) : (
                                                <Cloud className="w-3.5 h-3.5 text-primary" />
                                            )}
                                            <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-sm font-medium">Usuario</Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Ej. JPEREZ"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toUpperCase())}
                                        required
                                        autoComplete="username"
                                        className="h-10 rounded-lg uppercase transition-all focus-visible:ring-offset-0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                            className="h-10 rounded-lg pr-10 transition-all focus-visible:ring-offset-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary"
                                    />
                                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        Recordar mi usuario
                                    </span>
                                </label>

                                <Button type="submit" className="w-full h-10 rounded-lg font-semibold" disabled={loading}>
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Validando...
                                        </span>
                                    ) : 'Ingresar al Sistema'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    </div>
                </motion.div>

                <motion.p variants={fadeUp} className="text-center text-xs text-muted-foreground mt-6">
                    © 2026 BackOffice BCPOS
                </motion.p>
            </motion.div>

            <Dialog open={redirectModalOpen} onOpenChange={setRedirectModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ExternalLink className="h-5 w-5 text-primary" />
                            Tienda Externa
                        </DialogTitle>
                        <DialogDescription>
                            {pendingRedirectStore?.name} tiene su propio sistema.
                            Serás redirigido a su frontend.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg border">
                        <div className="text-center space-y-1">
                            <p className="font-semibold">{pendingRedirectStore?.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{pendingRedirectStore?.code}</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRedirectModalOpen(false)}>Cancelar</Button>
                        <Button onClick={() => { if (pendingRedirectStore?.frontendUrl) window.location.href = pendingRedirectStore.frontendUrl; setRedirectModalOpen(false); }} className="gap-2">
                            <ExternalLink className="h-4 w-4" /> Ir a {pendingRedirectStore?.name}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
