# 🎨 Guía de Despliegue Individual - BackOffice UI

Esta guía explica cómo compilar y desplegar el Frontend de forma individual.

## ⚠️ IMPORTANTE: Tiempo de Compilación
A diferencia del backend, las variables del Frontend **DEBEN configurarse ANTES** de ejecutar el comando `npm run build`. Si cambias la URL de la API después, tendrás que volver a compilar.

## ⚙️ Configuración (.env)
Asegúrate de tener un archivo `.env` en la carpeta `backoffice-ui/` con los siguientes valores:

```ini
# --- CONFIGURACIÓN OBLIGATORIA PARA EL FRONTEND ---

# La URL completa de la API (Backend) a la que debe conectarse
# ¡Cuidado! No pongas localhost si es para producción
VITE_API_URL=https://tu-api-real.com

# La URL donde estará alojado este mismo Frontend
VITE_UI_URL=https://tu-backoffice-ui.com
```

## 🛠️ Comandos de Despliegue

### Paso 1: Instalación de dependencias
```bash
npm install
```

### Paso 2: Generar la Carpeta de Producción
```bash
npm run build
```
Este comando creará una carpeta llamada `dist/`.

### Paso 3: Servir los archivos
La carpeta `dist/` contiene archivos estáticos (HTML, JS, CSS). No los puedes abrir haciendo doble clic; necesitas un servidor web:

*   **Opción A (Nginx/IIS/Apache):** Copia el contenido de `dist/` a la carpeta raíz de tu servidor web.
    *   *Nota:* Asegúrate de configurar el servidor para que todas las rutas apunten a `index.html` (Manejo de rutas de React).
*   **Opción B (Node con Serve):**
    ```bash
    npm install -g serve
    serve -s dist
    ```

## 📝 Resumen de Variables Front
| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `VITE_API_URL` | Dirección pública de la API | `https://api.bcpos.space` |
| `VITE_UI_URL` | Dirección donde vive el Front | `https://pista.bcpos.space` |
