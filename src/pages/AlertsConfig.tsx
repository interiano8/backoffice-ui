import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Mail, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Plus, 
  Loader2,
  Save,
  ServerOff
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getAlertConfig, 
  updateAlertConfig, 
  sendTestAlert, 
  AlertConfig 
} from '../services/alerts.service';

export const AlertsConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form state
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [cashVarianceThreshold, setCashVarianceThreshold] = useState<number>(50);
  const [shiftDiscrepancyEnabled, setShiftDiscrepancyEnabled] = useState(true);
  const [fiscalGapEnabled, setFiscalGapEnabled] = useState(true);
  const [offlineStoreEnabled, setOfflineStoreEnabled] = useState(true);
  const [offlineMinutesThreshold, setOfflineMinutesThreshold] = useState<number>(15);
  const [cooldownMinutes, setCooldownMinutes] = useState<number>(60);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const config: AlertConfig = await getAlertConfig();
      setAlertsEnabled(config.alertsEnabled ?? true);
      setRecipientEmails(config.recipientEmails || []);
      setCashVarianceThreshold(Number(config.cashVarianceThreshold) || 50);
      setShiftDiscrepancyEnabled(config.shiftDiscrepancyEnabled ?? true);
      setFiscalGapEnabled(config.fiscalGapEnabled ?? true);
      setOfflineStoreEnabled(config.offlineStoreEnabled ?? true);
      setOfflineMinutesThreshold(Number(config.offlineMinutesThreshold) || 15);
      setCooldownMinutes(Number(config.cooldownMinutes) || 60);
      if (config.updatedAt) setUpdatedAt(config.updatedAt);
    } catch (err: any) {
      toast.error('Error al cargar la configuración de alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Por favor ingrese un correo electrónico válido');
      return;
    }

    if (recipientEmails.includes(email)) {
      toast.warning('Este correo ya está en la lista de destinatarios');
      return;
    }

    setRecipientEmails([...recipientEmails, email]);
    setNewEmail('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setRecipientEmails(recipientEmails.filter((e) => e !== emailToRemove));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateAlertConfig({
        alertsEnabled,
        recipientEmails,
        cashVarianceThreshold: Number(cashVarianceThreshold),
        shiftDiscrepancyEnabled,
        fiscalGapEnabled,
        offlineStoreEnabled,
        offlineMinutesThreshold: Number(offlineMinutesThreshold),
        cooldownMinutes: Number(cooldownMinutes),
      });

      setAlertsEnabled(updated.alertsEnabled);
      setRecipientEmails(updated.recipientEmails);
      setCashVarianceThreshold(Number(updated.cashVarianceThreshold));
      if (updated.updatedAt) setUpdatedAt(updated.updatedAt);

      toast.success('Configuración de alertas guardada exitosamente');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (recipientEmails.length === 0) {
      toast.warning('Debe agregar al menos un correo destinatario para la prueba');
      return;
    }

    try {
      setTesting(true);
      const res = await sendTestAlert();
      if (res.success) {
        if (res.simulated) {
          toast.info('Correo de prueba simulado (modo dry-run sin API key real)');
        } else {
          toast.success(`Correo de diagnóstico enviado vía Brevo (ID: ${res.messageId || 'OK'})`);
        }
      } else {
        toast.error(`Error enviando correo: ${res.error || 'Fallo desconocido'}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar correo de prueba');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando configuración de alertas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Configuración de Alertas y Notificaciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administre las reglas de notificación proactiva, umbrales de arqueo y correos receptores para Brevo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSendTest}
            disabled={testing || recipientEmails.length === 0}
            className="flex items-center gap-2"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-primary" />}
            <span>Enviar Correo de Prueba</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Guardar Configuración</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Izquierda: Switch Maestro y Destinatarios */}
        <div className="md:col-span-1 space-y-6">
          {/* Card: Estado Maestro */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className={`h-5 w-5 ${alertsEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                Estado Maestro del Sistema
              </CardTitle>
              <CardDescription>
                Habilita o pausa todo el despacho de correos en la red.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/40">
                <div>
                  <span className="font-medium text-sm">
                    {alertsEnabled ? 'Sistema Activo' : 'Sistema Silenciado'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {alertsEnabled ? 'Los correos se despachan con normalidad' : 'No se emitirá ningún correo'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={alertsEnabled}
                  onChange={(e) => setAlertsEnabled(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              </div>
              {updatedAt && (
                <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Última actualización: {new Date(updatedAt).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card: Destinatarios */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Destinatarios Registrados
              </CardTitle>
              <CardDescription>
                Correos que recibirán los informes de discrepancias y auditoría.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddEmail} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="text-sm"
                />
                <Button type="submit" size="sm" variant="secondary" className="px-3">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>

              <div className="flex flex-wrap gap-1.5 min-h-[60px] p-2 rounded-md bg-muted/20 border border-border/30">
                {recipientEmails.length === 0 ? (
                  <span className="text-xs text-muted-foreground self-center italic">
                    Sin destinatarios. Agregue correos arriba.
                  </span>
                ) : (
                  recipientEmails.map((email) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="flex items-center gap-1.5 text-xs py-1 px-2.5 bg-card border border-border/60"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="hover:text-destructive transition-colors ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Reglas y Conmutadores Específicos */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Reglas y Conmutadores de Activación
              </CardTitle>
              <CardDescription>
                Active o desactive independientemente los tipos de alertas operativas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 1. Descuadre de Turno */}
              <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Alerta por Descuadre de Turno</h3>
                      <p className="text-xs text-muted-foreground">
                        Notifica cuando un turno finaliza con descuadre significativo.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={shiftDiscrepancyEnabled}
                    onChange={(e) => setShiftDiscrepancyEnabled(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <Label htmlFor="threshold" className="text-xs font-medium">
                      Umbral Mínimo de Descuadre (Lempiras)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Solo alertar si |descuadre| es mayor o igual a este monto.
                    </p>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">L.</span>
                    <Input
                      id="threshold"
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashVarianceThreshold}
                      onChange={(e) => setCashVarianceThreshold(parseFloat(e.target.value) || 0)}
                      className="pl-8 text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Salto Fiscal SAR */}
              <div className="p-4 rounded-xl border border-border/60 bg-card/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-600/10 text-red-600">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Alerta Crítica: Salto Fiscal SAR</h3>
                    <p className="text-xs text-muted-foreground">
                      Notificación urgente ante folios de facturas omitidos en lotes sincronizados.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={fiscalGapEnabled}
                  onChange={(e) => setFiscalGapEnabled(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {/* 3. Desconexión de Estación */}
              <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                      <ServerOff className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Alerta por Desconexión Prolongada</h3>
                      <p className="text-xs text-muted-foreground">
                        Notifica si una estación activa no reporta latidos tras un límite de tiempo.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={offlineStoreEnabled}
                    onChange={(e) => setOfflineStoreEnabled(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="offlineMinutes" className="text-xs font-medium">
                      Minutos sin Contacto
                    </Label>
                    <Input
                      id="offlineMinutes"
                      type="number"
                      min="1"
                      value={offlineMinutesThreshold}
                      onChange={(e) => setOfflineMinutesThreshold(parseInt(e.target.value, 10) || 15)}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cooldown" className="text-xs font-medium">
                      Tiempo de Enfriamiento (Minutos)
                    </Label>
                    <Input
                      id="cooldown"
                      type="number"
                      min="1"
                      value={cooldownMinutes}
                      onChange={(e) => setCooldownMinutes(parseInt(e.target.value, 10) || 60)}
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t border-border/40 px-6 py-3 flex justify-between items-center text-xs text-muted-foreground">
              <span>Los cambios surten efecto inmediato sin reiniciar los servidores.</span>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Aplicar Cambios'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
