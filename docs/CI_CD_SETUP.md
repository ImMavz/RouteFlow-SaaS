# Guía de Configuración CI/CD y Despliegue en VPS — RouteFlow-SaaS

Esta guía contiene las instrucciones exactas para que el propietario del repositorio y del VPS configure el entorno de producción, los secretos de GitHub y los procedimientos operativos (incluyendo rollback).

---

## 1. Configuración de GitHub (Environment y Variables)

El flujo de despliegue continuo utiliza el entorno de GitHub denominado **`production`**.

### 1.1 Crear el Environment
1. En GitHub, navega a **Settings** → **Environments** → **New environment**.
2. Nombre: `production`. Haz clic en **Configure environment**.
3. *(Opcional / Recomendado)*: En **Deployment protection rules**, puedes activar **Required reviewers** y asignarte a ti mismo para autorizar cada despliegue a producción.

### 1.2 Environment Secrets (`production`)
En **Settings** → **Environments** → **production** → **Environment secrets** → **Add Secret**, agrega:

| Secreto | Descripción | Ejemplo / Valor |
|---|---|---|
| `VPS_HOST` | Dirección IP pública o nombre DNS del VPS | `198.51.100.25` o `vps.routeflow.com` |
| `VPS_USER` | Usuario sin privilegios root dedicado al deploy | `deploy` |
| `VPS_PORT` | Puerto del servicio SSH en el VPS | `22` (o el puerto configurado en sshd) |
| `VPS_SSH_KEY` | Contenido de la clave privada SSH (ed25519) | Clave privada generada en el paso 2.1 |
| `VPS_KNOWN_HOSTS` | Salida de `ssh-keyscan` para validación estricta de host | Línea generada en el paso 2.2 |

### 1.3 Repository Variables (Variables Públicas)
En **Settings** → **Secrets and variables** → **Actions** → pestaña **Variables** → **New repository variable**:

| Variable | Descripción | Valor sugerido |
|---|---|---|
| `VITE_API_URL` | URL del backend consumida por el frontend en tiempo de build | `https://api.tu-dominio.com` o `/` |
| `BACKEND_PORT` | Puerto externo del backend para el health check | `3000` |

---

## 2. Preparación del Servidor VPS (Linux Ubuntu/Debian)

Ejecuta los siguientes comandos en el VPS como usuario `root` o con privilegios `sudo`.

### 2.1 Crear Usuario de Despliegue y Permisos de Docker
```bash
# 1. Crear el usuario deploy
sudo adduser --disabled-password --gecos "" deploy

# 2. Agregar usuario deploy al grupo docker
sudo usermod -aG docker deploy

# 3. Crear directorio base de despliegue
sudo mkdir -p /opt/routeflow
sudo chown -R deploy:deploy /opt/routeflow
```

### 2.2 Configurar Clave SSH Exclusiva para GitHub Actions
En tu máquina local (o en una sesión segura temporal):
```bash
# Generar par de claves dedicado sin passphrase
ssh-keygen -t ed25519 -C "github-actions-routeflow" -f ./id_routeflow_deploy

# El archivo 'id_routeflow_deploy' (privada) va en el secreto VPS_SSH_KEY de GitHub.
# El archivo 'id_routeflow_deploy.pub' (pública) se copia al VPS:
```

En el VPS (como usuario `deploy`):
```bash
su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Pegar la clave pública dentro de authorized_keys
cat << 'EOF' >> ~/.ssh/authorized_keys
<PEGA_AQUÍ_EL_CONTENIDO_DE_id_routeflow_deploy.pub>
EOF

chmod 600 ~/.ssh/authorized_keys
```

### 2.3 Obtener `VPS_KNOWN_HOSTS`
Desde tu terminal local (o máquina de confianza), obtén la huella digital del VPS para guardarla en el secreto `VPS_KNOWN_HOSTS`:
```bash
ssh-keyscan -p 22 <IP_O_DOMINIO_DEL_VPS>
```
*Copia exactamente la línea resultante y pégala en el secreto `VPS_KNOWN_HOSTS` en GitHub.*

### 2.4 Autenticación en GHCR (si las imágenes son privadas)
Si el repositorio o sus paquetes en GitHub Container Registry son privados, el usuario `deploy` del VPS debe iniciar sesión una única vez:
1. Crea un Personal Access Token (Classic) en GitHub (**Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**).
2. Selecciona únicamente el permiso: `read:packages`.
3. En el VPS como usuario `deploy`:
```bash
su - deploy
echo "<TU_PERSONAL_ACCESS_TOKEN>" | docker login ghcr.io -u <TU_USUARIO_GITHUB> --password-stdin
```

---

## 3. Despliegue Inicial en el VPS

1. Copia el archivo `compose.production.yml` del repositorio a `/opt/routeflow/compose.production.yml`:
```bash
# En el VPS como usuario deploy
cd /opt/routeflow
# Copia o descarga compose.production.yml en esta carpeta
```

2. Crea el archivo `.env` de producción a partir de la plantilla:
```bash
cd /opt/routeflow
# Crea tu .env con los valores reales (seguridad, base de datos y puertos)
nano .env
chmod 600 .env
```
*(Usa como referencia `.env.production.example` que se encuentra en el repositorio).*

3. Si utilizas el contenedor PostgreSQL integrado con PostGIS, copia la carpeta de scripts SQL:
```bash
mkdir -p /opt/routeflow/database
# Copiar database/schema.sql y database/rls.sql a /opt/routeflow/database/
```

4. Prueba el arranque inicial manual:
```bash
cd /opt/routeflow
IMAGE_TAG=latest docker compose -f compose.production.yml pull
IMAGE_TAG=latest docker compose -f compose.production.yml up -d --remove-orphans
docker compose -f compose.production.yml ps
```

---

## 4. Procedimiento de Rollback Inmediato (Sin Recompilar)

Si una versión recién desplegada presenta fallas críticas, puedes regresar inmediatamente a la versión anterior sin necesidad de compilar código:

1. Localiza el SHA del commit anterior estable en GitHub o en el historial de imágenes de GHCR (ejemplo: `sha-a1b2c3d`).
2. Conéctate por SSH al VPS y ejecuta:
```bash
cd /opt/routeflow

# 1. Definir el tag anterior a restaurar
export IMAGE_TAG="sha-a1b2c3d"

# 2. Descargar la imagen correspondiente a ese commit
docker compose -f compose.production.yml pull

# 3. Levantar los contenedores con la versión previa
docker compose -f compose.production.yml up -d --remove-orphans

# 4. Verificar estado
docker compose -f compose.production.yml ps
```
3. Verifica el endpoint de salud:
```bash
curl -i http://localhost:3000/health
```

> **Nota sobre Base de Datos:** El rollback de imágenes Docker revierte el código de la aplicación. Si la nueva versión aplicó migraciones de base de datos irreversibles o destructivas, asegúrate de aplicar el script de rollback en la base de datos correspondiente.
