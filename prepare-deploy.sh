#!/bin/bash

# Script para preparar el despliegue individual de BackOffice UI (Frontend)
# Eres arquitecto de software - Generando paquete estático optimizado

echo "🚀 Iniciando preparación del despliegue del Frontend..."

# 1. Limpieza de versiones previas
echo "🧹 Limpiando compilaciones anteriores..."
rm -rf dist
rm -rf deploy-ui
rm -f backoffice-ui-deploy.zip

# 2. Instalación de dependencias (para el build)
echo "📦 Instalando dependencias de compilación..."
npm install

# 3. Compilación de la aplicación
echo "🏗️ Compilando aplicación (Building)..."
npm run build

# 4. Preparación de la carpeta de despliegue
echo "📂 Creando carpeta de despliegue 'deploy-ui'..."
mkdir -p deploy-ui

# 5. Copia de archivos compilados (Solo lo que necesita el cliente)
cp -r dist/* deploy-ui/

# 6. Generar config.js estático basado en el .env actual
# Esto permite que el front sepa a qué API conectarse sin depender del entorno de Docker
echo "⚙️ Generando config.js para despliegue estático..."

# Extraer valores de .env (con fallbacks)
API_URL=$(grep VITE_API_URL .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
API_PORT=$(grep VITE_API_PORT .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
API_PORT=${API_PORT:-3000}

cat > "deploy-ui/config.js" << EOF
// Configuración estática generada para el despliegue individual
window.__APP_CONFIG__ = {
  apiUrl:  "${API_URL}",
  apiPort: "${API_PORT}"
};
EOF

# 7. Creación del archivo ZIP
echo "🗜️ Creando archivo ZIP (Sin node_modules)..."
if command -v zip >/dev/null 2>&1; then
    zip -r backoffice-ui-deploy.zip deploy-ui > /dev/null
    echo "📦 Archivo generado: backoffice-ui-deploy.zip"
else
    echo "⚠️ Comando 'zip' no encontrado. Creando un .tar.gz en su lugar..."
    tar -czf backoffice-ui-deploy.tar.gz deploy-ui
    echo "📦 Archivo generado: backoffice-ui-deploy.tar.gz"
fi

echo "--------------------------------------------------------"
echo "✅ ¡Listo! El Frontend ha sido empaquetado."
echo "👉 Sube el archivo comprimido a tu servidor o bucket S3."
echo "👉 Recuerda que solo necesitas un servidor web (Nginx, IIS, etc.)."
echo "--------------------------------------------------------"
