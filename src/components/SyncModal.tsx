import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useEffect, useRef } from "react"

interface SyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: string[];
  status: 'idle' | 'syncing' | 'completed' | 'error';
}

export function SyncModal({ open, onOpenChange, messages, status }: SyncModalProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const statusBadge = () => {
    switch (status) {
      case 'syncing': return <Badge variant="default" className="animate-pulse">Sincronizando</Badge>;
      case 'completed': return <Badge variant="secondary">Completado</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            Sincronización de Turnos
            {statusBadge()}
          </DialogTitle>
        </DialogHeader>
        {status === 'syncing' && <Progress value={65} className="animate-pulse" />}
        <div ref={logRef} className="bg-muted/50 rounded-lg p-4 max-h-[400px] overflow-auto font-mono text-sm space-y-1.5 leading-relaxed">
          {messages.map((msg, i) => (
            <div key={i} className={`${msg.startsWith('[ERR]') || msg.startsWith('ERR') ? 'text-red-500 font-semibold' : msg.includes('OK') || msg.includes('[OK]') ? 'text-green-500 font-semibold' : 'text-muted-foreground'}`}>
              {msg}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
