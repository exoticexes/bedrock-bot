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

  // Gelen ve giden tüm oyuncu paketlerini esnek sekilde yakaliyoruz
  client.on('player_list', (packet) => {
    if (!packet.records || !packet.records.records) return;
    
    const type = String(packet.records.type).toLowerCase();

    if (type.includes('add')) {
      packet.records.records.forEach(p => {
        if (p.username) {
          onlinePlayers.set(p.uuid || p.username, p.username);
          console.log('Oyuncu katildi:', p.username);
        }
      });
    } else if (type.includes('remove')) {
      packet.records.records.forEach(p => {
        const id = p.uuid || p.username;
        if (id && onlinePlayers.get(id) !== 'Pis_Fakir') {
          console.log('Oyuncu ayrildi:', onlinePlayers.get(id));
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
