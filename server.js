/**
 * Concert Lights — Servidor completo
 * Sirve los archivos HTML Y maneja WebSocket en el mismo proceso.
 * 
 * Deploy en Railway, Render, Fly.io o cualquier VPS.
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;

// ─── HTTP server (sirve los archivos estáticos) ───────────────────────────────
const httpServer = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(__dirname, 'public', urlPath);
  const ext = path.extname(filePath);
  const types = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css' };
  const contentType = types[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// ─── WebSocket server (sobre el mismo puerto HTTP) ────────────────────────────
const wss = new WebSocket.Server({ server: httpServer });

let controller = null;
const audiences = new Map();

function generateId() {
  return 'c_' + Math.random().toString(36).substr(2, 8);
}

function broadcastToAudiences(data) {
  const msg = JSON.stringify(data);
  let sent = 0;
  audiences.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) { ws.send(msg); sent++; }
  });
  return sent;
}

function notifyController(data) {
  if (controller && controller.readyState === WebSocket.OPEN) {
    controller.send(JSON.stringify(data));
  }
}

wss.on('connection', (ws, req) => {
  const clientId = generateId();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[+] ${clientId} desde ${ip}`);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'controller_hello') {
      controller = ws;
      ws._role = 'controller';
      console.log('[DJ] Controlador conectado');
      ws.send(JSON.stringify({ type: 'registered', role: 'controller' }));
      notifyController({ type: 'client_count', count: audiences.size });
      return;
    }

    if (msg.type === 'audience_hello') {
      const id = msg.id || clientId;
      audiences.set(id, ws);
      ws._id = id;
      ws._role = 'audience';
      console.log(`[🎵] Audiencia: ${id} | Total: ${audiences.size}`);
      notifyController({ type: 'client_join', id });
      notifyController({ type: 'client_count', count: audiences.size });
      return;
    }

    if (msg.type === 'color_command' && ws._role === 'controller') {
      const sent = broadcastToAudiences(msg);
      console.log(`[🎨] ${msg.color} [${msg.effect}] → ${sent} celulares`);
      ws.send(JSON.stringify({ type: 'ack', sent }));
      return;
    }
  });

  ws.on('close', () => {
    if (ws._role === 'controller') {
      controller = null;
      console.log('[DJ] Controlador desconectado');
    } else if (ws._role === 'audience') {
      audiences.delete(ws._id);
      console.log(`[🎵] Desconectado: ${ws._id} | Total: ${audiences.size}`);
      notifyController({ type: 'client_leave', id: ws._id });
      notifyController({ type: 'client_count', count: audiences.size });
    }
  });

  ws.on('error', (err) => console.error(`[!] ${clientId}:`, err.message));
});

// Keepalive ping
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.ping();
  });
}, 25000);

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║        Concert Lights  —  Servidor listo     ║
╠══════════════════════════════════════════════╣
║  Puerto : ${PORT}                                ║
║                                              ║
║  Audiencia   →  /             (index.html)   ║
║  Controlador →  /controlador.html            ║
╚══════════════════════════════════════════════╝
`);
});
