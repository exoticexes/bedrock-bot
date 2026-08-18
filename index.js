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

// API Istegi
app.get('/api/status', (req, res) => {
  // Bot oyundaysa ve liste bossa Pis_Fakir'i garanti olarak ekle
  if (isServerOnline && onlinePlayers.size === 0) {
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
  console.log('Sunucuya baglaniliyor...');
  const client = bedrock.createClient({
    host: '46.4.101.93',
    port: 27056,
    username: 'Pis_Fakir',
    offline: true
  });

  client.on('join', () => {
    isServerOnline = true;
    onlinePlayers.set('bot-id', 'Pis_Fakir');
    console.log('Pis_Fakir sunucuya girdi.');
  });

  client.on('player_list', (packet) => {
    if (!packet.records) return;
    
    if (packet.records.type === 'add') {
      packet.records.records.forEach(p => {
        if (p.username) onlinePlayers.set(p.uuid || p.username, p.username);
      });
    } else if (packet.records.type === 'remove') {
      packet.records.records.forEach(p => {
        const id = p.uuid || p.username;
        if (id && onlinePlayers.get(id) !== 'Pis_Fakir') {
          onlinePlayers.delete(id);
        }
      });
    }
  });

  client.on('disconnect', () => {
    isServerOnline = false;
    onlinePlayers.clear();
    setTimeout(startBot, 15000);
  });

  client.on('error', () => {
    isServerOnline = false;
    onlinePlayers.clear();
    setTimeout(startBot, 15000);
  });
}

startBot();
