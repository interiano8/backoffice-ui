import type { Store } from "../types/api";

/**
* 🚩 LISTA DE TIENDAS/ESTACIONES
* Configuración por defecto de tiendas para el punto de venta.
* Se sincroniza automáticamente con la base de datos central bo-prisma.
*/
export const STATIC_STORES: Store[] = [
    {
        id: 'df6c6bf3-6870-4f38-94b7-73baada6049b',
        code: '001',
        name: 'ESTACION EL RECREO',
        ip: '127.0.0.1',
        apiUrl: 'http://localhost:3089',
        lanUrl: 'http://localhost:3089',
        logoUrl: '/rapi.png',
        isActive: true,
        RTN: '06019995197170',
        address: 'Barrio El Recreo, Tegucigalpa',
        showDetailsInStatement: true,
        moduleCustomers: 1,
        SyncMinutes: 300,
        PresentationMinutes: 30,
    }
];
