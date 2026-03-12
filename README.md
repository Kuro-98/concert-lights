# Concert Lights

Sistema de sincronización de luces para conciertos vía WebSocket.

## URLs en producción

| Página | URL |
|---|---|
| Audiencia (celulares) | `https://tu-app.railway.app/` |
| Controlador (DJ) | `https://tu-app.railway.app/controlador.html` |

## Deploy en Railway (gratis, 5 min)

1. Ve a [railway.app](https://railway.app) → Sign up con GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Sube esta carpeta a un repo de GitHub (o usa "Deploy from local")
4. Railway detecta automáticamente Node.js y ejecuta `npm start`
5. Ve a **Settings → Networking → Generate Domain**
6. ¡Listo! Comparte el link con la audiencia

## Deploy en Render (también gratis)

1. Ve a [render.com](https://render.com) → New Web Service
2. Conecta tu repo de GitHub
3. Build command: `npm install`
4. Start command: `node server.js`
5. Environment: Node

## Deploy en Fly.io

```bash
npm install -g flyctl
fly auth login
fly launch
fly deploy
```

## Correr localmente

```bash
npm install
npm start
# Abre http://localhost:3001/controlador.html  (DJ)
# Abre http://localhost:3001/                  (audiencia)
```

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `3001` | Puerto del servidor |
