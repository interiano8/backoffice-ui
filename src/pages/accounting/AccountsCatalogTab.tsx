import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  FolderTree, 
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { accountingService, AccountItem } from '../../services/accounting.service';

export const AccountsCatalogTab: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal crear cuenta
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('ASSET');
  const [nature, setNature] = useState('DEBIT');
  const [parentId, setParentId] = useState<string>('');
  const [allowsMovement, setAllowsMovement] = useState(true);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await accountingService.getAccounts({
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        search: search.trim() || undefined,
      });
      setAccounts(data);
    } catch (err: any) {
      toast.error('Error cargando catálogo de cuentas: ' + (err.message || 'Error de conexión'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAccounts();
  };

  const handleCreateAccount = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error('Código y nombre son obligatorios');
      return;
    }

    setCreating(true);
    try {
      let level = 1;
      if (parentId) {
        const parent = accounts.find((a) => a.id === parentId);
        if (parent) level = parent.level + 1;
      } else {
        const segments = code.split('.').length;
        level = Math.min(5, Math.max(1, segments));
      }

      await accountingService.createAccount({
        code: code.trim(),
        name: name.trim(),
        type,
        nature,
        level,
        parentId: parentId || undefined,
        allowsMovement,
      });

      toast.success('Cuenta contable creada exitosamente');
      setCreateOpen(false);
      resetForm();
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al crear cuenta');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setName('');
    setType('ASSET');
    setNature('DEBIT');
    setParentId('');
    setAllowsMovement(true);
  };

  const getTypeBadge = (t: string) => {
    switch (t) {
      case 'ASSET': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Activo</Badge>;
      case 'LIABILITY': return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Pasivo</Badge>;
      case 'EQUITY': return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">Patrimonio</Badge>;
      case 'REVENUE': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Ingreso</Badge>;
      case 'COST': return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Costo</Badge>;
      case 'EXPENSE': return <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/30">Gasto</Badge>;
      default: return <Badge variant="outline">{t}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de control y filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código o nombre de cuenta..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Buscar
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="ALL">Todas las Clases</option>
            <option value="ASSET">Activo</option>
            <option value="LIABILITY">Pasivo</option>
            <option value="EQUITY">Patrimonio</option>
            <option value="REVENUE">Ingresos</option>
            <option value="COST">Costos</option>
            <option value="EXPENSE">Gastos</option>
          </select>

          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Cuenta
          </Button>
        </div>
      </div>

      {/* Tabla del Catálogo */}
      <Card className="overflow-hidden border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre de la Cuenta</th>
                <th className="px-4 py-3">Clase</th>
                <th className="px-4 py-3">Naturaleza</th>
                <th className="px-4 py-3 text-center">Nivel</th>
                <th className="px-4 py-3 text-center">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground">
                    Cargando catálogo contable...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground">
                    No se encontraron cuentas contables.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => {
                  const paddingLeft = (acc.level - 1) * 20;
                  const isMajor = !acc.allowsMovement;

                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        acc.level === 1 ? 'bg-muted/30 font-bold' : ''
                      } ${acc.level === 2 ? 'font-semibold' : ''}`}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">
                        <span style={{ paddingLeft: `${paddingLeft}px` }} className="inline-flex items-center gap-1.5">
                          {isMajor ? (
                            <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Hash className="h-3.5 w-3.5 text-primary" />
                          )}
                          <span className={isMajor ? 'text-foreground' : 'text-foreground/90'}>
                            {acc.code}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={isMajor ? 'uppercase tracking-wide' : ''}>
                          {acc.name}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {getTypeBadge(acc.type)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {acc.nature === 'DEBIT' ? 'Deudora (+)' : 'Acreedora (-)'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-xs font-mono text-muted-foreground">N{acc.level}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {acc.allowsMovement ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                            Imputable
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                            Mayor
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Crear Cuenta */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Cuenta Contable</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Cuenta Padre (Opcional)</label>
              <select
                value={parentId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setParentId(pid);
                  if (pid) {
                    const p = accounts.find((a) => a.id === pid);
                    if (p) {
                      setType(p.type);
                      setNature(p.nature);
                    }
                  }
                }}
                className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">(Sin padre / Nivel 1 Principal)</option>
                {accounts
                  .filter((a) => a.level <= 3)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Código de Cuenta</label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ej. 1.1.01.05"
                  className="font-mono mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Clase</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="ASSET">Activo</option>
                  <option value="LIABILITY">Pasivo</option>
                  <option value="EQUITY">Patrimonio</option>
                  <option value="REVENUE">Ingresos</option>
                  <option value="COST">Costos</option>
                  <option value="EXPENSE">Gastos</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Nombre de la Cuenta</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Banco Atlántida HNL"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Naturaleza</label>
                <select
                  value={nature}
                  onChange={(e) => setNature(e.target.value)}
                  className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="DEBIT">Deudora</option>
                  <option value="CREDIT">Acreedora</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={allowsMovement}
                    onChange={(e) => setAllowsMovement(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary"
                  />
                  <span className="text-xs font-medium">Acepta Movimientos</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAccount} disabled={creating}>
              {creating ? 'Guardando...' : 'Crear Cuenta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
