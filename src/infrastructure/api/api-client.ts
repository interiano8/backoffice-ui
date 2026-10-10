import axios from 'axios';

const getBaseURL = () => {
    const { protocol, hostname } = window.location;
    const isIpOrLocal = /^(localhost|127\.0\.0\.1|(\d{1,3}\.){3}\d{1,3})$/.test(hostname);

    // Leer desde runtime config (config.js) o build-time (.env)
    const runtimeConfig = (window as any).__APP_CONFIG__ || {};
    const envUrl  = runtimeConfig.apiUrl  || import.meta.env.VITE_API_URL  || '';
    const apiPort = runtimeConfig.apiPort || import.meta.env.VITE_API_PORT || '3089';

    // 1. Prioridad: Lo que el usuario seleccionó en la pantalla de Login (sessionStorage)
    const storedApiUrl = sessionStorage.getItem('activeApiUrl');
    if (storedApiUrl && storedApiUrl.startsWith('http')) {
        return storedApiUrl;
    }

    // 2. Usar URL de entorno si existe configurada explícitamente (ej: http://localhost:3089)
    if (envUrl && envUrl.length > 5) {
        return envUrl;
    }

    // 3. Acceso LOCAL/IP (LAN) → hostname dinámico + puerto
    if (isIpOrLocal) {
        return `${protocol}//${hostname}:${apiPort}`;
    }

    // 4. Último recurso: Detección automática por subdominio (app -> api)
    return `https://${hostname.replace('app', 'api')}`;
};

/**
 * URL del HUB (matriz). Al autenticarse como usuario de la matriz se debe usar
 * SIEMPRE la URL del hub, sin importar la tienda seleccionada (la tienda solo
 * decide a qué POS operar después del login).
 */
export const getHubURL = (): string => {
    const runtimeConfig = (window as any).__APP_CONFIG__ || {};
    const envUrl  = runtimeConfig.apiUrl  || import.meta.env.VITE_API_URL  || '';
    if (envUrl && envUrl.length > 5) {
        return envUrl.replace(/\/+$/, '');
    }
    const { protocol, hostname } = window.location;
    // Detección automática por subdominio (matriz -> api-matriz)
    return `${protocol}//${hostname.replace('app', 'api')}`.replace(/\/+$/, '');
};

// Crear instancia de axios (sin baseURL fija, se inyecta en cada petición)
const api = axios.create();

const CENTRAL_ROUTES = [
    '/users',
    '/roles',
    '/permissions',
    '/alerts',
    '/tiendas',
    '/stores',
    '/customers',
    '/etl',
    '/payment-methods',
    '/accounting',
    '/transfers',
    '/inventory',
];

// Interceptor para inyectar la URL base dinámica, el token y el x-store-code
api.interceptors.request.use(
    (config) => {
        // Inyectar baseURL dinámicamente si no está definida
        if (!config.baseURL) {
            const isCentralRoute = config.url && CENTRAL_ROUTES.some(route => config.url?.startsWith(route));
            config.baseURL = isCentralRoute ? getHubURL() : getBaseURL();
        }

        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const store = sessionStorage.getItem('selectedStore');
        if (store) {
            try {
                const parsed = JSON.parse(store);
                if (parsed.code && !config.headers['x-store-code']) {
                    config.headers['x-store-code'] = parsed.code;
                }
            } catch {}
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config.url?.includes('/auth/login')) {
            // Sesión expirada
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('selectedStore');
            sessionStorage.removeItem('activeApiUrl');

            // Marcar sesión expirada para que el UI lo muestre como toast
            sessionStorage.setItem('session_expired', 'true');

            // Redirigir a login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
