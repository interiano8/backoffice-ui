import { useEffect, useState, lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from './lib/motion';

const Reconciliation = lazy(() => import('./pages/Reconciliation').then(m => ({ default: m.Reconciliation })));
const LealInvoices = lazy(() => import('./pages/LealInvoices').then(m => ({ default: m.LealInvoices })));
const HosePrices = lazy(() => import('./pages/HosePrices').then(m => ({ default: m.HosePrices })));
const CustomerStatements = lazy(() => import('./pages/CustomerStatements').then(m => ({ default: m.CustomerStatements })));
const SalesDeclaration = lazy(() => import('./pages/SalesDeclaration').then(m => ({ default: m.SalesDeclaration })));
const CtrlSales = lazy(() => import('./pages/CtrlSales').then(m => ({ default: m.CtrlSales })));
const Documents = lazy(() => import('./pages/Documents'));
const Customers = lazy(() => import('./pages/Customers'));
const HomePage = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const TankMeasurements = lazy(() => import('./pages/TankMeasurements').then(m => ({ default: m.TankMeasurements })));
const UsersPage = lazy(() => import('./pages/Users').then(m => ({ default: m.UsersPage })));
const StoresPage = lazy(() => import('./pages/Stores').then(m => ({ default: m.StoresPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const AlertsConfigPage = lazy(() => import('./pages/AlertsConfig').then(m => ({ default: m.AlertsConfigPage })));
const AccountingPage = lazy(() => import('./pages/Accounting').then(m => ({ default: m.AccountingPage })));
import { AlertsBell } from './components/AlertsBell';
import { PageLoader } from './components/PageLoader';

import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuthStore';

import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import './globals.css';

function useInitializeAccent() {
  useEffect(() => {
    const savedAccent = localStorage.getItem("theme-accent");
    if (savedAccent) {
      try {
        const accent = JSON.parse(savedAccent);
        const root = window.document.documentElement;
        root.style.setProperty("--accent-h", accent.h);
        root.style.setProperty("--accent-s", accent.s);
        root.style.setProperty("--accent-l", accent.l);
      } catch (_) {
      }
    }
  }, []);
}

import { Button } from "@/components/ui/button"
import { 
  GitCompare, 
  ClipboardList, 
  BarChart3, 
  Activity, 
  Files,
  LogOut, 
  Menu, 
  UserCircle,
  UserCog,
  ShieldCheck, 
  Home as HomeIcon,
  Users,
  Receipt,
  Coins,
  Building2,
  Bell,
  BookOpen,
} from 'lucide-react';
import { cn } from "@/lib/utils"
import { Toaster } from 'sonner';
import { Input } from "@/components/ui/input"
import { ThemeAccentSelector } from "@/components/ThemeAccentSelector";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Layout Component
const Layout = ({ children }: { children: ReactNode }) => {
  const { logout, user } = useAuthStore();
  const { globalDate, setGlobalDate, getStores, stores, selectedStore, setSelectedStore } = useAppStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    getStores();
  }, [getStores]);

  // Actualización dinámica del Título del Navegador
  useEffect(() => {
    if (selectedStore) {
      document.title = `${selectedStore.name} - BackOffice`;
    } else {
      document.title = 'BCPOS - BackOffice';
    }
  }, [selectedStore]);

  const navItems = [
    { path: '/inicio', label: 'Inicio', icon: HomeIcon },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/reconciliation', label: 'Conciliacion', icon: GitCompare },
    { path: '/reports', label: 'Estado de cuenta', icon: ClipboardList },
    { path: '/sales-declaration', label: 'Declaracion de ventas', icon: Receipt },
    { path: '/leal', label: 'Leal', icon: Coins },
    { path: '/ctrl', label: 'CTRL', icon: Activity },
    { path: '/documents', label: 'Documentos', icon: Files },
    { path: '/contabilidad', label: 'Contabilidad', icon: BookOpen },
    { path: '/tiendas', label: 'Tiendas', icon: Building2 },
    { path: '/users', label: 'Usuarios', icon: UserCog },
    { path: '/customers', label: 'Clientes', icon: Users },
    { path: '/alertas', label: 'Alertas', icon: Bell },
  ].filter(item => {
    if (item.path === '/customers') {
      return selectedStore?.moduleCustomers !== 0;
    }
    if (item.path === '/contabilidad') {
      if (selectedStore?.code === 'GLOBAL') {
        return stores.length === 0 || stores.some(s => s.moduleAccounting !== 0);
      }
      return selectedStore?.moduleAccounting !== 0;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden print:block print:overflow-visible">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-card border-r border-border/60 flex flex-col transition-all duration-300 z-20 shadow-xl shadow-foreground/5 print:hidden",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className={cn(
          "p-3 space-y-3 transition-all duration-300 border-b border-border/60 bg-card/80 backdrop-blur-sm",
          sidebarOpen ? "h-auto" : "h-16 flex items-center justify-center p-0"
        )}>
          {sidebarOpen ? (
            <>
              {/* Primer "Cuadrante": Logo y Botón de Menú */}
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 h-14 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center p-1 overflow-hidden transition-all hover:bg-muted/60">
                   {selectedStore?.logoUrl ? (
                     <img 
                       src={selectedStore.logoUrl} 
                       className="h-full w-full object-contain" 
                       alt="Logo" 
                     />
                   ) : (
                     <ShieldCheck className="h-6 w-6 text-primary" />
                   )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(prev => !prev)}
                  className="h-10 w-10 hover:bg-primary/10 hover:text-primary shrink-0"
                  aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
                >
                  <Menu className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" aria-hidden="true" />
                </Button>
              </div>

              {/* Segundo "Cuadrante": Nombre completo de la Estación */}
              <div className="w-full px-1 flex flex-col items-center justify-center">
                 <h2 className="text-xl font-black tracking-tighter text-foreground uppercase animate-in zoom-in-95 duration-500 text-center leading-[1] [word-break:break-word]">
                    {selectedStore?.name || 'BackOffice'}
                 </h2>
                 <div className="w-12 h-1 bg-primary/20 rounded-full mt-2" />
              </div>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(prev => !prev)}
              className="h-12 w-12 hover:bg-primary/10 transition-all group p-1"
              aria-label="Abrir menú"
            >
              {selectedStore?.logoUrl ? (
                <img src={selectedStore.logoUrl} className="h-full w-full object-contain rounded-lg shadow-md group-hover:scale-110 transition-transform" alt="Logo" />
              ) : (
                <Menu className="h-6 w-6 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
              )}
            </Button>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1.5 pt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start transition-all duration-200 group h-10",
                    !sidebarOpen && "justify-center px-0",
                    isActive 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 min-w-[20px] transition-transform group-hover:scale-110", 
                    sidebarOpen && "mr-3"
                  )} />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className={cn(
          "px-4 py-2 flex items-center border-t border-border/40 bg-muted/5",
          sidebarOpen ? "justify-around" : "flex-col gap-2"
        )}>
          <ThemeAccentSelector />
          <ModeToggle />
        </div>

        <div className="p-4 border-t border-border/60 bg-muted/20">
          <div className={cn("flex items-center gap-3 p-1 rounded-xl transition-colors hover:bg-muted/30", !sidebarOpen && "flex-col")}>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate leading-none mb-1 text-foreground">{user?.username || 'Usuario'}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold truncate opacity-60">
                   {user?.role || 'Administrador'}
                </p>
              </div>
            )}
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout} 
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shadow-none border-none"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        <header className="h-16 border-b border-border/60 bg-card/60 backdrop-blur-md px-6 flex items-center justify-between z-10 shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold tracking-tight text-foreground/90 capitalize">
              {navItems.find(i => i.path === location.pathname)?.label || 'Panel'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Store Switcher */}
            <div className="flex items-center gap-2 bg-muted/30 p-1 px-3 rounded-lg border border-border/40">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:inline">Tienda</span>
              <select
                className="bg-transparent border-none text-xs sm:text-sm font-bold text-foreground focus:outline-none cursor-pointer"
                value={selectedStore?.code === 'GLOBAL' ? 'GLOBAL' : (selectedStore?.id || selectedStore?.code || '')}
                onChange={(e) => {
                  if (e.target.value === 'GLOBAL') {
                    setSelectedStore({
                      id: 'GLOBAL',
                      code: 'GLOBAL',
                      name: 'TODA LA RED (GLOBAL)',
                      ip: '127.0.0.1',
                      isActive: true,
                    });
                  } else {
                    const store = stores.find(s => s.id === e.target.value || s.code === e.target.value);
                    if (store) setSelectedStore(store);
                  }
                }}
              >
                <option value="GLOBAL" className="bg-card text-foreground font-bold">
                  🏢 TODA LA RED (GLOBAL)
                </option>
                {stores.map((s) => (
                  <option key={s.id || s.code} value={s.id || s.code} className="bg-card text-foreground">
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Global Date Picker (for relevant pages) */}
            {['/reconciliation', '/sales-declaration', '/reports', '/ctrl'].includes(location.pathname) && (
              <div className="flex items-center gap-2 bg-muted/30 p-1 px-2 rounded-lg border border-border/40">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:inline ml-1">Fecha</span>
                <Input
                  type="date"
                  value={globalDate}
                  onChange={(e) => setGlobalDate(e.target.value)}
                  className="w-[130px] h-8 bg-transparent border-none shadow-none focus-visible:ring-0 px-2 font-mono text-xs sm:text-sm font-bold"
                />
              </div>
            )}

            {/* Campana de Alertas Operativas */}
            <AlertsBell />
          </div>
        </header>
        <div className={cn("flex-1 p-6 bg-muted/10 print:overflow-visible print:h-auto print:p-0", location.pathname === '/reconciliation' ? 'overflow-hidden' : 'overflow-auto')}>
          {children}
        </div>
      </main>
    </div>
  )
}

function RequireStore({ children }: { children: ReactNode }) {
  const { selectedStore } = useAppStore();
  const isGlobal = !selectedStore || selectedStore.code === 'GLOBAL' || selectedStore.code === '000';
  if (isGlobal) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold">Seleccione una tienda</h2>
          <p className="text-muted-foreground">
            Esta sección necesita una sucursal activa. Elíjala en el selector superior.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="h-full"
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Navigate to="/inicio" replace />} />
            <Route path="/inicio" element={<RequireStore><HomePage /></RequireStore>} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reconciliation" element={<RequireStore><Reconciliation /></RequireStore>} />
            <Route path="/leal" element={<RequireStore><LealInvoices /></RequireStore>} />
            <Route path="/reports" element={<RequireStore><CustomerStatements /></RequireStore>} />
            <Route path="/sales-declaration" element={<RequireStore><SalesDeclaration /></RequireStore>} />
            <Route path="/ctrl" element={<RequireStore><CtrlSales /></RequireStore>} />
            <Route path="/tank-measurements" element={<RequireStore><TankMeasurements /></RequireStore>} />
            <Route path="/documents" element={<RequireStore><Documents /></RequireStore>} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/hose-prices" element={<RequireStore><HosePrices /></RequireStore>} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/tiendas" element={<StoresPage />} />
            <Route path="/alertas" element={<AlertsConfigPage />} />
            <Route path="/contabilidad" element={<AccountingPage />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  useInitializeAccent();
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="print:hidden">
        <Toaster position="top-right" richColors closeButton />
      </div>
      <Router>
        <Routes>
          <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <AnimatedRoutes />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
