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
  console.log('[BOT] Sunucuya baglaniliyor...');
  
  const client = bedrock.createClient({
    host: '46.4.101.93',
    port: 27056,
    username: 'Pis_Fakir',
    offline: true
  });

  client.on('join', () => {
    isServerOnline = true;
    onlinePlayers.set('bot-id', 'Pis_Fakir');
    console.log('[BOT] Oyuna basariyla girdi: Pis_Fakir');
  });

  // 1. YONTEM: Haritada beliren oyuncu paketi (Bedrock ana yakalama yontemi)
  client.on('add_player', (packet) => {
    const name = packet.username;
    if (name && name !== 'Pis_Fakir') {
      onlinePlayers.set(packet.uuid || name, name);
      console.log('>>> [OYUNCU KATILDI - ADD_PLAYER]:', name);
    }
  });

  // 2. YONTEM: Tab listesi paketi
  client.on('player_list', (packet) => {
    if (!packet.records || !packet.records.records) return;
    const type = String(packet.records.type).toLowerCase();

    packet.records.records.forEach(p => {
      const name = p.username || p.name;
      if (!name) return;
      const id = p.uuid || name;

      if (type.includes('add') && name !== 'Pis_Fakir') {
        onlinePlayers.set(id, name);
        console.log('>>> [OYUNCU KATILDI - PLAYER_LIST]:', name);
      } else if (type.includes('remove') && id !== 'bot-id') {
        onlinePlayers.delete(id);
        console.log('>>> [OYUNCU AYRILDI]:', name);
      }
    });
  });

  // 3. YONTEM: Sunucudan gelen tum yazilari loga bas (Test icin)
  client.on('text', (packet) => {
    if (packet.message) {
      console.log('[SUNUCU MESAJI]:', packet.message);
    }
  });

  client.on('disconnect', () => {
    isServerOnline = false;
    onlinePlayers.clear();
    setTimeout(startBot, 10000);
  });

  client.on('error', (err) => {
    console.log('[BOT HATA]:', err.message || err);
    isServerOnline = false;
    onlinePlayers.clear();
    setTimeout(startBot, 10000);
  });
}

startBot();
