const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let onlinePlayers = new Map();
let isServerOnline = false;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/status', (req, res) => {
  if (isServerOnline && !onlinePlayers.has('bot-id')) {
    onlinePlayers.set('bot-id', 'Pis_Fakir');
  }

  res.json({
    online: isServerOnline,
    playerCount: onlinePlayers.size,
    players: Array.from(onlinePlayers.values())
  });
});

app.get('/', (req, res) => res.send('Bot ve API Aktif!'));
app.listen(port);

function startBot() {
  const client = bedrock.createClient({
    host: '46.4.101.93',
    port: 27056,
    username: 'Pis_Fakir',
    offline: true
  });

  client.on('join', () => {
    isServerOnline = true;
    onlinePlayers.set('bot-id', 'Pis_Fakir');
    console.log('[BOT] Oyunda: Pis_Fakir');
  });

  // Bedrock sistem mesajlarindaki gizli parameters verisinden oyuncu yakalama
  client.on('text', (packet) => {
    const msg = packet.message || '';
    const params = packet.parameters || [];
    const playerName = params[0];

    // Oyuncu katilma mesajı (%multiplayer.player.joined)
    if (msg.includes('joined') || msg.includes('katildi')) {
      const name = playerName || msg.split(' ')[0];
      if (name && name !== 'Pis_Fakir') {
        onlinePlayers.set(name, name);
        console.log('[OYUNCU KATILDI]:', name);
      }
    }

    // Oyuncu ayrilma mesajı (%multiplayer.player.left)
    if (msg.includes('left') || msg.includes('ayrildi')) {
      const name = playerName || msg.split(' ')[0];
      if (name && name !== 'Pis_Fakir') {
        onlinePlayers.delete(name);
        console.log('[OYUNCU AYRILDI]:', name);
      }
    }
  });

  client.on('disconnect', () => {
    isServerOnline = false;
    onlinePlayers.clear();
    setTimeout(startBot, 10000);
  });

  client.on('error', () => {
    isServerOnline = false;
    onlinePlayers.clear();
    setTimeout(startBot, 10000);
  });
}

startBot();
